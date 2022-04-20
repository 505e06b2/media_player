"use strict";

import UnicodeMonospace from "./unicode_monospace.mjs";

//seems unreliable for some reason - first played track works, every other (at a random point) doesn't

function MediaSessionManager() {
	if(navigator.mediaSession) {
		this.bind = (action, handler) => navigator.mediaSession.setActionHandler(action, handler);

		this.setPlaybackState = (state) => navigator.mediaSession.playbackState = state || "none";

		this.setPositionState = (current_time = NaN, duration = NaN, playback_rate = NaN) => {
			return; //don't want seeking via notification as it's rather clunky (or I haven't figured it out)
			if(isNaN(current_time) || isNaN(duration) || isNaN(playback_rate)) return;
			if(isFinite(current_time) !== true || isFinite(duration) !== true || isFinite(playback_rate)) return;
			navigator.mediaSession.setPositionState({
				position: current_time,
				playbackRate: playback_rate,
				duration: duration
			});
		}

		this.setMetadata = (playlist, song) => {
			if(playlist === null || song === null) {
				navigator.mediaSession.metadata = null;
				return;
			}

			navigator.mediaSession.metadata = new MediaMetadata({
				title: UnicodeMonospace.convert(song.title),
				artist: song.artist,
				album: playlist.name,
				artwork: [{src: "icon.png"}]
			});
		};

	} else {
		this.bind = () => undefined;
		this.setPlaybackState = () => undefined;
		this.setPositionState = () => undefined;
		this.setMetadata = () => undefined;
	}
}

export default new MediaSessionManager();
