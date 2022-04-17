import Elements from "./elements.mjs";
import Library from "./library.mjs";

let library;
let content_container;
let top_dock_path;

function createListItem(name, onclickHandler = () => false) {
	const plaintext = name.replace(/[└─├]/gs, "").trim();
	return Elements.create("a", {
		innerText: name,
		href: `#${plaintext}`,
		title: plaintext,
		onclick: (e) => {onclickHandler(); return false;}
	});
}

function openFolder(playlist) {
	content_container.innerHTML = "";
	Array.from(top_dock_path.children).slice(1).map(x => x.outerHTML = "");

	if(playlist !== undefined) { //list songs
		if(playlist instanceof(Library.Playlist) === false) {
			throw `"${playlist}" is an invalid playlist`;
		}
		console.log(playlist);

	} else { //list top level playlists, with children - orphaned and double-nested (Parent->Child->Child) playlists will not appear
		const top_level = library.getTopLevelPlaylists();
		for(const playlist of top_level) {
			content_container.append(createListItem(playlist.name, () => openFolder(playlist)));
			for(const child of playlist.children) {
				const box_char = child === playlist.children[playlist.children.length-1] ? "└" : "├"; //if last use left
				content_container.append(createListItem(`${box_char}── ${child.name}`, () => openFolder(child)));
			}
		}
	}
}

function openFile(artist, album, song) {
	console.log("Playing", artist, album, song);
}

try {
	library = new Library.Library(await(await fetch("api/getLibrary")).json());
	content_container = Elements.find('#content');
	top_dock_path = Elements.find('#top-dock .path');
	Elements.find('#root').onclick = () => {openFolder(); return false;}

	openFolder();

	Elements.find('#loading').style.display = "none";
	Elements.find('#page-container').style.display = "block";
} catch(e) {
	Elements.find('#loading').innerText = `Error! :(\n\nSend ダフティ#0068 a message on Discord\n\n${e}`;
	console.trace(e);
}
