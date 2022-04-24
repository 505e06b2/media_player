"use strict";

import UnicodeMonospace from "./unicode_monospace.mjs";
import Library from "./library.mjs";
import Elements from "./elements.mjs";
import AudioManager from "./audio_manager.mjs";
import URLManager from "./url_manager.mjs";

function UI(_library) {
	let _content_container;
	let _top_dock_path;
	let _currently_playing_elem;
	let _shuffle_element;
	let _play_pause_button;
	let _repeat_element;
	let _gain_element;
	let _seekbar;

	const list_item_types = {
		playlist: "playlist",
		song: "song"
	};

	const shuffle_icons = {
		true: ")(",
		false: "||"
	};

	const play_pause_icons = {//Needs to be in sync with AudioManager.State
		paused: "+>", //invert since we will play the next time this is clicked
		playing: "][", // ^
		stopped: "[]"
	};

	const repeat_icons = { //Needs to be in sync with AudioManager.Repeat
		none: "(x",
		playlist: "()",
		one: "(1"
	};
	const repeat_icon_states = ["none", "playlist", "one"];

	const _createBoxIndent = (value, array) => {
		return (value === array[array.length-1] ? "└" : "├") + "── ";
	};

	const _createListItem = (name, onclickHandler = null, list_item_data = {song: null, playlist: null}) => {
		const plaintext = name.replace(/[└─├]/gs, "").trim();
		const elem = Elements.create("a", {
			innerText: name
		});

		if(onclickHandler) {
			elem.href = list_item_data.song ? list_item_data.song.uri : `#${plaintext}`;
			elem.onclick = (e) => {onclickHandler(); return false;}
		}

		elem.setAttribute("plain-text", plaintext);

		if(list_item_data.song) {
			elem.setAttribute("uri", list_item_data.song.uri);
			elem.setAttribute("type", list_item_types.song);

			const playlist_check = list_item_data.playlist && list_item_data.playlist === AudioManager.getPlaylist();
			const song_check = list_item_data.song === AudioManager.getSong();
			if(playlist_check && song_check) {
				elem.classList.add("playing");
			}

		} else if(list_item_data.playlist) {
			elem.setAttribute("type", list_item_types.playlist);
			if(AudioManager.getSong() && list_item_data.playlist === AudioManager.getPlaylist()) {
				elem.classList.add("playing");
			}
		}

		return elem;
	};

	const _createPathItem = (name, onclickHandler = () => false) => {
		return Elements.create("a", {
			innerText: name,
			href: `#${name}`,
			title: name,
			onclick: (e) => {onclickHandler(); return false;}
		});
	};

	const _createPathFromPlaylist = (playlist) => {
		const ret = [];
		if(playlist) {
			for(let current = playlist; current != null; current = current.parent) {
				ret.unshift(current);
			}
		}
		return ret;
	}

	const _findPlaylistFromPathString = (path_str) => {
		const path = path_str.split("\x00").slice(-2);
		const playlists = _library.getPlaylists();
		let found_playlist;
		if(path.length > 1) { //has parent
			found_playlist = playlists.find(x => x.parent && x.parent.name === path[0] && x.name === path[1]);
		} else {
			found_playlist = playlists.find(x => x.parent === null & x.name === path[0]);
		}
		return found_playlist;
	}

	const _openFile = async (playlist, song = null) => {
		if(!song) song = playlist.songs[0];
		await AudioManager.setPlaylist(playlist, song);
	};

	const _openFolder = (playlist) => {
		_content_container.innerHTML = "";
		Array.from(_top_dock_path.children).slice(1).map(x => x.outerHTML = "");

		if(playlist !== undefined) { //list songs
			if(playlist instanceof(Library.Playlist) === false) {
				throw `"${playlist}" is an invalid playlist`;
			}

			const playlist_path = _createPathFromPlaylist(playlist);
			let go_back_func = () => _openFolder();
			_top_dock_path.append(_createPathItem(`${playlist.name}/`, () => _openFolder(playlist)));

			for(const x of playlist_path.slice(0, -1)) {
				go_back_func = () => _openFolder(x);
				const next = _createPathItem(`${x.name}/`, () => _openFolder(x));

				_top_dock_path.insertBefore(next, _top_dock_path.children[_top_dock_path.children.length-1]);
			}

			const go_back_elem = _createListItem("..", go_back_func);
			_content_container.append(go_back_elem);

			const folder_structure = playlist_path.map(x => x.name).join("\x00");
			URLManager.updateParam(URLManager.params.folder, folder_structure);

			switch(playlist.type) {
				case "artist":
					if(playlist.children.length) {
						_content_container.append(_createListItem("playlists"));
						for(const child_playlist of playlist.children) {
							const indent = _createBoxIndent(child_playlist, playlist.children);
							_content_container.append(_createListItem(
								`${indent}${child_playlist.name}`,
								() => _openFolder(child_playlist),
								{playlist: child_playlist}
							));
						}
					}

					_content_container.append(_createListItem("songs"));
					for(const song of playlist.songs) {
						const indent = _createBoxIndent(song, playlist.songs);
						_content_container.append(_createListItem(
							`${indent}${song.title}`,
							() => _openFile(playlist, song),
							{song: song, playlist: playlist}
						));
					}
					break;

				case "album":
					go_back_elem.innerText = "    " + go_back_elem.innerText;
					for(const song of playlist.songs) {
						const track_prefx = song.track && song.track.toString().padStart(3) || "   ";
						_content_container.append(_createListItem(
							`${track_prefx} ${song.title}`,
							() => _openFile(playlist, song),
							{song: song, playlist: playlist}
						));
					}
					break;

				default:
					for(const song of playlist.songs) {
						_content_container.append(_createListItem(
							song.title,
							() => _openFile(playlist, song),
							{song: song, playlist: playlist}
						));
					}
			}

		} else { //list top level playlists, with children - orphaned and double-nested (Parent->Child->Child) playlists will not appear
			const top_level = _library.getTopLevelPlaylists();
			for(const playlist of top_level) {
				_content_container.append(_createListItem(
					playlist.name,
					() => _openFolder(playlist),
					{playlist: playlist}
				));
				for(const child of playlist.children) {
					const indent = _createBoxIndent(child, playlist.children);
					_content_container.append(_createListItem(
						`${indent}${child.name}`,
						() => _openFolder(child),
						{playlist: child}
					));
				}
			}

			URLManager.deleteParam(URLManager.params.folder);
		}

		const currently_playing = Elements.find('#content .playing');
		if(currently_playing && currently_playing.getAttribute("type") === list_item_types.song) {
			currently_playing.scrollIntoView({block: "center", inline: "center"});
		} else {
			window.scrollTo(0, 0);
		}
	};

	const constructor = () => {
		_content_container = Elements.find('#content');
		_currently_playing_elem = Elements.find('#currently-playing');
		_shuffle_element = Elements.find('#shuffle');
		_play_pause_button = Elements.find('#play-pause');
		_repeat_element = Elements.find('#repeat');
		_gain_element = Elements.find('#gain');
		_top_dock_path = Elements.find('#top-dock .path');
		_seekbar = Elements.find('#seekbar');

		_play_pause_button.onclick = (e) => {if(AudioManager.state() !== play_pause_icons.stopped) AudioManager.togglePlayPause(); return false;}
		_seekbar.onmousedown = (e) => {AudioManager.seekPercent(e.clientX / window.innerWidth * 100); return false;}

		Elements.find('#root').onclick = () => {_openFolder(); return false;} //root path
		_gain_element.oninput = () => {
			AudioManager.gain(parseInt(_gain_element.value));
			URLManager.updateParam(URLManager.params.gain, gain_element.value);
		}

		Elements.find('#previous').onclick = (e) => {AudioManager.previous(); return false;}
		Elements.find('#next').onclick = (e) => {AudioManager.next(); return false;}

		_shuffle_element.onclick = () => {
			const previous_state = AudioManager.shuffle();
			const new_state = AudioManager.shuffle(!previous_state);
			_shuffle_element.innerText = shuffle_icons[new_state] || shuffle_icons.false;
			URLManager.updateParam(URLManager.params.shuffle, new_state);
			return false;
		};

		_repeat_element.onclick = () => {
			const previous_state = AudioManager.repeat();
			let index = repeat_icon_states.indexOf(previous_state);
			if(++index > repeat_icon_states.length-1) index = 0;
			const new_state = AudioManager.repeat(repeat_icon_states[index]);
			_repeat_element.innerText = repeat_icons[new_state] || repeat_icons.none;
			URLManager.updateParam(URLManager.params.repeat, new_state);
			return false;
		};
	};

	this.parseConfig = () => {
		const params = URLManager.getParams();
		if(params.loadedplaylist !== undefined) {
			if(params.loadedsong !== undefined) {
				const found_playlist = _findPlaylistFromPathString(params.loadedplaylist);
				const found_song = _library.getSongs().find(x => x.metadata_hash === params.loadedsong);
				if(found_playlist && found_song) {
					(async () => {
						await _openFile(found_playlist, found_song);
						AudioManager.pause();
					})();
				}
			}
		}

		if(params.playlist !== undefined) {
			for(const x of params.playlist) {
				console.log("Playlist code", x);
			}
		}

		if(params.fgcolour !== undefined) {
			document.body.style.setProperty("--text-colour", params.fgcolour);
		}

		if(params.bgcolour !== undefined) {
			document.body.style.setProperty("--background", params.bgcolour);
		}

		if(params.dockcolour !== undefined) {
			document.body.style.setProperty("--dock-background", params.dockcolour);
		}

		if(params.gain !== undefined) {
			_gain_element.value = params.gain;
			AudioManager.gain(parseInt(params.gain));
		}

		if(params.shuffle !== undefined) {
			_shuffle_element.innerText = shuffle_icons[params.shuffle];
			AudioManager.shuffle(params.shuffle);
		}

		if(params.repeat !== undefined) {
			const index = repeat_icon_states.indexOf(params.repeat);
			if(index !== -1) {
				_repeat_element.innerText = repeat_icons[params.repeat];
				AudioManager.repeat(params.repeat);
			}
		}

		if(params.folder !== undefined) {
			const found_playlist = _findPlaylistFromPathString(params.folder);
			if(found_playlist) {
				return _openFolder(found_playlist); //return so it doesn't open root
			}
		}

		_openFolder();
	};

	//these are bound to AudioManager events by main.mjs
	this.updatePlayPause = async (current_state) => {
		_play_pause_button.innerText = play_pause_icons[current_state] ?? play_pause_icons.stopped;
	};

	this.updateCurrentlyPlaying = async (playlist, song) => {
		const previous = Elements.find(`#content .playing`);

		if(playlist === null && song === null) {
			_currently_playing_elem.innerText = "nothing playing";
			_currently_playing_elem.title = _currently_playing_elem.innerText;
			_currently_playing_elem.onclick = () => false;
			if(previous) previous.classList.remove("playing");
			URLManager.deleteParam(URLManager.params.loadedplaylist);
			URLManager.deleteParam(URLManager.params.loadedsong);
			return;
		}

		_currently_playing_elem.innerText = song.title;
		_currently_playing_elem.title = song.title;
		_currently_playing_elem.onclick = () => {_openFolder(playlist); return false;}

		document.title = UnicodeMonospace.convert(`${song.title} ＋＞ ${playlist.name}`);
		const playlist_path_str = _createPathFromPlaylist(playlist).map(x => x.name).join("\x00");
		URLManager.updateParam(URLManager.params.loadedplaylist, playlist_path_str);
		URLManager.updateParam(URLManager.params.loadedsong, song.metadata_hash);

		if(previous) { //playing, only change if playlist changed
			const is_playlist = previous.getAttribute("type") === list_item_types.playlist;
			const playlist_is_playing = previous.innerHTML.endsWith(playlist.name);
			if(is_playlist && playlist_is_playing) return;
			previous.classList.remove("playing");

		} else { //stopped, only highlight song if inside playlist
			const playlists_on_page = document.querySelectorAll(`#content a[type="${list_item_types.playlist}"]`);
			const playlist_names = Array.from(playlists_on_page).map(x => x.getAttribute("plain-text"));
			if(playlist_names.includes(playlist.name)) return;
		}

		const current = Elements.find(`#content a[uri="${song.uri}"]`);
		if(current) current.classList.add("playing");
	};

	this.updateSeek = async (percent, current_time) => {
		_seekbar.style.background = `linear-gradient(to right, var(--text-colour) 0%, var(--text-colour) ${percent}%, var(--dock-background) ${percent}%, var(--dock-background) 100%)`;
	};

	constructor();
}

export default UI;
