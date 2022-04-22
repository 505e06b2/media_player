"use strict";

import UnicodeMonospace from "./unicode_monospace.mjs";
import Library from "./library.mjs";
import Elements from "./elements.mjs";
import AudioManager from "./audio_manager.mjs";

function UI(_library) {
	let _content_container;
	let _top_dock_path;
	let _play_pause_button;
	let _currently_playing_elem;
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

	const _createListItem = (name, onclickHandler = null, currently_playing = {song: null, playlist: null}) => {
		const plaintext = name.replace(/[└─├]/gs, "").trim();
		const elem = Elements.create("a", {
			innerText: name
		});

		if(onclickHandler) {
			elem.href = currently_playing.song ? currently_playing.song.uri : `#${plaintext}`;
			elem.onclick = (e) => {onclickHandler(); return false;}
		}

		elem.setAttribute("overlay-text", name); //for use with .playing::after

		if(currently_playing.song) {
			elem.setAttribute("uri", currently_playing.song.uri);
			elem.setAttribute("type", list_item_types.song);
			const playlist_check = currently_playing.playlist && currently_playing.playlist === AudioManager.getPlaylist();
			if(playlist_check && currently_playing.song === AudioManager.getSong()) {
				elem.classList.add("playing");
			}
		} else if(currently_playing.playlist) {
			if(currently_playing.playlist === AudioManager.getPlaylist()) {
				elem.classList.add("playing");
				elem.setAttribute("type", list_item_types.playlist);
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

	const _openFile = (playlist, song = null) => {
		if(!song) song = playlist.songs[0];
		AudioManager.setPlaylist(playlist, song);
	};

	const _openFolder = (playlist) => {
		_content_container.innerHTML = "";
		Array.from(_top_dock_path.children).slice(1).map(x => x.outerHTML = "");

		if(playlist !== undefined) { //list songs
			if(playlist instanceof(Library.Playlist) === false) {
				throw `"${playlist}" is an invalid playlist`;
			}

			_top_dock_path.append(_createPathItem(`${playlist.name}/`, () => _openFolder(playlist)));
			for(let current = playlist.parent; current != null; current = current.parent) {
				const next = _createPathItem(`${current.name}/`, () => _openFolder(current));
				_top_dock_path.insertBefore(next, _top_dock_path.children[_top_dock_path.children.length-1]);
			}

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
		_play_pause_button = Elements.find('#play-pause');
		_top_dock_path = Elements.find('#top-dock .path');
		_seekbar = Elements.find('#seekbar');

		_play_pause_button.onclick = (e) => {if(AudioManager.state() !== play_pause_icons.stopped) AudioManager.togglePlayPause(); return false;}
		_seekbar.onmousedown = (e) => {AudioManager.seekPercent(e.clientX / window.innerWidth * 100); return false;}

		Elements.find('#root').onclick = () => {_openFolder(); return false;} //root path
		Elements.find('#gain').oninput = (e) => AudioManager.gain(parseInt(e.target.value));
		Elements.find('#previous').onclick = (e) => {AudioManager.previous(); return false;}
		Elements.find('#next').onclick = (e) => {AudioManager.next(); return false;}

		Elements.find('#shuffle').onclick = (e) => {
			const previous_state = AudioManager.shuffle();
			const new_state = AudioManager.shuffle(!previous_state);
			e.target.innerText = shuffle_icons[new_state] || shuffle_icons.false;
			return false;
		};

		Elements.find('#repeat').onclick = (e) => {
			const previous_state = AudioManager.repeat();
			let index = repeat_icon_states.indexOf(previous_state);
			if(++index > repeat_icon_states.length-1) index = 0;
			const new_state = AudioManager.repeat(repeat_icon_states[index]);
			e.target.innerText = repeat_icons[new_state] || repeat_icons.none;
			return false;
		};

		_openFolder();
	};

	//these are bound to AudioManager events
	this.updatePlayPause = async (current_state) => {
		_play_pause_button.innerText = play_pause_icons[current_state] ?? play_pause_icons.stopped;
	};

	this.updateCurrentlyPlaying = async (playlist, song) => {
		if(playlist === null && song === null) {
			_currently_playing_elem.innerText = "nothing playing";
			_currently_playing_elem.title = _currently_playing_elem.innerText;
			_currently_playing_elem.onclick = () => false;
			return;
		}

		_currently_playing_elem.innerText = song.title;
		_currently_playing_elem.title = song.title;
		_currently_playing_elem.onclick = () => {_openFolder(playlist); return false;}

		document.title = UnicodeMonospace.convert(`${song.title} ＋＞ ${playlist.name}`);

		const previous = Elements.find(`#content .playing`);
		if(previous) {
			const is_playlist = previous.getAttribute("type") === list_item_types.playlist
			const playlist_is_playing = previous.innerHTML.endsWith(playlist.name);
			if(is_playlist && playlist_is_playing)return;
			previous.classList.remove("playing");
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
