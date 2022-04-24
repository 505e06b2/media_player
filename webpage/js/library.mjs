"use strict";

export const Library = {
	Playlist: function() {
		this.print = () => console.log(this);
	},

	Song: function() {
		this.print = () => console.log(this);
	},

	//parse the api response and create the foreign key links
	Library: function(api_response) {
		const _playlists = [];
		const _songs = [];

		this.getPlaylists = () => _playlists;
		this.getSongs = () => _songs;
		this.getTopLevelPlaylists = () => _playlists.filter(x => !x.parent);

		const _generatePlaylist = (data) => {
			const playlist = new Library.Playlist();
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
				_songs.push(Object.assign(new Library.Song(), song_data));
			}

			//initialise playlists
			for(const playlist_data of api_response.playlists) {
				_playlists.push(_generatePlaylist(playlist_data));
			}

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

		this.addRemotePlaylist = async (code) => {
			const playlist_data = await (await fetch(`api/getRemotePlaylist.json?code=${code}`)).json();
			const playlist = _generatePlaylist(playlist_data);
			playlist.children = [];
			_playlists.unshift(playlist);
		};

		constructor();
	}
}

export default Library;
