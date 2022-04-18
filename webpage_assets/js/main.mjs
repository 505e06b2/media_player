"use strict";

import Elements from "./elements.mjs";
import Library from "./library.mjs";
import AudioManager from "./audio_manager.mjs";

let library;
let content_container;
let top_dock_path;
let play_pause_button;
let currently_playing_elem;
let seekbar;

function createBoxIndent(value, array) {
	return (value === array[array.length-1] ? "└" : "├") + "── ";
}

function createListItem(name, onclickHandler = null, song = null) {
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
}

function createPathItem(name, onclickHandler = () => false) {
	return Elements.create("a", {
		innerText: name,
		href: `#${name}`,
		title: name,
		onclick: (e) => {onclickHandler(); return false;}
	});
}

function openFolder(playlist) {
	content_container.innerHTML = "";
	Array.from(top_dock_path.children).slice(1).map(x => x.outerHTML = "");

	if(playlist !== undefined) { //list songs
		if(playlist instanceof(Library.Playlist) === false) {
			throw `"${playlist}" is an invalid playlist`;
		}

		top_dock_path.append(createPathItem(`${playlist.name}/`, () => openFolder(playlist)));
		for(let current = playlist.parent; current != null; current = current.parent) {
			const next = createPathItem(`${current.name}/`, () => openFolder(current));
			top_dock_path.insertBefore(next, top_dock_path.children[top_dock_path.children.length-1]);
		}

		switch(playlist.type) {
			case "artist":
				if(playlist.children.length) {
					content_container.append(createListItem("child_playlists"));
					for(const child_playlist of playlist.children) {
						const indent = createBoxIndent(child_playlist, playlist.children);
						content_container.append(createListItem(
							`${indent}${child_playlist.name}`,
							() => openFolder(child_playlist))
						);
					}
				}

				content_container.append(createListItem("songs"));
				for(const song of playlist.songs) {
					const indent = createBoxIndent(song, playlist.songs);
					content_container.append(createListItem(
						`${indent}${song.title}`,
						() => openFile(playlist, song),
						song
					));
				}
				break;

			case "album":
				for(const song of playlist.songs) {
					content_container.append(createListItem(
						`${song.track.toString().padStart(3)} ${song.title}`,
						() => openFile(playlist, song),
						song
					));
				}
				break;

			default:
				for(const song of playlist.songs) {
					content_container.append(createListItem(
						song.title,
						() => openFile(playlist, song),
						song
					));
				}
		}

	} else { //list top level playlists, with children - orphaned and double-nested (Parent->Child->Child) playlists will not appear
		const top_level = library.getTopLevelPlaylists();
		for(const playlist of top_level) {
			content_container.append(createListItem(playlist.name, () => openFolder(playlist)));
			for(const child of playlist.children) {
				const indent = createBoxIndent(child, playlist.children);
				content_container.append(createListItem(
					`${indent}${child.name}`,
					() => openFolder(child))
				);
			}
		}
	}
}

function openFile(playlist, song = null) {
	if(!song) song = playlist.songs[0];
	AudioManager.setPlaylist(playlist, song);
}

function updatePlayPause(current_state) {
	switch(current_state) {
		case "paused":
			play_pause_button.innerText = "+>";
			break;

		case "playing":
			play_pause_button.innerText = "][";
			break;

		default:
			play_pause_button.innerText = "[]";
	}
}

function updateCurrentlyPlaying(playlist, song) {
	if(playlist === null && song === null) { //not tested
		currently_playing_elem.innerText = "nothing playing";
		currently_playing_elem.title = currently_playing_elem.innerText;
		currently_playing_elem.onclick = () => false;
		return;
	}

	currently_playing_elem.innerText = song.title;
	currently_playing_elem.title = song.title;
	currently_playing_elem.onclick = () => {openFolder(playlist); return false;}

	const previous = Elements.find(`#content .playing`);
	if(previous) previous.classList.remove("playing");

	const current = Elements.find(`#content a[uri="${song.uri}"]`);
	if(current) current.classList.add("playing");
}

function updateSeek(percent) {
	seekbar.style.background = `linear-gradient(to right, var(--text-colour) 0%, var(--text-colour) ${percent}%, var(--dock-background) ${percent}%, var(--dock-background) 100%)`;
}

try {
	library = new Library.Library(await(await fetch("api/getLibrary")).json());
	content_container = Elements.find('#content');
	currently_playing_elem = Elements.find('#currently-playing');
	play_pause_button = Elements.find('#play-pause');
	top_dock_path = Elements.find('#top-dock .path');
	seekbar = Elements.find('#seekbar');

	Elements.find('#root').onclick = () => {openFolder(); return false;} //root path
	Elements.find('#volume').oninput = (e) => AudioManager.volume(parseInt(e.target.value));

	AudioManager.bindNewTrack(updateCurrentlyPlaying);

	play_pause_button.onclick = (e) => {AudioManager.togglePlayPause(); return false;}
	AudioManager.bindPlayPause(updatePlayPause);

	seekbar.onclick = (e) => {AudioManager.seek(e.clientX / window.innerWidth * 100); return false;}
	AudioManager.bindTimeUpdate(updateSeek);

	openFolder();

	Elements.find('#loading').style.display = "none";
	Elements.find('#page-container').style.display = "block";
} catch(e) {
	Elements.find('#loading').innerText = `Error! :(\n\nSend ダフティ#0068 a message on Discord\n\n${e}`;
	console.trace(e);
}
