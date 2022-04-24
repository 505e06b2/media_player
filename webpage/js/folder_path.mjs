"use strict";

const path_separator = "\xff";
const value_delimiter = "\x00";

function FolderPath(path) {
	this.value = () => path;

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
		return new FolderPath(path_str.split(path_separator));
	}
};
