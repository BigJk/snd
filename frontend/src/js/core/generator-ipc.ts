import m from 'mithril';

import { filterOutDynamicConfigValues, mergeConfigValues } from 'js/types/config';
import Generator, { sanitizeConfig } from 'js/types/generator';

/**
 * Creates a function that handles IPC messages. These messages can either be from a webview or a iframe.
 * They are used to communicate from the generator to the editor.
 * @param generator The generator object.
 * @param state The state object.
 */
export function createOnMessage(generator?: Generator | null, state?: { config: any }) {
	return (type: string, msg: any) => {
		console.log('IPCMessage', type, msg);

		if (!generator || !state) {
			return;
		}

		if (type === 'registerConfig') {
			if (Array.isArray(msg)) {
				generator.config = mergeConfigValues(
					filterOutDynamicConfigValues(generator.config),
					msg.map((c) => ({
						...c,
						isDynamic: true,
					})),
				);
				state.config = sanitizeConfig(generator, state.config);
			}
		}

		m.redraw();
	};
}
