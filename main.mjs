#!/usr/bin/env nodejs

"use strict";

import http from "http";
import fs from "fs";
import path from "path";

import * as settings from "./settings.mjs";
import * as mime_types from "./mime_types.mjs";
import * as api from "./api.mjs";

http.createServer(async (request, response) => {
	function sendResponse(status_code = 500, content_type = mime_types.plain_text, content = "Server Error") {
		response.writeHead(status_code, {"content-type": content_type});
		response.end(content, "binary");
	}

	try {
		const url = new URL(request.url, `http://${request.headers.host}`);

		if(url.pathname.startsWith(settings.api_uri)) {
			const endpoint = api[url.pathname.slice(settings.api_uri.length)];
			if(endpoint) {
				const content = await endpoint(url);
				if(content) return sendResponse(200, mime_types.json, JSON.stringify(content));
				return sendResponse(500, mime_types.plain_text, "Invalid arguments");
			}
			return sendResponse(500, mime_types.plain_text, "Invalid endpoint");
		}

		//send file
		let filename = path.join(settings.webpage_assets_folder, decodeURI(url.pathname));
		if(filename.length < process.cwd()) { //probably not going to get hit, but a precaution (even if it's a poor one)
			return sendResponse(400, mime_types.plain_text, "Invalid path");
		}

		try {
			if(fs.statSync(filename).isDirectory()) filename = path.join(filename, "index.html");
			fs.accessSync(filename, fs.constants.R_OK);
		} catch {
			return sendResponse(404, mime_types.plain_text, "Not found");
		}

		fs.readFile(filename, "binary", (error, data) => {
			if(error) {
				console.log(error.message);
				return sendResponse(500, mime_types.plain_text, `Error: ${error.code} - check the log`);
			}

			return sendResponse(200, mime_types.getFromFilename(filename), data);
		});

	} catch(e) {
		console.error("Unhandled exception:", e);
		return sendResponse();
	}
}).listen(settings.port);
