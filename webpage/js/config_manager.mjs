"use strict";

import LibraryManager from "./library_manager.mjs";
import URLManager from "./url_manager.mjs";
import IconManager from "./icon_manager.mjs";

function ConfigManager() {
	this.params = URLManager.params;

	this.getValue = (name) => URLManager.getParams()[name];
	this.setValue = URLManager.updateParam;
	this.removeValue = URLManager.deleteParam;

	this.loadConfig = async (ui) => {
		const params = URLManager.getParams();
		if(params.fgcolour !== undefined) {
			document.body.style.setProperty("--fg-colour", params.fgcolour);
		}

		if(params.bgcolour !== undefined) {
			document.body.style.setProperty("--bg-colour", params.bgcolour);
		}

		if(params.dockcolour !== undefined) {
			document.body.style.setProperty("--dock-colour", params.dockcolour);
		}

		IconManager.setColours(document.body.style.getPropertyValue("--fg-colour"), document.body.style.getPropertyValue("--dock-colour"));

		if(params.playlist !== undefined) {
			await LibraryManager.addRemotePlaylists(params.playlist);
		}

		if(params.nowplaying !== undefined) {
			ui.setNowPlaying(params.nowplaying);
		}

		if(params.gain !== undefined) {
			ui.setGainValue(params.gain);
		}

		if(params.shuffle !== undefined) {
			ui.setShuffleState(params.shuffle);
		}

		if(params.repeat !== undefined) {
			ui.setRepeatState(params.repeat);
		}

		ui.openFolder(params.folder);
	};
}

export default new ConfigManager();
