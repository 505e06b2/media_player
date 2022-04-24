"use strict";

function URLManager() {
	this.params = {
		gain: "gain",
		shuffle: "shuffle",
		repeat: "repeat",
		playlist: "playlist"
	};

	const _param_types = {
		gain: "number",
		shuffle: "boolean",
		repeat: "string",
		playlist: "string"
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
			let typed_value = value;

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
		const new_url = `${location.pathname}?${current_params}`;
		history.replaceState(null, "", new_url);
	}
}

export default new URLManager();
