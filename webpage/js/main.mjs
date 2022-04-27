"use strict";

import Elements from "./elements.mjs";
import AudioManager from "./audio_manager.mjs";
import ConfigManager from "./config_manager.mjs";
import UI from "./ui.mjs";

try {
	const ui = new UI();

	AudioManager.bindNewTrack(ui.updateCurrentlyPlaying);
	AudioManager.bindPlayPause(ui.updatePlayPause);
	AudioManager.bindTimeUpdate(ui.updateSeek);

	await ConfigManager.loadConfig(ui);

	window.onkeydown = (e) => {
		switch(e.key) {
			case "j":
				AudioManager.previous();
				break;

			case " ":
			case "k": //like Youtube
				AudioManager.togglePlayPause();
				break;

			case "l":
				AudioManager.next();
				break;

			default:
				return;
		}
		e.preventDefault();
	};

	Elements.find('#loading').style.display = "none";
	Elements.find('#page-container').style.display = "block";
} catch(e) {
	Elements.find('#loading').innerText = `Error! :(\n\nSend ダフティ#0068 a message on Discord\n\n${e}`;
	console.trace(e);
}
