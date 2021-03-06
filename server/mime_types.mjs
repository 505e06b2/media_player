"use strict";

export const extensions = {
	"html": "text/html",
	"jpeg": "image/jpeg",
	"jpg": "image/jpeg",
	"png": "image/png",
	"svg": "image/svg+xml",
	"json": "application/json",
	"js": "text/javascript",
	"mjs": "text/javascript",
	"css": "text/css",
	"txt": "text/plain",
	"opus": "audio/ogg",
	"ttf": "font/ttf",
	"woff": "font/woff"
};

export const default_mime = "application/octet-stream";
export const plain_text = extensions["txt"];
export const json = extensions["json"];

export function getFromFilename(filename) {
	const filename_split = filename.split(".");
	if(filename_split.length < 2) return default_mime;

	return extensions[filename_split.pop()] || default_mime;
}
