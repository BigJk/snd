import { flatten, map, uniqBy } from 'lodash-es';

import * as monaco from 'monaco-editor';

export type CompletionFunction = (
	language: string,
	model: monaco.editor.ITextModel,
	position: monaco.Position,
	context: monaco.languages.CompletionContext,
	token: monaco.CancellationToken
) => monaco.languages.CompletionItem[];

const registeredCompletionItemProviders: Record<string, CompletionFunction> = {};

const completionItemProvider = (language: string) => {
	let provider: monaco.languages.CompletionItemProvider = {
		provideCompletionItems(
			model: monaco.editor.ITextModel,
			position: monaco.Position,
			context: monaco.languages.CompletionContext,
			token: monaco.CancellationToken
		): monaco.languages.ProviderResult<monaco.languages.CompletionList> {
			// TODO: using uniqBy here is a hack to prevent duplicate suggestions. We should fix this properly.
			// There is probably still something wrong with the way we register the completion item providers.

			let result = uniqBy(
				flatten(map(registeredCompletionItemProviders, (provider) => provider(language, model, position, context, token))),
				'label'
			);

			return {
				suggestions: result,
			};
		},
	};

	return provider;
};

monaco.languages.registerCompletionItemProvider('html', completionItemProvider('html'));
monaco.languages.registerCompletionItemProvider('json', completionItemProvider('json'));

/**
 * Register a completion item provider for a language.
 * @param id Unique id of the provider.
 * @param provider The provider.
 */
export const registerCompletionItemProvider = (id: string, provider: CompletionFunction) => {
	console.log('registerCompletionItemProvider', id);

	registeredCompletionItemProviders[id] = provider;
};

/**
 * Unregister a completion item provider.
 * @param id Unique id of the provider.
 */
export const unregisterCompletionItemProvider = (id: string) => {
	console.log('unregisterCompletionItemProvider', id);

	delete registeredCompletionItemProviders[id];
};
