import hash from 'object-hash';

import TemplatingWorker from '/js/workers/templating-worker?worker';

import dither from '/js/core/dither';
import store from '/js/core/store';

// Worker Pool
//
//
let cache = {};
let workerSelect = 0;
let workerPromises = {};
let workers = new Array(navigator.hardwareConcurrency || 4).fill(null).map((_, i) => {
	let worker = new TemplatingWorker();

	// when rendered response is received call the related resolve or reject.
	worker.onmessage = (e) => {
		if (e.data.log) {
			console.log(`Template Web-Worker ${i + 1}: ${e.data.log}`);
			return;
		}

		let { resolve, reject, timeout, hashed } = workerPromises[e.data.id];
		let res = e.data;

		// stop timeout handler
		clearTimeout(timeout);

		if (res.err) {
			let parsedErr = parseError(res.err);
			cache[hashed] = parsedErr;
			reject(parsedErr);
		} else {
			cache[hashed] = res.res;
			resolve(res.res);
		}

		delete workerPromises[res.id];
	};

	return worker;
});

// Exports
//
//
export const parseError = (e) => {
	let match = /.*\[Line (\d+), Column (\d+)\].*\n[ \t]*(.*)$/gm.exec(e.message);
	if (match) {
		return {
			line: parseInt(match[1]),
			column: parseInt(match[2]) + 1,
			error: match[3],
		};
	}
	return null;
};

export const render = (template, state) => {
	state.settings = store.data.settings;

	return new Promise((resolve, reject) => {
		// check if data is present in cache
		let hashed = hash(template) + hash(state);
		if (cache[hashed]) {
			console.log('templating: cache hit');
			resolve(cache[hashed]);
			return;
		}

		// setup promises for response
		let id = hash + '-' + Math.ceil(Math.random() * 10000000).toString();
		workerPromises[id] = {
			hashed,
			resolve,
			reject,
			timeout: setTimeout(() => reject('timeout'), 2000),
		};

		// post message (round-robin style) to some worker
		workers[workerSelect++ % workers.length].postMessage({ id, template: template + dither, state });
	});
};
