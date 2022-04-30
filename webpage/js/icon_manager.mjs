"use strict";

import Elements from "./elements.mjs";

const default_icon_path = "icon.png";

function IconManager() {
	let _icon_path = default_icon_path;

	this.getIcon = () => _icon_path;

	this.setColours = (fg_colour, bg_colour) => {
		if(fg_colour == false) fg_colour = "#1fff50"; //can't use parameter defaults as could be empty string
		if(bg_colour == false) bg_colour = "#023300";

		_icon_path = `${default_icon_path}?fg=${encodeURIComponent(fg_colour)}&bg=${encodeURIComponent(bg_colour)}`;

		Elements.find('link[rel="icon"]').href = _icon_path;
	};
}

export default new IconManager();
