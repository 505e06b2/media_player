"use strict";

import fetch from "node-fetch";

async function getFromPasteGG(code) {
	const api_ret = await (await fetch(`https://api.paste.gg/v1/pastes/${code}?full=true`)).json();
	if(api_ret.status !== "success") return;
	if(api_ret.result.files.length < 1) return;

	const file = api_ret.result.files[0];
	if(file.content.format !== "text") return;
	return file.content.value;
}

async function getFromPastebin(code) {
	return await (await fetch(`https://pastebin.com/raw/${code}`)).text();
}

async function getPaste(code = "") {
	if(code.length < 4) return;

	if(code.length > 16) return await getFromPasteGG(code);
	return await getFromPastebin(code);
}

export default getPaste;
