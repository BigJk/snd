import hash from 'object-hash';

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
};

// Worker Pool
//
//
let cache: Record<string, any> = {};
let workerSelect = 0;
let workerPromises: Record<string, WorkerJob> = {};
let workers = new Array(navigator.hardwareConcurrency || 4).fill(null).map((_, i) => {
	let worker = new TemplatingWorker();

	// when rendered response is received call the related resolve or reject.
	worker.onmessage = (e: any) => {
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
export const parseError = (e: any, isGenerator?: boolean): TemplateError | null => {
	let match = /.*\[Line (\d+), Column (\d+)\].*\n[ \t]*(.*)$/gm.exec(e.message);
	if (match) {
		return {
			line: parseInt(match[1]) - aiScriptLines - (isGenerator ? rngScriptLines : 0),
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
			
			rpgDiceRoller.NumberGenerator.generator.engine = {
			  next () {
				return Math.abs(window.random.int32());
			  },
			};
			
			window.dice = new rpgDiceRoller.DiceRoller();
		</script>
`;
const rngScriptLines = rngScript(0).split('\n').length - 1;

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
const aiScriptLines = aiScript.split('\n').length - 1;

/**
 * State object for template rendering.
 */
export type TemplateState = {
	it: any;
	config: any;
	settings: Settings;
	images: Record<string, string>;
};

/**
 * State object for generator rendering.
 */
export type GeneratorState = {
	settings: Settings;
	config: any;
	images: Record<string, string>;
};

export type GlobalState = {
	aiEnabled?: boolean;
	aiToken?: string;
};

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
): Promise<string> => {
	return new Promise((resolve, reject) => {
		// check if data is present in cache
		let hashed = hash(template) + hash(state);
		if ((!containsAi(template) || (containsAi(template) && !state.aiEnabled)) && cache[hashed]) {
			console.log('templating: cache hit');
			resolve(cache[hashed]);
			return;
		}

		if (!state.aiToken) {
			state.aiToken = ai.value.token;
		}

		// setup promises for response
		let id = hash + '-' + Math.ceil(Math.random() * 10000000).toString();
		workerPromises[id] = {
			hashed,
			resolve,
			reject,
			timeout: setTimeout(() => reject('timeout'), state.aiEnabled ? 120000 : 2000),
		};

		let additional = '';
		additional += rngScript(state.config.seed ?? 'test-seed');
		additional += aiScript;

		// post message (round-robin style) to some worker
		workers[workerSelect++ % workers.length].postMessage({ id, template: additional + template + (enableDither ? dither : ''), state });
	});
};

/**
 * Check if template contains AI commands.
 * @param template Template string.
 */
export const containsAi = (template: string) => {
	return (template.includes('ai') && template.includes('endai') && template.includes('user')) || template.includes('aiPrompt(');
};
