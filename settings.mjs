"use strict";

import path from "path";

export const port = 5500;
export const song_metadata_cache = "song_metadata_cache.json";
export const api_uri = "/api/";
export const api_suffix = ".json";
export const music_uri = "/music/";
export const default_colours = {
	fg: "#1fff50",
	bg: "#023300"
};

export const webpage_assets_folder = path.resolve("./webpage");
export const music_folder = path.join(webpage_assets_folder, music_uri);
