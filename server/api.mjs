"use strict";

import * as settings from "./settings.mjs";
import generateLibraryCache from "./generate_library_cache.mjs";

const cache = await generateLibraryCache(settings.music_folder, settings.music_uri);

console.log("Loaded Media:");
for(const song of cache["songs"]) {
	console.log("\t", song.artist, "-", song.title);
}

//anything exported is available via /api/*
export async function getLibrary(url) {
	return cache;
}
