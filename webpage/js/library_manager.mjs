"use strict";

function LibraryManager(api_response) {
	this.Playlist = function() {
		this.print = () => console.log(this);
	};

	this.Song = function() {
		this.print = () => console.log(this);
	};

	//parse the api response and create the foreign key links
	const _playlists = [];
	const _songs = [];

	const _artist_playlists = []; //they should not be changed after init
	const _created_playlists = []; //will change after init

	this.getPlaylists = () => _playlists;
	this.getSongs = () => _songs;
	this.getArtistPlaylists = () => _artist_playlists;
	this.getCreatedPlaylists = () => _created_playlists;

	const _caseInsensitiveSort = (a, b) => {
		return a.localeCompare(b, "en", {sensitivity: "base"});
	}

	const _generatePlaylist = (data) => {
		const playlist = new this.Playlist();
		//interpret created date
		data.creation_date = new Date(data.creation_date);

		//link songs
		playlist.songs = [];
		for(const song_id of data.song_ids) {
			playlist.songs.push(_songs[song_id]);
		}
		delete data.song_ids; //don't need this for Playlist as linked

		return Object.assign(playlist, data);
	}

	const constructor = () => {
		//init songs
		for(const song_data of api_response.songs) {
			_songs.push(Object.assign(new this.Song(), song_data));
		}

		//initialise playlists
		for(const playlist_data of api_response.playlists) {
			const playlist = _generatePlaylist(playlist_data);
			_playlists.push(playlist);
			if(playlist.type === "artist") _artist_playlists.push(playlist);
			else if(playlist.type === "created") _created_playlists.push(playlist);
		}

		_artist_playlists.sort((a, b) => _caseInsensitiveSort(a.name, b.name));

		//link parent-child
		for(const playlist of _playlists) {
			if(playlist.children === undefined) playlist.children = [];
			if(playlist.parent !== null) {
				const parent = _playlists[playlist.parent];
				if(!parent) throw `${playlist.name} "${playlist.parent}" is an invalid parent`;

				playlist.parent = parent;
				if(parent.children === undefined) parent.children = [];
				parent.children.push(playlist);
			}
		}
	};

	this.addRemotePlaylists = async (pastebin_codes) => {
		const promises = [];
		for(const code of pastebin_codes) {
			promises.push((async () => {
				return await (await fetch(`api/getRemotePlaylist.json?code=${code}`)).json();
			})());
		}

		for(const data of promises) {
			const playlist_data = await data;
			if(playlist_data.error) {
				alert(`Error while loading playlist "${playlist_data.name}"\n${playlist_data.error}`);
				return;
			}
			const playlist = _generatePlaylist(playlist_data);
			playlist.children = [];
			_playlists.push(playlist);
			_created_playlists.push(playlist);
		}

		//sort created playlists?
	};

	constructor();
}

export default await (async () => {
	return new LibraryManager(await (await fetch("api/getLibrary.json")).json());
})();
