import MarkdownIt from 'markdown-it';
import * as nunjucks from 'nunjucks';
import seedrandom from 'seedrandom';

import EvalWorker from '/js/workers/eval?worker';

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

function AIExtension() {
	this.tags = ['ai'];

	this.parse = function (parser, nodes) {
		let tok = parser.nextToken();

		let args = parser.parseSignature(null, true);
		parser.advanceAfterBlockEnd(tok.value);

		let system = parser.parseUntilBlocks('user');
		parser.advanceAfterBlockEnd(system.value);

		let user = parser.parseUntilBlocks('endai');
		parser.advanceAfterBlockEnd();

		return new nodes.CallExtensionAsync(this, 'run', args, [system, user]);
	};

	this.run = function (state, name, system, user, callback) {
		if (state.ctx['aiEnabled'] !== true) {
			fetch('/api/aiCached', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify([system(), user(), state.ctx['aiToken']]),
			})
				.then((resp) => resp.json())
				.then((data) => {
					state.ctx[name] = data;
					callback(null, ' ');
				})
				.catch(() => {
					state.ctx[name] = 'AI content disabled.';
					callback(null, ' ');
				});

			return;
		}

		fetch('/api/aiPrompt', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify([system(), user(), state.ctx['aiToken']]),
		})
			.then((resp) => resp.json())
			.then((data) => {
				state.ctx[name] = data;
				callback(null, ' ');
			})
			.catch((err) => callback(err, null));
	};
}

let env = new nunjucks.Environment();
let markdown = new MarkdownIt({
	html: true,
});

env.addExtension('DataImportExtension', new DataImportExtension());
env.addExtension('JavascriptExecuteExtension', new JavascriptExecuteExtension());
env.addExtension('AIExtension', new AIExtension());

env.addFilter('shuffle', function (array) {
	// If we have a seed we use a seeded random number generator.
	const isGenerator = !!this.ctx.config.seed;
	if (isGenerator) {
		this.ctx.__rand ??= seedrandom(this.ctx.config.seed);
	}

	let currentIndex = array.length,
		temporaryValue,
		randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor((this.ctx.__rand ?? math.Random)() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
});
env.addFilter('random', function (array) {
	// If we have a seed we use a seeded random number generator.
	const isGenerator = !!this.ctx.config.seed;
	if (isGenerator) {
		this.ctx.__rand ??= seedrandom(this.ctx.config.seed);
	}

	return array[Math.floor((this.ctx.__rand ?? math.Random)() * array.length)];
});
env.addFilter('markdown', (md) => new nunjucks.runtime.SafeString(markdown.render(md)));
env.addFilter('markdowni', (md) => new nunjucks.runtime.SafeString(markdown.renderInline(md)));
env.addFilter('json', (data) => new nunjucks.runtime.SafeString(JSON.stringify(data)));
env.addFilter(
	'source',
	(source, cb) => {
		// We can't use api here as mithrils request functions don't work in web-workers,
		// so we just use a simple fetch.
		fetch('/api/getEntries', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify([source]),
		})
			.then((resp) => resp.json())
			.then((data) => cb(null, data))
			.catch((err) => cb(err, null));
	},
	true,
);

onmessage = (e) => {
	env.renderString(e.data.template, e.data.state, (err, res) => {
		postMessage({
			id: e.data.id,
			res,
			err,
		});
	});
};

postMessage({
	log: 'started',
});
