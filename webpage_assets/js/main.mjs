import Elements from "./elements.mjs";

let library;
let content_container;
let previous_content;
let top_dock_path;

function createFolderList(folder, onclick = () => undefined) {
	const container = Elements.create("div", {className: "list"});
	for(const name of Object.keys(folder)) {
		container.append(Elements.create("a", {
			innerText: `(${Object.values(folder[name]).length}) ${name}`,
			href: `#${name}`,
			title: name,
			onclick: () => {onclick(name); return false}
		}));
	}
	return container;
}

function createSongList(folder, onclick = () => undefined) {
	const container = Elements.create("div", {className: "list"});
	for(const x of Object.values(folder)) {
		container.append(Elements.create("a", {
			innerText: `${x.track.toString().padStart(3)} ${x.title}`,
			href: `#${x.title}`,
			title: x.title,
			onclick: () => {onclick(x.title); return false}
		}));
	}
	return container;
}

function openFolder(artist = "", album = "") {
	let folder = library;
	let onclick = (name) => openFolder(name);
	Array.from(top_dock_path.children).slice(1).map(x => x.outerHTML = "");

	if(artist) {
		folder = folder[artist];
		onclick = (name) => openFolder(artist, name);
		top_dock_path.append(Elements.create("a", {
			href: `#${artist}`,
			onclick: () => openFolder(artist),
			innerText: `${artist}/`,
			title: artist
		}));
	}
	if(!folder) throw `"${artist}" is an invalid artist`;

	if(album) {
		folder = folder[album];
		onclick = (name) => openFile(artist, album, name);
		top_dock_path.append(Elements.create("a", {
			href: `#${album}`,
			onclick: () => openFolder(artist, album),
			innerText: `${album}/`,
			title: album
		}));
	}
	if(!folder) throw `"${album}" is an invalid album`;

	if(previous_content) previous_content.delete();
	previous_content = artist && album && createSongList(folder, onclick) || createFolderList(folder, onclick);
	content_container.append(previous_content);
	return false;
}

function openFile(artist, album, song) {
	console.log("Playing", artist, album, song);
}

try {
	library = await(await fetch("api/getLibrary")).json();
	content_container = Elements.find('#content');
	top_dock_path = Elements.find('#top-dock .path');
	Elements.find('#root').onclick = () => openFolder();

	openFolder();

	Elements.find('#loading').style.display = "none";
	Elements.find('#page-container').style.display = "block";
} catch(e) {
	Elements.find('#loading').innerText = `Error! :(\n\nSend ダフティ#0068 a message on Discord\n\n${e}`;
	console.trace(e);
}
