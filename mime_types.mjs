const mime_types = {
	"html": "text/html",
	"jpeg": "image/jpeg",
	"jpg": "image/jpeg",
	"png": "image/png",
	"svg": "image/svg+xml",
	"json": "application/json",
	"js": "text/javascript",
	"css": "text/css"
};

const default_mime = "application/octet-stream";

export function getMimeType(filename) {
	const filename_split = filename.split(".");
	if(filename_split.length < 2) return default_mime;

	return mime_types[filename_split.pop()] || default_mime;
}

export default getMimeType;
