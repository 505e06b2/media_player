"use strict";

import UnicodeMonospace from "./unicode_monospace.mjs";
import IconManager from "./icon_manager.mjs";
import FolderPath from "./folder_path.mjs";

//seems unreliable for some reason - first played track works, every other (at a random point) doesn't

function MediaSessionManager() {
	window.metadata = {
		track: "None",
		track_monospace: UnicodeMonospace.convert("None"),
		playlist: "None",
		playlist_monospace: UnicodeMonospace.convert("None"),
		playlist_path: "None",
		playlist_path_mono: UnicodeMonospace.convert("None"),
		icon_url: `${location.origin}/${IconManager.getIcon()}`
	};

	const _updateMetadata = (playlist, song) => {
		window.metadata.track = song.title;
		window.metadata.track_monospace = UnicodeMonospace.convert(window.metadata.track);

		window.metadata.playlist = playlist.name;
		window.metadata.playlist_monospace = UnicodeMonospace.convert(window.metadata.playlist);

		window.metadata.playlist_path = FolderPath.fromPlaylist(playlist).toDisplayString();
		window.metadata.playlist_path_monospace = UnicodeMonospace.convert(window.metadata.playlist_path);

		window.metadata.icon_url = `${location.origin}/${IconManager.getIcon()}`;
	};

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

			_updateMetadata(playlist, song);

			navigator.mediaSession.metadata = new MediaMetadata({
				title: UnicodeMonospace.convert(song.title),
				artist: song.artist,
				album: playlist.name,
				artwork: [{src: IconManager.getIcon()}]
			});
		};

	} else {
		this.bind = () => undefined;
		this.setPlaybackState = () => undefined;
		this.setPositionState = () => undefined;
		this.setMetadata = _updateMetadata;
	}
}

export default new MediaSessionManager();
