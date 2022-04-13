#!/usr/bin/env nodejs

const port = 5500;
const webpage_assets_folder = "./webpage_assets";

import http from "http";
import fs from "fs";
import path from "path";

import getMimeType from "./mime_types.mjs";

http.createServer(async (request, response) => {
	const url = new URL(request.url, `http://${request.headers.host}`);

	//send physical file
	let filename = path.join(process.cwd(), webpage_assets_folder, url.pathname);
	if(filename.length < process.cwd()) { //probably not going to get hit, but a precaution (even if it's a poor one)
		response.writeHead(400, {"Content-Type": "text/plain"});
		response.end("Invalid path");
		return;
	}

	try {
		if(fs.statSync(filename).isDirectory()) filename = path.join(filename, "index.html");
	} catch {
		response.writeHead(404, {"Content-Type": "text/plain"});
		response.end("Not found");
		return;
	}

	fs.readFile(filename, "binary", (error, data) => {
		if(error) {
			response.writeHead(500, {"Content-Type": "text/plain"});
			response.end(error);
			return;
		}

		response.writeHead(200, {"Content-Type": getMimeType(filename)});
		response.write(data, "binary");
		response.end();
	});
}).listen(port);
