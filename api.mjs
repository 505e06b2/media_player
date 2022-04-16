import fs from "fs";
import path from "path";

import * as settings from "./settings.mjs";

const music = {};

//only works with musicbrainz default name scheme "00 song title.opus"
function createSongObject(artist_name, album_name, song_filename) {
	return {
		//artist: artist_name,
		//album: album_name,
		title: song_filename.slice(3, -5),
		track: parseInt(song_filename.slice(0,3)),
		uri: `${settings.music_uri}${artist_name}/${album_name}/${song_filename}`
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
	const current_artist = {};
	for(const album of listDirectories(settings.music_folder, artist).sort(caseInsensitiveSort)) {
		const current_album = listFiles(settings.music_folder, artist, album)
			.filter(x => x !== "cover.jpg")
			.map(x => createSongObject(artist, album, x))
			.sort((a, b) => a.track > b.track ? 1 : -1);
		current_artist[album] = current_album;
	}
	music[artist] = current_artist;
}

console.log("Loaded Media:", JSON.stringify(music, null, 2));

export async function getLibrary(url) {
	return music;
}
