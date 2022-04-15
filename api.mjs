import fs from "fs";
import path from "path";

import * as settings from "./settings.mjs";

const music = {};

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
	for(const album of listDirectories(settings.music_folder, artist)) {
		const current_album = listFiles(settings.music_folder, artist, album).filter(x => x !== "cover.jpg");
		current_artist[album] = current_album;
	}
	music[artist] = current_artist;
}

console.log("Loaded Media:", music);

export async function getArtists(url) {
	return Object.keys(music).sort(caseInsensitiveSort);
}

export async function getAlbums(url) {
	const artist = music[url.searchParams.get("artist") || ""];
	if(!artist) return;

	return Object.keys(artist).sort(caseInsensitiveSort);
}

export async function getSongs(url) {
	//only works with musicbrainz default name scheme "00 song title.opus"
	function createSongObject(artist_name, album_name, song_filename) {
		return {
			artist: artist_name,
			album: album_name,
			title: song_filename.slice(3, -5),
			track: parseInt(song_filename.slice(0,3)),
			uri: `${settings.music_uri}${artist_name}/${album_name}/${song_filename}`
		};
	}

	const artist_name = url.searchParams.get("artist") || "";
	const artist = music[artist_name];
	if(!artist) return;

	const album_name = url.searchParams.get("album") || "";
	if(album_name) {
		const album = artist[album_name];
		if(!album) return;
		return album.map(x => createSongObject(artist_name, album_name, x));
	}

	return;
}
