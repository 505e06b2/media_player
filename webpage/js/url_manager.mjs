"use strict";

function URLManager() {
	this.params = {
		fgcolour: "fgcolour",
		bgcolour: "bgcolour",
		dockcolour: "dockcolour",

		nowplaying: "nowplaying",
		gain: "gain",
		shuffle: "shuffle",
		repeat: "repeat",
		folder: "folder",
		playlist: "playlist"
	};

	const _param_types = {
		fgcolour: "colour",
		bgcolour: "colour",
		dockcolour: "colour",

		nowplaying: "string",
		gain: "number",
		shuffle: "boolean",
		repeat: "string",
		folder: "string",
		playlist: "pastebin_code_array"
	};

	this.getRawParams = () => {
		const ret = new URLSearchParams(location.search);
		for(const [name, value] of ret) {
			if(this.params[name] === undefined) ret.delete(name);
		}
		return ret;
	};

	this.getParams = () => {
		const ret = {};
		for(const [name, value] of this.getRawParams()) {
			let typed_value;

			switch(_param_types[name]) {
				case "boolean":
					if(value === "true") typed_value = true;
					else if(value === "false") typed_value = false;
					else continue;
					break;

				case "number":
					const number_value = parseFloat(value);
					if(isNaN(number_value) === false) typed_value = number_value;
					else continue;
					break;

				case "colour":
					if(CSS.supports("color", value)) typed_value = value;
					else continue;
					break;

				case "pastebin_code_array":
					if(value) {
						if(ret[name] === undefined) ret[name] = [];
						ret[name].push(...value.split("\x00"));
					}
					continue; //force full control of this

				default:
					if(value) typed_value = value;
			}

			ret[name] = typed_value;
		}
		return ret;
	};

	this.updateParam = (name, value) => {
		const current_params = this.getRawParams();
		current_params.set(name, value);
		const new_url = `${location.pathname}?${current_params}`;
		history.replaceState(null, "", new_url);
	};

	this.deleteParam = (name) => {
		const current_params = this.getRawParams();
		current_params.delete(name);
		const new_url = Array.from(current_params.keys()).length > 0 ? `${location.pathname}?${current_params}` : location.pathname;
		history.replaceState(null, "", new_url);
	}
}

export default new URLManager();
