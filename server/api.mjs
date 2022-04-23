"use strict";

import generateLibraryCache from "../generate_library_cache.mjs";

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
