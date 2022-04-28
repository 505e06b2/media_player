"use strict";

import {generateLibraryCache, createPlaylistObject} from "../generate_library_cache.mjs";
import fetch from "node-fetch";

const pastebin_code_regex = /^[a-zA-Z0-9]+$/;
const playlist_tags = {
	name: "#PLAYLIST:"
};

console.log("Generating cache... (this could take some time)");
const cache = await generateLibraryCache();

console.log(`Loaded Media: (${cache["songs"].length} tracks)`);
/* Can get a bit much with too many songs
for(const song of cache["songs"]) {
	console.log("\t", song.artist, "-", song.title);
}
*/

//anything exported is available via /api/*
export async function getLibrary(url) {
	return cache;
}

function _findSongIndexFromUri(song_id) {
	for(const i in cache.songs) {
		const song = cache.songs[i];
		if(song.uri === song_id) return i;
	}
	return -1;
}

//expected a pastebin code, with the text being valid m3u8 (utf8)
export async function getRemotePlaylist(url) {
	const ret = createPlaylistObject("Unnamed Playlist");
	const code = url.searchParams.get("code");
	if(code) {
		const code_valid = pastebin_code_regex.test(code);
		if(code_valid) {
			const playlist_link = `https://pastebin.com/raw/${code}`;
			let raw_playlist;
			try {
				raw_playlist = await (await fetch(playlist_link)).text();
			} catch {}

			if(raw_playlist) {
				const split_on_newline = raw_playlist.split("\r\n"); //pastebin uses DOS \r\n + no newline at end :(

				if(split_on_newline[0] && split_on_newline[0].trim() === "#EXTM3U") {
					for(const raw_line of split_on_newline) {
						const line = raw_line.trim();
						if(line == false) continue; //blank

						if(line[0] === "#") {
							if(line.startsWith(playlist_tags.name)) ret.name = line.slice(playlist_tags.name.length);
							continue;
						}

						let song_url;
						try {
							song_url = new URL(line);
						} catch {
							ret.error = `\"${line}\" is not a valid URL`;
							break;
						}

						const song_uri = decodeURI(song_url.pathname);
						const found_song_index = _findSongIndexFromUri(song_uri);
						if(found_song_index === -1) {
							ret.error = `\"${song_uri}\" is not in the song cache`;
							break;
						}
						ret.song_ids.push(found_song_index);
					}
				} else {
					ret.error = `\"${playlist_link}\" is an invalid M3U file (no #EXTM3U header)`;
				}
			} else {
				ret.error = `Failed to fetch \"${playlist_link}\"`;
			}
		} else {
			ret.error = "\"code\" query parameter is invalid";
		}
	} else {
		ret.error = "\"code\" query parameter not given";
	}
	return ret;
}
