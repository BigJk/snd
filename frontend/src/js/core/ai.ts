import { settings } from 'js/core/store';
import * as API from 'js/core/api';
import { AI_GENERATE } from 'js/core/api';
import Template from 'js/types/template';
import Entry from 'js/types/entry';
import { safeCall } from 'js/core/safe';

/**
 * Extracts the JSON from the AI response. Sometimes the response is wrapped in a explanation text,
 * so we try to extract the JSON from the response.
 * @param str The response from the AI.
 */
function extractJSON(str: string) {
	const first = str.indexOf('{');
	const last = str.lastIndexOf('}');
	return JSON.parse(str.substring(first, last + 1));
}

/**
 * Generates an entry from the AI.
 * @param prompt The prompt to use.
 * @param template The template to use.
 * @param entries The pool of entries to use as possible examples. They will be chosen randomly.
 */
export const generateEntry = (prompt: string, template: Template, entries: Entry[]) => {
	let system = `
	You output JSON.
	You are a helper to generate data in a Software.
	You are in a software for Pen & Paper / TTRPGs.
	You should generate JSON for a template called "${template.name}".
	
	A few example JSON for this template is:
	
	${JSON.stringify(template.skeletonData, null, 2)}`;

	// Add a few random examples.
	const otherExamples = new Array(3)
		.fill(0)
		.map(() => {
			if (entries.length === 0) return '';
			return JSON.stringify(entries[Math.floor(Math.random() * entries.length)].data, null, 2);
		})
		.filter((e) => e !== '');

	otherExamples.forEach((e) => {
		if (settings.value.aiContextWindow > 0 && system.length + e.length + 2 > settings.value.aiContextWindow) return;
		system += `
			
			${e}`;
	});

	return API.exec<string>(AI_GENERATE, system, prompt, 'AI_ENTRY' + Math.floor(Math.random() * 50000).toString()).then((data) =>
		safeCall(() => {
			let resp = {};
			if (data[0] === '{') resp = JSON.parse(data);
			else resp = extractJSON(data);

			return {
				id: `ai#${Math.floor(Math.random() * 50000)}`,
				name: 'AI Generated',
				data: resp,
			} as Entry;
		}),
	);
};
