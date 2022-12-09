import { filter } from 'lodash-es';

import MarkdownIt from 'markdown-it';
import * as nunjucks from 'nunjucks';
import hash from 'object-hash';

import EvalWorker from '/js/workers/eval?worker';

import store from '/js/core/store';

// DataImportExtension
//
// This nunjucks extension makes it possible to parse
// and add JSON to the context. This can help to embed
// static data into the templates.
function DataImportExtension() {
	this.tags = ['data'];

	this.parse = function (parser, nodes) {
		let tok = parser.nextToken();

		let args = parser.parseSignature(null, true);
		parser.advanceAfterBlockEnd(tok.value);

		let body = parser.parseUntilBlocks('enddata');
		parser.advanceAfterBlockEnd();

		return new nodes.CallExtension(this, 'run', args, [body]);
	};

	this.run = function (context, name, body) {
		try {
			context.ctx[name] = JSON.parse(body());
		} catch (e) {
			console.log(e);
		}
		return '';
	};
}

function JavascriptExecuteExtension() {
	this.tags = ['js'];

	this.parse = function (parser, nodes) {
		let tok = parser.nextToken();

		let args = parser.parseSignature(null, true);
		parser.advanceAfterBlockEnd(tok.value);

		let body = parser.parseUntilBlocks('endjs');
		parser.advanceAfterBlockEnd();

		return new nodes.CallExtensionAsync(this, 'run', args, [body]);
	};

	this.run = function (context, name, fn, callback) {
		let worker = new EvalWorker();

		// Kill worker after timeout. This is important if
		// the code has a infinite loop.
		let timeout = setTimeout(() => {
			worker.terminate();
			callback('eval worker: timeout');
		}, 1000);

		// Wait for response.
		worker.onmessage = (e) => {
			clearTimeout(timeout);
			worker.terminate();
			context.ctx[name] = e.data;
			callback(null, '');
		};

		// Send request.
		worker.postMessage([context.ctx, fn()]);
	};
}

let env = new nunjucks.Environment();
let markdown = new MarkdownIt();

env.addExtension('DataImportExtension', new DataImportExtension());
env.addExtension('JavascriptExecuteExtension', new JavascriptExecuteExtension());

env.addFilter('markdown', (md) => new nunjucks.runtime.SafeString(markdown.render(md)));

env.addFilter('markdowni', (md) => new nunjucks.runtime.SafeString(markdown.renderInline(md)));

env.addFilter('jsfilter', (obj, func) => {
	let fn = eval(func);
	return filter(obj, fn);
});

// Exports
//
//
export const parseError = (e) => {
	let match = /.*\[Line (\d+), Column (\d+)\].*\n[ \t]*(.*)$/gm.exec(e.message);
	if (match) {
		return {
			line: parseInt(match[1]),
			column: parseInt(match[2]),
			error: match[3],
		};
	}
	return null;
};

let cache = {};

export const render = (template, state) => {
	state.settings = store.data.settings;

	return new Promise((resolve, reject) => {
		let id = hash(template) + hash(state);
		if (cache[id]) {
			console.log('templating: cache hit');
			resolve(cache[id]);
			return;
		}

		env.renderString(template, state, (err, res) => {
			if (err) {
				let parsedErr = parseError(err);
				cache[id] = parsedErr;
				reject(parsedErr);
			} else {
				cache[id] = res;
				resolve(res);
			}
		});
	});
};
