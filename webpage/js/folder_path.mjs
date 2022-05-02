"use strict";

const path_separator = "\x0f";
const value_delimiter = "\x00";

function FolderPath(path, song_metadata_hash) {
	this.value = () => path;
	this.song_hash = () => song_metadata_hash;

	this.findPlaylist = (all_playlists) => {
		let found_playlist;
		if(path.length > 1) { //has parent
			found_playlist = all_playlists.find(x => x.parent && x.parent.name === path[0] && x.name === path[1]);
		} else {
			found_playlist = all_playlists.find(x => x.parent === null & x.name === path[0]);
		}
		return found_playlist;
	}

	this.findPlaylistPath = (all_playlists) => {
		const ret = [];
		const child = this.findPlaylist(all_playlists);
		if(child) {
			for(let current = child; current !== null; current = current.parent) {
				ret.unshift(current);
			}
		}
		return ret;
	};

	this.appendSong = (song) => {
		song_metadata_hash = song.metadata_hash;
		return `${this.toString()}${value_delimiter}${song_metadata_hash}`;
	};

	this.toDisplayString = () => {
		return this.value().join(" / ");
	}

	this.toString = () => {
		return this.value().join(path_separator);
	}
}

export default {
	fromPlaylist: (playlist) => {
		const path = [];
		if(playlist) {
			for(let current = playlist; current != null; current = current.parent) {
				path.unshift(current.name);
			}
		}
		return new FolderPath(path);
	},

	fromString: (path_str) => {
		const [folder_path_raw, song_hash] = path_str.split(value_delimiter);
		return new FolderPath(folder_path_raw.split(path_separator), song_hash);
	}
};
