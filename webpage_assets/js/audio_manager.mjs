export const Repeat = {
	none: "none",
	playlist: "playlist",
	one: "one"
};

function AudioManager() {
	const _audio = new Audio();
	let _current_playlist = null; //Library.Playlist
	let _playlist_index = -1;
	let _repeat = Repeat.playlist;

	const _playNext = () => {
		if(++_playlist_index >= _current_playlist.songs.length) _playlist_index = 0;
		_audio.src = _current_playlist.songs[_playlist_index].uri;
		_audio.play();
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

	this.pause = () => _audio.pause();
	this.play = () => _audio.play();
	this.stop = () => {
		_audio.pause();
		_audio.currentTime = 0;
	};
	this.repeat = (set_value) => {
		if(set_value !== undefined) return _repeat;
		_repeat = set_value;
		if(_repeat === Repeat.one) {
			_audio.loop = true;
		} else {
			_audio.loop = false;
		}
	}
}

export default new AudioManager();
