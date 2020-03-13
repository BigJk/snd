import * as nunjucks from 'nunjucks';
import MarkdownIt from 'markdown-it';

// DataImportExtension
//
// This nunjucks extension makes it possible to parse
// and add JSON to the context. This can help to embed
// static data into the templates.
function DataImportExtension() {
	this.tags = ['data'];

	this.parse = function(parser, nodes, lexer) {
		let tok = parser.nextToken();

		let args = parser.parseSignature(null, true);
		parser.advanceAfterBlockEnd(tok.value);

		let body = parser.parseUntilBlocks('enddata');
		parser.advanceAfterBlockEnd();

		return new nodes.CallExtension(this, 'run', args, [body]);
	};

	this.run = function(context, name, body) {
		try {
			context.ctx[name] = JSON.parse(body());
		} catch (e) {}
		return '';
	};
}

let env = new nunjucks.Environment();
let markdown = new MarkdownIt();

env.addExtension('DataImportExtension', new DataImportExtension());
env.addFilter('markdown', md => {
	return new nunjucks.runtime.SafeString(markdown.renderInline(md));
});

// Exports
//
//
export const parseError = e => {
	let match = /.*\[Line (\d+), Column (\d+)\].*\n[ \t]*(.*)$/gm.exec(e.message);
	if (match) {
		return {
			line: parseInt(match[1]),
			column: parseInt(match[2]),
			error: match[3]
		};
	}
	return null;
};

export const render = (template, data) => {
	let state = {
		it: data
	};

	return env.renderString(template, state);
};

export const renderAsync = (template, data, success, error) => {
	try {
		success(render(template, data));
	} catch (e) {
		if (error) {
			error(parseError(e));
		}
	}
};

export const tryRender = (template, data) => {
	try {
		return render(template, data);
	} catch (e) {}
	return 'Template error...';
};
