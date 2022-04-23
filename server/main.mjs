#!/usr/bin/env nodejs

"use strict";

import http from "http";
import fs from "fs";
import path from "path";

import * as settings from "../settings.mjs";
import * as mime_types from "./mime_types.mjs";
import * as api from "./api.mjs";

function parseRange(range_header, data_length) {
	const range_prefix = "bytes=";

	if(!range_header) return; //no header
	if(!range_header.startsWith(range_prefix)) return; //unit incorrect
	if(range_header.includes(",")) return; //given multiple ranges

	//console.log("range header", range_header);

	try {
		let [start, end] = range_header
			.slice(range_prefix.length)
			.split("-")
			.map(x => parseInt(x, 10));

		if(isNaN(start) && isNaN(end)) return; //invalid range "-"
		if(isNaN(start)) start = 0;
		if(isNaN(end)) end = data_length-1; //zero-index
		if(start >= end) return;

		return {
			start: start,
			end: end
		};

	} catch(e) {
		console.error(`Failed to parse range header: ${range_header}\n`, e);
	}
}

console.log(`Hosting HTTP server on port ${settings.port}`);
http.createServer(async (request, response) => {
	function sendBinaryResponse(status_code = 500, content_type = mime_types.plain_text, content = null, extra_headers = {}) {
		const headers = Object.assign({
			"content-type": content_type,
			"accept-ranges": "bytes",
			"content-length": content.length
		}, extra_headers);

		response.writeHead(status_code, headers);
		response.end(content, "binary");
	}

	function sendTextResponse(status_code = 500, content_type = mime_types.plain_text, content = "Server Error") {
		const headers = {
			"content-type": content_type,
			"accept-ranges": "bytes",
			"content-length": Buffer.byteLength(content, "utf8")
		};
		response.writeHead(status_code, headers);
		response.end(content);
	}

	try {
		const url = new URL(request.url, `http://${request.headers.host}`);

		if(url.pathname.startsWith(settings.api_uri) && url.pathname.endsWith(settings.api_suffix)) {
			const function_name = url.pathname.slice(settings.api_uri.length, -settings.api_suffix.length);
			const endpoint = api[function_name];
			if(endpoint) {
				const content = await endpoint(url);
				if(content) return sendTextResponse(200, mime_types.json, JSON.stringify(content), true);
				return sendTextResponse(500, mime_types.plain_text, "Invalid arguments");
			}
			return sendTextResponse(500, mime_types.plain_text, "Invalid endpoint");
		}

		//send file
		let filename = path.join(settings.webpage_assets_folder, decodeURI(url.pathname));
		if(filename.length < process.cwd()) { //probably not going to get hit, but a precaution (even if it's a poor one)
			return sendTextResponse(400, mime_types.plain_text, "Invalid path");
		}

		let file_stat;
		try {
			file_stat = fs.statSync(filename);
			if(file_stat.isDirectory()) {
				filename = path.join(filename, "index.html");
				file_stat = fs.statSync(filename);
			}
		} catch {
			return sendTextResponse(404, mime_types.plain_text, "Not found");
		}

		fs.readFile(filename, (error, data) => {
			if(error) {
				console.log(error.message);
				return sendTextResponse(500, mime_types.plain_text, `Error: ${error.code} - check the log`);
			}

			const range_data = parseRange(request.headers.range, data.length);
			if(range_data) {
				const sliced_data = data.subarray(range_data.start, range_data.end+1); //zero indexed, to one indexed
				return sendBinaryResponse(206, mime_types.getFromFilename(filename), sliced_data, {
					"content-range": `bytes ${range_data.start}-${range_data.end}/${data.length}`,
					"last-modified": (new Date(file_stat.mtime)).toUTCString()
				});
			}
			return sendBinaryResponse(200, mime_types.getFromFilename(filename), data, {
				"last-modified": (new Date(file_stat.mtime)).toUTCString()
			});
		});

	} catch(e) {
		console.error("Unhandled exception:", e);
		return sendTextResponse();
	}
}).listen(settings.port);
