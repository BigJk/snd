import { flatten } from 'lodash-es';
import { get } from 'lodash-es';

import * as monaco from 'monaco-editor';

import type { CompletionFunction } from 'js/core/monaco/completion';

const buildLabel = (context: any, path: string) => {
	let value = get(context, path);
	let label = `${path}`;
	switch (typeof value) {
		case 'string':
			if (value.length > 10) {
				label += ` (${value.substring(0, 10)}...)`;
			} else {
				label += ` (${value})`;
			}
			break;
		case 'number':
			label += ` (${value})`;
			break;
		case 'boolean':
			label += ` (${value ? 'true' : 'false'})`;
			break;
	}
	return label;
};

/**
 * Create a completion provider for Nunjucks templates.
 * @param context The context object containing the variables that are available in the template.
 */
export const createNunjucksCompletionProvider = (context: any): CompletionFunction => {
	// Context is an object. We want to recursively create a string array with the paths to all the fields in the context object.
	// We will use this to easily check if the word at the cursor matches any of the fields.
	// Example: [a.b.c, a.b.d, a.e, f]
	let contextFields: string[] = [];
	let contextFieldPaths = (context: any, path: string) => {
		if (typeof context === 'object') {
			for (let key in context) {
				contextFieldPaths(context[key], path === '' ? key : path + '.' + key);
			}
		} else {
			contextFields.push(path);
		}
	};
	contextFieldPaths(context, '');

	return (
		language: string,
		model: monaco.editor.ITextModel,
		position: monaco.Position,
		_context: monaco.languages.CompletionContext,
		_token: monaco.CancellationToken
	): monaco.languages.CompletionItem[] => {
		let textUntilPosition = model.getValueInRange({
			startLineNumber: position.lineNumber,
			startColumn: 1,
			endLineNumber: position.lineNumber,
			endColumn: position.column + 1,
		});

		return flatten(
			Object.keys(context).map((key) => {
				// If the text until the position doesn't match the key, then we don't want to show the completion.
				let match = textUntilPosition.match(new RegExp(`.*([a-zA-Z0-9_\.-]+)$`));
				if (!match || !key.includes(match[1])) {
					return [];
				}

				let word = model.getWordUntilPosition(position);
				let range = {
					startLineNumber: position.lineNumber,
					endLineNumber: position.lineNumber,
					startColumn: word.startColumn,
					endColumn: word.endColumn,
				};

				// Check if any of the context fields start with the word.
				return contextFields
					.filter((field) => field.startsWith(word.word))
					.map((field) => {
						return {
							label: buildLabel(context, field),
							kind: monaco.languages.CompletionItemKind.Field,
							insertText: field,
							range: range,
							detail: typeof get(context, field),
						};
					});
			})
		);
	};
};
