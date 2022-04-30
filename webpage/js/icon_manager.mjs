"use strict";

//MOVE THIS ONTO THE SERVER - DO ALL SVG (to png) MANIPULATIONS SERVER-SIDE

import Elements from "./elements.mjs";

const default_icon_path = "icon.png";

function IconManager() {
	let _icon_path = default_icon_path;

	this.getIcon = () => _icon_path;

	this.setColours = (fg_colour, bg_colour) => {
		if(fg_colour == false) fg_colour = "#1fff50"; //can't use defaults as could be empty string
		if(bg_colour == false) bg_colour = "#023300";

		_icon_path = `${default_icon_path}?fg=${fg_colour}&bg=${bg_colour}`;

		Elements.find('link[rel="icon"]').href = _icon_path;
	};
}

export default new IconManager();
