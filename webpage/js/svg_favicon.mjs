import Elements from "./elements.mjs";

const icon_path = "icon.svg";

async function generateSVGFavicon(fg_colour, bg_colour) {
	const dom_parser = new DOMParser();
	const raw_svg = await (await fetch(icon_path)).text();

	const svg = dom_parser.parseFromString(raw_svg, "image/svg+xml");
	const _link_elem = Elements.create("link", {rel: "icon"});
	Elements.find('link[rel="icon"]').delete();
	document.head.append(_link_elem);

	if(fg_colour == false) fg_colour = "#1fff50"; //can't use defaults as could be empty string
	if(bg_colour == false) bg_colour = "#023300";

	svg.documentElement.getElementById("fg").style.fill = fg_colour;
	svg.documentElement.style.backgroundColor = bg_colour;
	_link_elem.href = `data:image/svg+xml;utf8,${encodeURI(svg.documentElement.outerHTML)}`;
}

export default generateSVGFavicon;
