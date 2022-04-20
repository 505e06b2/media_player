"use strict";

import UnicodeMonospace from "./unicode_monospace.mjs";

function MediaSessionManager() {
	if(navigator.mediaSession) {
		this.bind = (action, handler) => navigator.mediaSession.setActionHandler(action, handler);

		this.setPlaybackState = (state) => navigator.mediaSession.playbackState = state;

		this.setPositionState = (current_time = NaN, duration = NaN) => {
			if(isNaN(current_time) || isNaN(duration)) return;
			if(isFinite(current_time) !== true || isFinite(duration) !== true) return;
			return; //just too brittle
			navigator.mediaSession.setPositionState({
				position: current_time,
				playbackRate: 1,
				duration: duration
			});
		}

		this.setMetadata = (playlist, song) => {
			navigator.mediaSession.metadata.title = UnicodeMonospace.convert(song.title);
			navigator.mediaSession.metadata.artist = song.artist;
			navigator.mediaSession.metadata.album = playlist.name;
		};

		navigator.mediaSession.metadata = new MediaMetadata({
			artwork: [{src: "icon.png"}]
		});
	} else {
		this.bind = () => undefined;
		this.setPlaybackState = () => undefined;
		this.setPositionState = () => undefined;
		this.setMetadata = () => undefined;
	}
}

export default new MediaSessionManager();
