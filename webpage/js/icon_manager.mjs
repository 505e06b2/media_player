"use strict";

//MOVE THIS ONTO THE SERVER - DO ALL SVG (to png) MANIPULATIONS SERVER-SIDE

import Elements from "./elements.mjs";

const fallback_icon_path = "icon.png";
const icon_path = "icon.svg";

function IconManager() {
	let _fg_colour = "#1fff50";
	let _bg_colour = "#023300";
	let _svg = null;

	let _link_elem;

	this.ready = () => _svg !== null;
	this.getIcon = () => this.ready() ? _getSVGIconSrc() : fallback_icon_path;

	this.setColours = (fg_colour, bg_colour) => {
		if(fg_colour == false) fg_colour = "#1fff50"; //can't use defaults as could be empty string
		if(bg_colour == false) bg_colour = "#023300";

		_fg_colour = fg_colour;
		_bg_colour = bg_colour;

		if(_svg) _applyColours();
	};

	const _getSVGIconSrc = () => `data:image/svg+xml;utf8,${encodeURI(_svg.documentElement.outerHTML)}`;

	const _applyColours = () => {
		_svg.documentElement.getElementById("fg").style.fill = _fg_colour;
		_svg.documentElement.style.backgroundColor = _bg_colour;
		_link_elem.href = _getSVGIconSrc();
	};

	const constructor = async () => {
		const dom_parser = new DOMParser();
		const raw_svg = await (await fetch(icon_path)).text();

		_svg = dom_parser.parseFromString(raw_svg, "image/svg+xml");
		_link_elem = Elements.create("link", {rel: "icon"});
		Elements.find('link[rel="icon"]').delete();
		_applyColours();
		document.head.append(_link_elem);
	};

	constructor();
}

export default new IconManager();
