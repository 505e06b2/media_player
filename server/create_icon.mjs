"use strict";

import fs from "fs";
import sharp from "sharp";
import { default_colours } from "../settings.mjs";

const bg_colour_var = "$_BG_COLOUR";
const fg_colour_var = "$_FG_COLOUR";

const svg_as_str = fs.readFileSync("server/icon_template.svg", {encoding: "utf8"});

export async function createIcon(url) {
	const bg_colour = url.searchParams.get("bg") || default_colours.bg;
	const fg_colour = url.searchParams.get("fg") || default_colours.fg;
	const svg_source = svg_as_str.replace(bg_colour_var, bg_colour).replace(fg_colour_var, fg_colour);
	return sharp(Buffer.from(svg_source))
		.resize(256, 256)
		.png()
		.toBuffer();
}
