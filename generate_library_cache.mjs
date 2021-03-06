#!/usr/bin/env nodejs

"use strict";

import fs from "fs";
import path from "path";
import url from "url";
import * as settings from "./settings.mjs";

import * as metadata from "music-metadata";
import farmhash from "farmhash";

//musicbrainz picard tagged files expected

/*
Playlist could be valid m3u files that use the link for each song instead of an ID
*/

export function createPlaylistObject(name, song_ids = [], type = "created", created = 0, parent = null) {
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
		metadata_hash: "nohash", //don't rely on this for finding songs - use uri if possible as it is guaranteed to be unique
		artist: song_data.common.artist,
		album: song_data.common.album,
		title: song_data.common.title,
		track: song_data.common.track.no,
		disk: song_data.common.disk.no,
		year: song_data.common.year,
		duration: song_data.format.duration,
		uri: filepath
	};
}

function loadSongCacheFile() {
	try {
		const file_contents = fs.readFileSync(settings.song_metadata_cache, {encoding: "utf8"});
		return JSON.parse(file_contents);
	} catch(e) {
		console.error("Failed to load song cache, using default value\n", e.toString());
	}
	return {};
}

function saveSongCacheFile(contents) {
	fs.writeFileSync(settings.song_metadata_cache, JSON.stringify(contents));
}

function listDirectories(...folder_path) {
	return fs.readdirSync(path.join(...folder_path), {withFileTypes: true})
		.filter(x => x.isDirectory() || x.isSymbolicLink())
		.map(x => x.name);
}

function listFiles(...folder_path) {
	return fs.readdirSync(path.join(...folder_path), {withFileTypes: true})
		.filter(x => x.isFile() || x.isSymbolicLink())
		.map(x => x.name);
}

function caseInsensitiveSort(a, b) {
	return a.localeCompare(b, "en", {sensitivity: "base"});
}

function sortAlbumTrack(a, b) {
	//disk number
	const a_disk_number = a.disk || Infinity;
	const b_disk_number = b.disk || Infinity;
	if(a_disk_number === b_disk_number) {
		//track number
		const a_track_number = a.track || Infinity;
		const b_track_number = b.track || Infinity;
		if(a_track_number === b_track_number) {
			//alphabetical
			return caseInsensitiveSort(a.title, b.title);
		}
		return a_track_number - b_track_number;
	}
	return a_disk_number - b_disk_number;
}

/*
The speed of this algorithm seems to be dependant on the implementation of metadata.parseFile
It is advised to parse them synchronously, but there is a noticable speed improvement if this is done per-artist
With 400-ish songs:
- Synchronous: ~27s
- Per-Artist (biggest artist having 187 songs): ~22s
- Asynchronous: ~35s
*/
export async function generateLibraryCache() {
	const song_metadata_cache = loadSongCacheFile();
	const library = {
		playlists: [],
		songs: []
	};

	for(const artist of listDirectories(settings.music_folder)) {
		const artist_song_ids = [];
		const artist_album_playlists = [];
		for(const album of listDirectories(settings.music_folder, artist).sort(caseInsensitiveSort)) {
			const album_songs = [];

			const promises = [];

			for(const song of listFiles(settings.music_folder, artist, album).filter(x => x !== "cover.jpg")) {
				const path_suffix = path.join(artist, album, song);
				const file_path = path.join(settings.music_folder, path_suffix);
				const file_uri = path.join(settings.music_uri, path_suffix);
				promises.push((async () => {
					let song_metadata = song_metadata_cache[file_uri];
					if(song_metadata === undefined) {
						song_metadata = createSongObject(file_uri, await metadata.parseFile(file_path));
						const hash = farmhash.fingerprint64(JSON.stringify(song_metadata));
						song_metadata.metadata_hash = BigInt(hash).toString(16);
						song_metadata_cache[file_uri] = song_metadata;
					}
					return song_metadata;
				})());
			}

			for(const x of promises) album_songs.push(await x);

			album_songs.sort(sortAlbumTrack);
			const first_id = library["songs"].length;
			library["songs"].push(...album_songs);
			const album_song_ids = Array.from(library["songs"].keys()).slice(first_id);
			artist_song_ids.push(...album_song_ids);

			const album_released = album_songs[0] && new Date(`${album_songs[0].year}`).getTime();
			artist_album_playlists.push(createPlaylistObject(album, album_song_ids, "album", album_released));
		}

		artist_song_ids.sort((a, b) => caseInsensitiveSort(library["songs"][a].title, library["songs"][b].title)); //for "master" playlist
		library["playlists"].push(createPlaylistObject(artist, artist_song_ids, "artist"));
		const artist_playlist_id = library["playlists"].length-1;
		for(const album of artist_album_playlists) {
			album.parent = artist_playlist_id;
			library["playlists"].push(album);
		}
	}

	saveSongCacheFile(song_metadata_cache);

	return library;
}

if(import.meta.url === url.pathToFileURL(process.argv[1]).href) {
	console.log(JSON.stringify(await generateLibraryCache()));
}

export default generateLibraryCache;
