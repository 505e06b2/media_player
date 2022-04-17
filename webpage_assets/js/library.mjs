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

		const constructor = () => {
			//will currently only work if ids are indeces

			//init songs
			for(const song_data of api_response.songs) {
				_songs.push(Object.assign(new Library.Song(), song_data));
			}

			//initialise playlists
			for(const playlist_data of api_response.playlists) {
				const playlist = new Library.Playlist();
				//interpret created date
				playlist_data.creation_date = new Date(playlist_data.creation_date);

				//link songs
				playlist.songs = [];
				for(const song_id of playlist_data.song_ids) {
					playlist.songs.push(_songs[song_id]);
				}
				delete playlist_data.song_ids; //don't need this for Playlist as linked

				_playlists.push(Object.assign(playlist, playlist_data));
			}

			//link parent-child
			for(const playlist of _playlists) {
				if(playlist.children === undefined) playlist.children = [];
				if(playlist.parent !== null) {
					const parent = _playlists[playlist.parent];
					if(!parent) throw `${playlist.name} "${playlist.parent}" is an nvalid parent`;

					playlist.parent = parent;
					if(parent.children === undefined) parent.children = [];
					parent.children.push(playlist);
				}
			}
		}

		this.getTopLevelPlaylists = () => _playlists.filter(x => !x.parent);

		constructor();
		console.log(_playlists);
	}
}

export default Library;
