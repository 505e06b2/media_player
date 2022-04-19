"use strict";

function MediaSessionManager() {
	if(navigator.mediaSession) {
		this.bind = (action, handler) => navigator.mediaSession.setActionHandler(action, handler);

		this.setPlaybackState = (state) => navigator.mediaSession.playbackState = state;

		this.setPositionState = (audio) => {
			if(isNaN(audio.duration)) return;
			if(isFinite(audio.duration) !== true) return;
			navigator.mediaSession.setPositionState({
				position: audio.currentTime,
				playbackRate: audio.playbackRate,
				duration: audio.duration
			});
		}

		this.setMetadata = (playlist, song) => {
			navigator.mediaSession.metadata.title = song.title;
			navigator.mediaSession.metadata.artist = song.artist;
			navigator.mediaSession.metadata.album = playlist.name;
		};

		navigator.mediaSession.metadata = new MediaMetadata({});
	} else {
		this.bind = () => undefined;
		this.setPlaybackState = () => undefined;
		this.setPositionState = () => undefined;
		this.setMetadata = () => undefined;
	}
}

export default new MediaSessionManager();