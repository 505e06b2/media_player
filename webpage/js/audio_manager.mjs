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
	let _current_playlist = null; //Library.Playlist
	let _playlist_index = -1;
	let _repeat = Repeat.playlist;
	let _play_pause_callback = () => null;
	let _new_track_callback = () => null;
	let _time_update_callback = () => null;

	this.getSong = () => {
		if(_playlist_index >= 0) return _current_playlist.songs[_playlist_index];
		return null;
	};

	this.getPlaylist = () => _current_playlist;

	this.setPlaylist = (playlist, song = null) => {
		//this.stop();
		this.pause();

		_playlist_index = -1;
		if(song) {
			_playlist_index = playlist.songs.indexOf(song);
			if(_playlist_index === -1) throw `"${song.title}" is not in ${playlist.name}`;
			_playlist_index--;
		}
		_current_playlist = playlist;
		_playNext();
	};

	const _playNext = (go_back = false) => {
		if(!_current_playlist) return;
		if(go_back) {
			if(--_playlist_index < 0) _playlist_index = _current_playlist.songs.length-1;
		} else {
			if(++_playlist_index >= _current_playlist.songs.length) {
				if(_repeat !== Repeat.playlist) { //not tested
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
		_audio.play();
		MediaSessionManager.setMetadata(playlist, song);
		_new_track_callback(playlist, song);
	};

	this.bindTimeUpdate = (callback) => _time_update_callback = callback;
	this.bindPlayPause = (callback) => _play_pause_callback = callback;
	this.bindNewTrack = (callback) => _new_track_callback = callback;

	_audio.onended = () => _playNext();
	_audio.onplay = _audio.onpause = () => {
		const state = this.state();
		MediaSessionManager.setPlaybackState(state);
		_play_pause_callback(state);
	};
	_audio.ontimeupdate = () => {
		MediaSessionManager.setPositionState(_audio, this.getSong().duration);
		_time_update_callback(this.seekPercent(), this.seek());
	};

	this.state = () => _audio.paused ? State.paused : State.playing;
	this.pause = () => _audio.pause();
	this.play = () => _audio.play();
	this.togglePlayPause = () => {
		if(!_audio.src) return;
		const state = this.state();
		state === State.playing ? this.pause() : this.play();
	};
	this.stop = () => {
		_audio.pause();
		_audio.currentTime = 0;
	};

	this.previous = () => _playNext(true);
	this.next = () => _playNext();

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

	this.volume = (set_percent_value) => {
		if(set_percent_value === undefined) return _audio.volume;
		_audio.volume = 1 - Math.pow(10, -set_percent_value/100);
		return _audio.volume;
	};

	this.seekPercent = (set_value) => {
		const song = this.getSong();
		const song_not_seekable = _audio.seekable.length && _audio.seekable.end(0) === 0;
		if(set_value === undefined || song_not_seekable) return _audio.currentTime / song.duration * 100;
		_audio.currentTime = set_value / 100 * song.duration;
		return _audio.currentTime;
	};

	this.seek = (set_value) => {
		const song_not_seekable = _audio.seekable.length && _audio.seekable.end(0) === 0;
		if(set_value === undefined || song_not_seekable) return _audio.currentTime;
		_audio.currentTime = set_value;
		return _audio.currentTime;
	};

	MediaSessionManager.bind("play", () => this.togglePlayPause());
	MediaSessionManager.bind("pause", () => this.togglePlayPause());
	MediaSessionManager.bind("stop", null);
	MediaSessionManager.bind("previoustrack", () => this.previous());
	MediaSessionManager.bind("nexttrack", () => this.next());
	MediaSessionManager.bind("seekto", (values) => this.seek(values.seekTime));
}

export default new AudioManager();
