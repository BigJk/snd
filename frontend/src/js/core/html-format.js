import * as Beautifier from 'js-beautify/js/lib/beautifier';

export default function (html) {
	let pre = html
		.replace(/{%/g, `/*{%`)
		.replace(/%}/g, `%}*/`)
		.replace(/{{.+}}/g, (x) => {
			return `/*` + x + `*/`;
		});

	let formatted = Beautifier.html(pre, {
		e4x: true,
		jslint_happy: true,
		indent_char: '\t',
		indent_size: 1,
		space_before_conditional: true,
		brace_style: 'collapse,preserve-inline',
	});

	return formatted
		.replace(/\/\*{%/g, `{%`)
		.replace(/%}\*\//g, `%}`)
		.replace(/\/\*{{.+}}\*\//g, (x) => {
			return x.slice(2, x.length - 2);
		});
}
