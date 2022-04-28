## Installation

1. Execute:
```sh
git clone https://github.com/505e06b2/media_player.git
cd media_player
npm i
```
2. Place music in the `music` folder with a structure of:
```
Artist/Album/Song

Artist1
|- Album1
	|- Song1
	|- Song2
|- Album2
	|- Song1

Artist2
|- Album1
	|- Song1
...
```
Symlinks are encouraged, but a "folder" of `music` must exist in the `webpage/` folder

3. Run the webserver
```sh
npm start
```

## Configuration
Alter the `settings.mjs` file as required
