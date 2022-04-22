"use strict";

import MediaSessionManager from "./mediasession_manager.mjs";

export const Repeat = {
	none: "none",
	playlist: "playlist",
	one: "one"
};

export const State = {
	playing: "playing",
	paused: "paused",
	stopped: "stopped"
}

function AudioManager() {
	const _audio = new Audio();
	const _audio_context = new AudioContext();
	const _gain_node = _audio_context.createGain();

	let _current_playlist = null; //Library.Playlist
	let _playlist_index = -1;
	let _repeat = Repeat.playlist;
	let _shuffle = false;
	let _play_pause_callback = () => null;
	let _new_track_callback = () => null;
	let _time_update_callback = () => null;

	this.getSong = () => {
		if(_playlist_index >= 0) return _current_playlist.songs[_playlist_index];
		return null;
	};

	this.getPlaylist = () => _current_playlist;

	this.setPlaylist = (playlist, song = null) => {
		this.pause();

		_playlist_index = -1;
		if(song) {
			_playlist_index = playlist.songs.indexOf(song);
			if(_playlist_index === -1) throw `"${song.title}" is not in ${playlist.name}`;
			_playlist_index--;
		}
		_current_playlist = playlist;
		_playNext(false, true);
	};

	const constructor = () => {
		const audio_source = _audio_context.createMediaElementSource(_audio);

		audio_source.connect(_gain_node);
		_gain_node.connect(_audio_context.destination);
	};

	const _playNext = async (go_back = false, ignore_shuffle = false) => {
		if(!_current_playlist) return;
		if(go_back) {
			if(--_playlist_index < 0) _playlist_index = _current_playlist.songs.length-1;

		} else if(ignore_shuffle === false && _shuffle) {
			const previous_index = _playlist_index;
			while(_playlist_index === previous_index) {
				_playlist_index = Math.floor(Math.random() * _current_playlist.songs.length);
			}

		} else {
			if(++_playlist_index >= _current_playlist.songs.length) {
				if(_repeat !== Repeat.playlist) { //not tested - move to onended?
					_playlist_index = -1;
					_new_track_callback(null, null);
					_play_pause_callback(State.stopped);
					_time_update_callback(100.0);
					return;
				}
				_playlist_index = 0;
			}
		}

		const song = this.getSong();
		const playlist = this.getPlaylist();

		_audio.src = song.uri;
		_new_track_callback(playlist, song);
		await _audio.play();

		MediaSessionManager.setMetadata(playlist, song);
		MediaSessionManager.setPositionState(0, song.duration, 1);
		MediaSessionManager.setPlaybackState(State.playing);
		_bindMediaSessionCallbacks();
	};

	const _bindMediaSessionCallbacks = () => {
		MediaSessionManager.bind("play", this.play);
		MediaSessionManager.bind("pause", this.pause);
		MediaSessionManager.bind("stop", this.stop);
		MediaSessionManager.bind("previoustrack", this.previous);
		MediaSessionManager.bind("nexttrack", this.next);
		MediaSessionManager.bind("seekto", (values) => this.seek(values.seekTime));
	}

	this.bindTimeUpdate = (callback) => _time_update_callback = callback;
	this.bindPlayPause = (callback) => _play_pause_callback = callback;
	this.bindNewTrack = (callback) => _new_track_callback = callback;

	_audio.onended = async () => await _playNext();
	_audio.onplay = _audio.onpause = () => {
		_audio_context.resume(); //required for mobile, since this will have been executed via user action
		const state = this.state();
		MediaSessionManager.setPlaybackState(state);
		_play_pause_callback(state);
	};
	_audio.ontimeupdate = () => _time_update_callback(this.seekPercent(), this.seek());

	this.state = () => _audio.paused ? State.paused : State.playing;
	this.pause = () => _audio.pause();
	this.play = async () => await _audio.play();
	this.togglePlayPause = async () => {
		if(!_audio.src) return;
		const state = this.state();
		state === State.playing ? this.pause() : await this.play();
	};
	this.stop = () => {
		_audio.pause();
		_audio.currentTime = 0;
	};

	this.previous = async () => await _playNext(true);
	this.next = async () => await _playNext();

	this.shuffle = (set_value) => {
		if(set_value === undefined) return _shuffle;
		_shuffle = set_value;
		return _shuffle;
	}

	this.repeat = (set_value) => {
		if(set_value === undefined) return _repeat;
		_repeat = set_value;
		if(_repeat === Repeat.one) {
			_audio.loop = true;
		} else {
			_audio.loop = false;
		}
		return _repeat;
	};

	//use gain for finer control
	this.volume = (set_percent_value) => {
		if(set_percent_value === undefined) return _audio.volume;
		_audio.volume = 1 - Math.pow(10, -set_percent_value/100);
		return _audio.volume;
	};

	this.gain = (set_percent_value) => {
		if(set_percent_value === undefined) return _gain_node.gain.value;
		_gain_node.gain.value = 1 - Math.pow(10, -set_percent_value/100);
		return _gain_node.gain.value;
	};

	this.seekPercent = (set_value) => {
		const song = this.getSong();
		const song_not_seekable = _audio.seekable.length && _audio.seekable.end(0) === 0;
		if(set_value === undefined || song_not_seekable) return _audio.currentTime / song.duration * 100;
		_audio.currentTime = set_value / 100 * song.duration;
		MediaSessionManager.setPositionState(_audio.currentTime, _audio.duration, _audio.playbackRate);
		return _audio.currentTime;
	};

	this.seek = (set_value) => {
		const song_not_seekable = _audio.seekable.length && _audio.seekable.end(0) === 0;
		if(set_value === undefined || song_not_seekable) return _audio.currentTime;
		_audio.currentTime = set_value;
		MediaSessionManager.setPositionState(set_value, _audio.duration, _audio.playbackRate);
		return _audio.currentTime;
	};

	constructor();
}

export default new AudioManager();
