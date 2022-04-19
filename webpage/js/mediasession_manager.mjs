function MediaSessionManager() {

	navigator.mediaSession.setActionHandler("play", () => AudioManager.togglePlayPause());
	navigator.mediaSession.setActionHandler("pause", () => AudioManager.togglePlayPause());
	navigator.mediaSession.setActionHandler("stop", null);
	navigator.mediaSession.setActionHandler("previoustrack", () => { });
	navigator.mediaSession.setActionHandler("nexttrack", () => AudioManager.next());
	navigator.mediaSession.setActionHandler("seekto", (values) => AudioManager.seek(values.seekTime));
}

export default new MediaSessionManager();
