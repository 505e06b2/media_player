import fs from "fs";
import path from "path";

import * as settings from "./settings.mjs";

import * as metadata from "music-metadata";

//musicbrainz picard tagged files expected

/*
!! This does not allow playlists to be made, then files removed from the system as IDs are incremental!!
!! This will also affect playlist when songs are added, as IDs may shift too !!
*/

const music = {
	playlists: [],
	songs: []
};

function createPlaylistObject(name, song_ids = [], type = "created", created = 0, parent = null) {
	return {
		name: name,
		type: type,
		parent: parent,
		creation_date: created || Date.now(),
		song_ids: song_ids
	};
}

function createSongObject(filepath, song_data) {
	return {
		artist: song_data.common.artist,
		album: song_data.common.album,
		title: song_data.common.title,
		track: song_data.common.track.no,
		year: song_data.common.year,
		duration: song_data.format.duration,
		uri: filepath
	};
}

function listDirectories(...folder_path) {
	return fs.readdirSync(path.join(...folder_path), {withFileTypes: true})
		.filter(x => x.isDirectory())
		.map(x => x.name);
}

function listFiles(...folder_path) {
	return fs.readdirSync(path.join(...folder_path), {withFileTypes: true})
		.filter(x => x.isFile())
		.map(x => x.name);
}

function caseInsensitiveSort(a, b) {
	return a.localeCompare(b, "en", {sensitivity: "base"});
}

//generate cache
for(const artist of listDirectories(settings.music_folder)) {
	const artist_song_ids = [];
	const artist_album_playlists = [];
	for(const album of listDirectories(settings.music_folder, artist).sort(caseInsensitiveSort)) {
		const album_songs = [];

		for(const song of listFiles(settings.music_folder, artist, album).filter(x => x !== "cover.jpg")) {
			const path_suffix = path.join(artist, album, song);
			const song_metadata = await metadata.parseFile(path.join(settings.music_folder, path_suffix));
			album_songs.push(createSongObject(path.join(settings.music_uri, path_suffix), song_metadata));
		}

		album_songs.sort((a, b) => a.track > b.track ? 1 : -1);
		const first_id = music["songs"].length;
		music["songs"].push(...album_songs);
		const album_song_ids = Array.from(music["songs"].keys()).slice(first_id);
		artist_song_ids.push(...album_song_ids);

		const album_released = album_songs[0] && new Date(`${album_songs[0].year}`).getTime();
		artist_album_playlists.push(createPlaylistObject(album, album_song_ids, "album", album_released));
	}

	artist_song_ids.sort((a, b) => caseInsensitiveSort(music["songs"][a].title, music["songs"][b].title));
	music["playlists"].push(createPlaylistObject(artist, artist_song_ids, "artist"));
	const artist_playlist_id = music["playlists"].length-1;
	for(const album of artist_album_playlists.sort((a, b) => a.track - b.track)) { //sorting needs a test - would want oldest last?
		album.parent = artist_playlist_id;
		music["playlists"].push(album);
	}
}

console.log("Loaded Media:");
for(const song of music["songs"]) {
	console.log("\t", song.artist, "-", song.title);
}

//anything exported is available via /api/*
export async function getLibrary(url) {
	return music;
}
