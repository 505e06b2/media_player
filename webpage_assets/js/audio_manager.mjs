export const Repeat = {
	none: "none",
	playlist: "playlist",
	one: "one"
};

export const State = {
	playing: "playing",
	paused: "paused"
}

function AudioManager() {
	const _audio = new Audio();
	let _current_playlist = null; //Library.Playlist
	let _playlist_index = -1;
	let _repeat = Repeat.playlist;
	let _play_pause_callback = () => null;
	let _new_track_callback = () => null;

	const _playNext = () => {
		if(++_playlist_index >= _current_playlist.songs.length) _playlist_index = 0;
		const song = this.getSong();
		_audio.src = song.uri;
		_audio.play();
		_new_track_callback(this.getPlaylist(), song);
	}

	this.setPlaylist = (playlist, song = null) => {
		this.stop();
		_audio.src = "";

		_playlist_index = -1;
		if(song) {
			_playlist_index = playlist.songs.indexOf(song);
			if(_playlist_index === -1) throw `"${song.title}" is not in ${playlist.name}`;
			_playlist_index--;
		}
		_current_playlist = playlist;
		_playNext();
	};

	this.bindPlayPause = (callback) => _play_pause_callback = callback;
	this.bindNewTrack = (callback) => _new_track_callback = callback;
	_audio.onplay = () => _play_pause_callback(this.state());
	_audio.onpause = () => _play_pause_callback(this.state());
	_audio.onended = () => _playNext();

	this.getSong = () => {
		if(_playlist_index >= 0) return _current_playlist.songs[_playlist_index];
		return null;
	}

	this.getPlaylist = () => {
		return _current_playlist;
	}

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
	this.volume = (set_value) => {
		if(set_value === undefined) return _audio.volume;
		_audio.volume = set_value/100;
		return _audio.volume;
	}
}

export default new AudioManager();
