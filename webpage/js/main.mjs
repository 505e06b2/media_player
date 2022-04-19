"use strict";

import Library from "./library.mjs";
import Elements from "./elements.mjs";
import AudioManager from "./audio_manager.mjs";
import UI from "./ui.mjs";

try {
	const library = new Library.Library(await(await fetch("api/getLibrary")).json());

	UI.initialise(library);

	AudioManager.bindNewTrack(UI.updateCurrentlyPlaying);
	AudioManager.bindPlayPause(UI.updatePlayPause);
	AudioManager.bindTimeUpdate(UI.updateSeek);

	navigator.mediaSession.setActionHandler("play", () => AudioManager.togglePlayPause());
	navigator.mediaSession.setActionHandler("pause", () => AudioManager.togglePlayPause());
	navigator.mediaSession.setActionHandler("stop", null);
	navigator.mediaSession.setActionHandler("previoustrack", () => { });
	navigator.mediaSession.setActionHandler("nexttrack", () => AudioManager.next());
	navigator.mediaSession.setActionHandler("seekto", (values) => AudioManager.seek(values.seekTime));

	Elements.find('#loading').style.display = "none";
	Elements.find('#page-container').style.display = "block";
} catch(e) {
	Elements.find('#loading').innerText = `Error! :(\n\nSend ダフティ#0068 a message on Discord\n\n${e}`;
	console.trace(e);
}
