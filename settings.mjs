import path from "path";

export const port = 5500;
export const api_uri = "/api/";
export const music_uri = "/music/";

export const webpage_assets_folder = path.resolve("./webpage_assets");
export const music_folder = path.join(webpage_assets_folder, music_uri);
