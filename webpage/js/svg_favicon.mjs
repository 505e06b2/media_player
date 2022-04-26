import Elements from "./elements.mjs";

function SVGFavicon(svg_dom) {
	const _link_elem = Elements.create("link", {rel: "icon"});
	document.head.append(_link_elem);

	this.setColours = (fg_colour, bg_colour) => {
		if(fg_colour == false) fg_colour = "#1fff50"; //can't use defaults as could be empty string
		if(bg_colour == false) bg_colour = "#023300";

		svg_dom.documentElement.getElementById("fg").style.fill = fg_colour;
		svg_dom.documentElement.style.backgroundColor = bg_colour;
		_link_elem.href = `data:image/svg+xml;utf8,${encodeURI(svg_dom.documentElement.outerHTML)}`;
	};

	this.setColours();
}

async function generateSVGFavicon(path = "icon.svg") {
	const dom_parser = new DOMParser();
	const raw_svg = await (await fetch(path)).text();

	const svg = dom_parser.parseFromString(raw_svg, "image/svg+xml");
	return new SVGFavicon(svg);
}

export default generateSVGFavicon;
