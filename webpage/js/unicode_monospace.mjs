//https://en.wikipedia.org/wiki/Mathematical_Alphanumeric_Symbols#Chart_for_the_Mathematical_Alphanumeric_Symbols_block

function UnicodeMonospace() {
	this.convert = (text) => {
		const ret = Array.from(text).map(x => x.codePointAt(0));
		for(let i = 0; i < ret.length; i++) {
			const codepoint = ret[i];
			if(codepoint >= 65 && codepoint <= 90) { //uppercase
				ret[i] += 0x1d62f;
			} else if(codepoint >= 97 && codepoint <= 122) { //lowercase
				ret[i] += 0x1d629;
			} else if(codepoint >= 48 && codepoint <= 57) { //numbers
				ret[i] += 0x1d7c6;
			}
		}
		return String.fromCodePoint(...ret);
	};
}

export default new UnicodeMonospace();
