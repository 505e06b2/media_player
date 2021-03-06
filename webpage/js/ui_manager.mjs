"use strict";

import UnicodeMonospace from "./unicode_monospace.mjs";
import LibraryManager from "./library_manager.mjs";
import Elements from "./elements.mjs";
import AudioManager from "./audio_manager.mjs";
import FolderPath from "./folder_path.mjs";
import ConfigManager from "./config_manager.mjs";

function UIManager() {
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
		song: "song",
		button: "button"
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

	this.setNowPlaying = (value) => {
		const folder_path = FolderPath.fromString(value);
		const found_playlist = folder_path.findPlaylist(LibraryManager.getPlaylists());
		if(found_playlist) {
			const found_song = LibraryManager.getSongs().find(x => x.metadata_hash === folder_path.song_hash()); //collisions are not important
			(async () => {
				await _openFile(found_playlist, found_song);
				AudioManager.pause();
			})();
		}
	};

	this.setRepeatState = (state) => {
		const index = repeat_icon_states.indexOf(state);
		if(index !== -1) {
			_repeat_element.innerText = repeat_icons[state];
			AudioManager.repeat(state);
		}
	};

	this.setShuffleState = (state) => {
		if(typeof(state) !== "boolean") return;
		_shuffle_element.innerText = shuffle_icons[state];
		AudioManager.shuffle(state);
	};

	this.setGainValue = (value) => {
		const int_value = parseInt(value);
		if(isNaN(int_value)) return;
		_gain_element.value = int_value;
		AudioManager.gain(int_value);
	};

	const _createBoxIndent = (value, array) => {
		return (value === array[array.length-1] ? "???" : "???") + "?????? ";
	};

	const _createListItem = (name, onclickHandler = null, list_item_data = {song: null, playlist: null}) => {
		const plaintext = name.replace(/[?????????]/gs, "").trim();
		const elem = Elements.create("a", {
			innerText: name
		});

		if(onclickHandler) {
			elem.setAttribute("type", list_item_types.button);
			if(list_item_data.song) elem.href = list_item_data.song.uri;
			elem.onclick = (e) => {onclickHandler(); return false;}
		}

		elem.setAttribute("plain-text", plaintext);

		if(list_item_data.song) {
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
			onclick: (e) => {onclickHandler(); return false;}
		});
	};

	const _openFile = async (playlist, song = null) => {
		if(!song) song = playlist.songs[0];
		await AudioManager.setPlaylist(playlist, song);
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

		Elements.find('#root').onclick = () => {this.openFolder(); return false;} //root path
		_gain_element.oninput = () => {
			AudioManager.gain(parseInt(_gain_element.value));
			ConfigManager.setValue(ConfigManager.params.gain, _gain_element.value);
		}

		Elements.find('#previous').onclick = (e) => {AudioManager.previous(); return false;}
		Elements.find('#next').onclick = (e) => {AudioManager.next(); return false;}

		_shuffle_element.onclick = () => {
			const previous_state = AudioManager.shuffle();
			const new_state = AudioManager.shuffle(!previous_state);
			_shuffle_element.innerText = shuffle_icons[new_state] || shuffle_icons.false;
			ConfigManager.setValue(ConfigManager.params.shuffle, new_state);
			return false;
		};

		_repeat_element.onclick = () => {
			const previous_state = AudioManager.repeat();
			let index = repeat_icon_states.indexOf(previous_state);
			if(++index > repeat_icon_states.length-1) index = 0;
			const new_state = AudioManager.repeat(repeat_icon_states[index]);
			_repeat_element.innerText = repeat_icons[new_state] || repeat_icons.none;
			ConfigManager.setValue(ConfigManager.params.repeat, new_state);
			return false;
		};
	};

	this.openFolder = (playlist) => {
		_content_container.innerHTML = "";
		Array.from(_top_dock_path.children).slice(1).map(x => x.outerHTML = "");

		if(typeof(playlist) === "string") {
			const found_playlist = FolderPath.fromString(playlist).findPlaylist(LibraryManager.getPlaylists());
			playlist = found_playlist ? found_playlist : undefined;
		}

		if(playlist !== undefined) { //list songs
			if(playlist instanceof(LibraryManager.Playlist) === false) {
				throw `"${playlist}" is an invalid playlist`;
			}

			const playlist_path_structure = FolderPath.fromPlaylist(playlist)
			const playlist_path = playlist_path_structure.findPlaylistPath(LibraryManager.getPlaylists());
			let go_back_func = () => this.openFolder();
			_top_dock_path.append(_createPathItem(`${playlist.name}/`, () => this.openFolder(playlist)));

			for(const x of playlist_path.slice(0, -1)) {
				go_back_func = () => this.openFolder(x);
				const next = _createPathItem(`${x.name}/`, () => this.openFolder(x));

				_top_dock_path.insertBefore(next, _top_dock_path.children[_top_dock_path.children.length-1]);
			}

			const go_back_elem = _createListItem("..", go_back_func);
			_content_container.append(go_back_elem);

			ConfigManager.setValue(ConfigManager.params.folder, playlist_path_structure);

			switch(playlist.type) {
				case "artist":
					if(playlist.children.length) {
						_content_container.append(_createListItem("playlists"));
						for(const child_playlist of playlist.children) {
							const indent = _createBoxIndent(child_playlist, playlist.children);
							_content_container.append(_createListItem(
								`${indent}${child_playlist.name}`,
								() => this.openFolder(child_playlist),
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
			const created_playlists = LibraryManager.getCreatedPlaylists();
			if(created_playlists.length) {
				for(const playlist of created_playlists) {
					_content_container.append(_createListItem(
						playlist.name,
						() => this.openFolder(playlist),
						{playlist: playlist}
					));
				}

				_content_container.append(_createListItem(" "));
			}

			const artist_playlists = LibraryManager.getArtistPlaylists();
			for(const playlist of artist_playlists) {
				_content_container.append(_createListItem(
					playlist.name,
					() => this.openFolder(playlist),
					{playlist: playlist}
				));
				for(const child of playlist.children) {
					const indent = _createBoxIndent(child, playlist.children);
					_content_container.append(_createListItem(
						`${indent}${child.name}`,
						() => this.openFolder(child),
						{playlist: child}
					));
				}
			}

			ConfigManager.removeValue(ConfigManager.params.folder);
		}

		const currently_playing = Elements.find('#content .playing');
		if(currently_playing && currently_playing.getAttribute("type") === list_item_types.song) {
			currently_playing.scrollIntoView({block: "center", inline: "center"});
		} else {
			window.scrollTo(0, 0);
		}
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

			document.title = "????????????????????_????????????????????????";
			ConfigManager.removeValue(ConfigManager.params.nowplaying);
			return;
		}

		_currently_playing_elem.innerText = song.title;
		_currently_playing_elem.title = song.title;
		_currently_playing_elem.onclick = () => {this.openFolder(playlist); return false;}

		document.title = UnicodeMonospace.convert(`${song.title} ?????? ${playlist.name}`);
		ConfigManager.setValue(ConfigManager.params.nowplaying, FolderPath.fromPlaylist(playlist).appendSong(song));

		const folder_path = ConfigManager.getValue(ConfigManager.params.folder);
		const playlist_folder_path = FolderPath.fromPlaylist(playlist).toString();

		if(folder_path === playlist_folder_path) { //currently playing playlist is open
			if(previous) previous.classList.remove("playing");
			const escaped_quotes = song.uri.replace(/"/g, "\\\"");
			const current = Elements.find(`#content a[href="${escaped_quotes}"]`);
			if(current) current.classList.add("playing");
		}
	};

	this.updateSeek = async (percent, current_time) => {
		_seekbar.style.background = `linear-gradient(to right, var(--fg-colour) 0%, var(--fg-colour) ${percent}%, var(--dock-colour) ${percent}%, var(--dock-colour) 100%)`;
	};

	constructor();
}

export default new UIManager();
