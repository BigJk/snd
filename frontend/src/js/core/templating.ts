import { cloneDeep } from 'lodash-es';

import jsSHA from 'jssha';
import hash from 'object-hash';

import entry from 'js/types/entry';
import Settings from 'js/types/settings';
// @ts-ignore
import TemplatingWorker from 'js/workers/templating-worker?worker';
import dither from 'js/core/dither';
import { ai } from 'js/core/store';

type WorkerJob = {
	hashed: string;
	resolve: (value: any) => void;
	reject: (reason?: any) => void;
	timeout: number;
	lineOffset?: number;
};

// Worker Pool
//
//
let cache: Record<string, any> = {};
let workerSelect = 0;
let workerPromises: Record<string, WorkerJob> = {};
let workers = new Array(navigator.hardwareConcurrency || 4).fill(null).map((_, i) => {
	let worker = new TemplatingWorker();

	// When rendered response is received call the related resolve or reject.
	worker.onmessage = (e: any) => {
		if (e.data.log) {
			console.log(`Template Web-Worker ${i + 1}: ${e.data.log}`);
			return;
		}

		let { resolve, reject, timeout, hashed, lineOffset } = workerPromises[e.data.id];
		let res = e.data;

		// Stop timeout handler
		clearTimeout(timeout);

		if (res.err) {
			let parsedErr = parseError(res.err, lineOffset ?? 0);
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

type TemplateError = {
	line: number;
	column: number;
	error: string;
};

/**
 * Parse error message from template engine.
 * @param e Error object.
 * @param isGenerator Is the error coming from a generator.
 */
export const parseError = (e: any, lineOffset: number): TemplateError | null => {
	let match = /.*\[Line (\d+), Column (\d+)\].*\n[ \t]*(.*)$/gm.exec(e.message);
	if (match) {
		return {
			line: parseInt(match[1]) - lineOffset,
			column: parseInt(match[2]) + 1,
			error: match[3],
		};
	}
	return null;
};

// Add a seedable rng + dice roller to the template
// PRNG: https://github.com/davidbau/seedrandom
// Dice Roller: https://dice-roller.github.io/documentation/
//
// TODO: include it locally
const rngScript = (seed: any) => `
		<script src="https://cdnjs.cloudflare.com/ajax/libs/seedrandom/3.0.5/seedrandom.min.js"></script>
		<script src="https://unpkg.com/mathjs@9.3.2/lib/browser/math.js"></script>
		<script src="https://cdn.jsdelivr.net/npm/random-js@2.1.0/dist/random-js.umd.min.js"></script>
		<script src="https://cdn.jsdelivr.net/npm/@dice-roller/rpg-dice-roller@5.2.1/lib/umd/bundle.min.js"></script>
		<script>
			window.random = new Math.seedrandom('${seed}');
			Math.random = window.random;

			rpgDiceRoller.NumberGenerator.generator.engine = {
			  next () {
				return Math.abs(window.random.int32());
			  },
			};

			window.dice = new rpgDiceRoller.DiceRoller();
		</script>
`;

// Add AI script to the template so that it can be used
// from javascript.
//
// TODO: better handling
const aiScript = `
<script>
	const aiEnabled = {{ aiEnabled }};
	const aiToken = '{{ aiToken }}';

	const aiPrompt = (system, user) => {
		if(!aiEnabled) {
      // Try and see if the response was cached
      const request = new XMLHttpRequest();
			request.open("POST", "http://127.0.0.1:7123/api/aiCached", false); // Synchronous request
			request.send(JSON.stringify([system, user, aiToken]));

			if(request.status === 200) {
				return JSON.parse(request.responseText);
			}

      // Don't execute AI
			return "AI content disabled.";
		}

		const request = new XMLHttpRequest();
		request.open("POST", "http://127.0.0.1:7123/api/aiPrompt", false); // Synchronous request
		request.send(JSON.stringify([system, user, aiToken]));

		if(request.status === 200) {
			return JSON.parse(request.responseText);
		} else {
			// TODO: handle error
			return JSON.parse(request.responseText);
		}
	}
</script>
`;

const IPCScript = `
<script>
  const isElectron = !!window.api?.sendData;

  function registerConfig(config) {
    if(isElectron) {
      window.api.sendData('registerConfig', config);
    } else {
      window.parent.postMessage({ type: 'registerConfig', data: config }, '*');
    }
  }
</script>
`;

/**
 * State object for template rendering.
 */
export type TemplateState = {
	it: any;
	config: any;
	sources: string[];
	settings: Settings;
	images: Record<string, string>;
};

/**
 * State object for generator rendering.
 */
export type GeneratorState = {
	config: any;
	sources: string[];
	settings: Settings;
	images: Record<string, string>;
};

export type GlobalState = {
	aiEnabled?: boolean;
	aiToken?: string;
};

const dataURIsCommitted: Record<string, boolean> = {};

/**
 * Render template with given state.
 * @param template Template string.
 * @param state State object.
 * @param enableDither Enable dithering.
 */
export const render = (
	template: string,
	state: (TemplateState & GlobalState) | (GeneratorState & GlobalState),
	enableDither = true,
	minimal = false,
): Promise<string> =>
	new Promise((resolve, reject) => {
		// We need to clone the state, so we can remove sensitive data from it.
		const clonedState = cloneDeep(state) as (TemplateState & GlobalState) | (GeneratorState & GlobalState);

		// Check if data is present in cache
		let hashed = hash(template) + hash(clonedState);
		if ((!containsAi(template) || (containsAi(template) && !clonedState.aiEnabled)) && cache[hashed]) {
			console.log('templating: cache hit');
			resolve(cache[hashed]);
			return;
		}

		// Clear sensitive data from state
		clonedState.settings.aiApiKey = '';
		clonedState.settings.syncKey = '';

		if (!clonedState.aiToken) {
			clonedState.aiToken = ai.value.token;
		}

		const cleanupImages = (obj: any, parent: any, key: string) => {
			if (obj === null || obj === undefined) {
				return;
			}

			switch (typeof obj) {
				case 'string':
					if (obj.startsWith('!IMAGE:')) {
						const stripped = obj.replace('!IMAGE:', '');
						if (stripped.startsWith('http') || stripped.startsWith('data:')) {
							parent[key] = stripped;
						} else {
							parent[key] = 'https://dummyimage.com/' + stripped;
						}
					} else if (obj.startsWith('!IMAGE')) {
						parent[key] = 'https://dummyimage.com/400x3:2';
					}

					if (parent[key].startsWith('data:')) {
						const imageHash = new jsSHA('SHA-256', 'TEXT', { encoding: 'UTF8' }).update(parent[key]).getHash('HEX');

						if (!dataURIsCommitted[imageHash]) {
							const request = new XMLHttpRequest();
							request.open('POST', '/api/image-cache', false); // `false` makes the request synchronous
							request.send(JSON.stringify(parent[key]));
						}

						parent[key] = `/api/image-cache/${imageHash}`;
					}
					return;
				case 'object':
					Object.keys(obj).forEach((key) => {
						cleanupImages(obj[key], obj, key);
					});
					break;
				default:
					return;
			}
		};

		cleanupImages((clonedState as any).it, null, '');
		cleanupImages((clonedState as any).config, null, '');

		Object.keys(clonedState.images).forEach((key) => {
			const imageHash = new jsSHA('SHA-256', 'TEXT', { encoding: 'UTF8' }).update(clonedState.images[key]).getHash('HEX');
			clonedState.images[key] = `/api/image-cache/${imageHash}`;
		});

		// Setup promises for response
		let id = hash + '-' + Math.ceil(Math.random() * 10000000).toString();
		workerPromises[id] = {
			hashed,
			resolve,
			reject,
			timeout: setTimeout(() => reject('timeout'), clonedState.aiEnabled ? 120000 : 2000),
		};

		let additional = '';
		additional += rngScript(clonedState.config.seed ?? Math.ceil(Math.random() * 500000000));
		additional += aiScript;
		additional += IPCScript;

		if (minimal) {
			additional = '';
		}

		// Count the number of lines in the additional script
		workerPromises[id].lineOffset = additional.split('\n').length - 1;

		// Post message (round-robin style) to some worker
		workers[workerSelect++ % workers.length].postMessage({ id, template: additional + template + (enableDither ? dither : ''), state: clonedState });
	});

/**
 * Check if template contains AI commands.
 * @param template Template string.
 */
export const containsAi = (template: string) =>
	(template.includes('ai') && template.includes('endai') && template.includes('user')) || template.includes('aiPrompt(');

/**
 * Add entry meta to the state it object.
 * @param entry Entry object.
 * @param it State it object.
 * @returns State it object with entry meta.
 */
export const addEntryMeta = (entry: entry | null, it: any) => {
	if (!it) {
		return it;
	}
	return {
		...it,
		snd: {
			id: entry?.id ?? 'skeleton-entry-id',
			name: entry?.name ?? 'Skeleton Entry Name',
		},
	};
};
