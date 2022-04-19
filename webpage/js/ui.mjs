"use strict";

import UnicodeMonospace from "./unicode_monospace.mjs";
import Library from "./library.mjs";
import Elements from "./elements.mjs";
import AudioManager from "./audio_manager.mjs";

function UI() {
	let _library;
	let _content_container;
	let _top_dock_path;
	let _play_pause_button;
	let _currently_playing_elem;
	let _seekbar;

	const _createBoxIndent = (value, array) => {
		return (value === array[array.length-1] ? "└" : "├") + "── ";
	};

	const _createListItem = (name, onclickHandler = null, song = null) => {
		const plaintext = name.replace(/[└─├]/gs, "").trim();
		const elem = Elements.create("a", {
			innerText: name
		});

		if(onclickHandler) {
			elem.href = `#${plaintext}`;
			elem.onclick = (e) => {onclickHandler(); return false;}
		}

		if(song) {
			elem.setAttribute("overlay-text", name);
			elem.setAttribute("uri", song.uri);
			if(song === AudioManager.getSong()) {
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

	const _openFile = (playlist, song = null) => {
		if(!song) song = playlist.songs[0];
		AudioManager.setPlaylist(playlist, song);
	}

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
						_content_container.append(_createListItem("child_playlists"));
						for(const child_playlist of playlist.children) {
							const indent = _createBoxIndent(child_playlist, playlist.children);
							_content_container.append(_createListItem(
								`${indent}${child_playlist.name}`,
								() => _openFolder(child_playlist))
							);
						}
					}

					_content_container.append(_createListItem("songs"));
					for(const song of playlist.songs) {
						const indent = _createBoxIndent(song, playlist.songs);
						_content_container.append(_createListItem(
							`${indent}${song.title}`,
							() => _openFile(playlist, song),
							song
						));
					}
					break;

				case "album":
					for(const song of playlist.songs) {
						_content_container.append(_createListItem(
							`${song.track.toString().padStart(3)} ${song.title}`,
							() => _openFile(playlist, song),
							song
						));
					}
					break;

				default:
					for(const song of playlist.songs) {
						_content_container.append(_createListItem(
							song.title,
							() => _openFile(playlist, song),
							song
						));
					}
			}

		} else { //list top level playlists, with children - orphaned and double-nested (Parent->Child->Child) playlists will not appear
			const top_level = _library.getTopLevelPlaylists();
			for(const playlist of top_level) {
				_content_container.append(_createListItem(playlist.name, () => _openFolder(playlist)));
				for(const child of playlist.children) {
					const indent = _createBoxIndent(child, playlist.children);
					_content_container.append(_createListItem(
						`${indent}${child.name}`,
						() => _openFolder(child))
					);
				}
			}
		}

		const currently_playing_song = Elements.find('#content .playing');
		if(currently_playing_song) {
			currently_playing_song.scrollIntoView({block: "center", inline: "center"});
		}
	};

	this.initialise = (library) => {
		_library = library;
		_content_container = Elements.find('#content');
		_currently_playing_elem = Elements.find('#currently-playing');
		_play_pause_button = Elements.find('#play-pause');
		_top_dock_path = Elements.find('#top-dock .path');
		_seekbar = Elements.find('#seekbar');

		_play_pause_button.onclick = (e) => {AudioManager.togglePlayPause(); return false;}
		_seekbar.onmousedown = (e) => {AudioManager.seekPercent(e.clientX / window.innerWidth * 100); return false;}

		Elements.find('#root').onclick = () => {_openFolder(); return false;} //root path
		Elements.find('#volume').oninput = (e) => AudioManager.volume(parseInt(e.target.value));
		Elements.find('#previous').onclick = (e) => {AudioManager.previous(); return false;}
		Elements.find('#next').onclick = (e) => {AudioManager.next(); return false;}

		_openFolder();
	};

	this.updatePlayPause = (current_state) => {
		switch(current_state) {
			case "paused":
				_play_pause_button.innerText = "+>";
				navigator.mediaSession.playbackState = "paused";
				break;

			case "playing":
				_play_pause_button.innerText = "][";
				navigator.mediaSession.playbackState = "playing";
				break;

			default:
				_play_pause_button.innerText = "[]";
		}
	}

	this.updateCurrentlyPlaying = (playlist, song) => {
		if(playlist === null && song === null) { //not tested
			_currently_playing_elem.innerText = "nothing playing";
			_currently_playing_elem.title = _currently_playing_elem.innerText;
			_currently_playing_elem.onclick = () => false;
			return;
		}

		navigator.mediaSession.metadata = new MediaMetadata({
			title: song.title,
			artist: song.artist,
			album: playlist.name,
			artwork: [
				{src: "icon.png", type: "image/png"},
			]
		});
		navigator.mediaSession.playbackState = "playing";

		_currently_playing_elem.innerText = playlist.name;
		_currently_playing_elem.title = playlist.name;
		_currently_playing_elem.onclick = () => {_openFolder(playlist); return false;}

		const previous = Elements.find(`#content .playing`);
		if(previous) previous.classList.remove("playing");

		const current = Elements.find(`#content a[uri="${song.uri}"]`);
		if(current) current.classList.add("playing");

		document.title = UnicodeMonospace.convert(`${song.title} ＋＞ ${playlist.name}`);
	}

	this.updateSeek = (percent, current_time) => {
		_seekbar.style.background = `linear-gradient(to right, var(--text-colour) 0%, var(--text-colour) ${percent}%, var(--dock-background) ${percent}%, var(--dock-background) 100%)`;
		navigator.mediaSession.setPositionState({
			position: current_time,
			duration: AudioManager.getSong().duration
		});
	}
}

export default new UI();
