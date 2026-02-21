import m from 'mithril';

import { emmetHTML } from 'emmet-monaco-es';
import { css } from 'goober';
import * as monaco from 'monaco-editor';
import { IModelDeltaDecoration } from 'monaco-editor';

import guid from 'js/core/guid';
import type { CompletionFunction } from 'js/core/monaco/completion';
import * as monacoCompletion from 'js/core/monaco/completion';
// @ts-ignore
import theme from 'js/core/monaco/theme.json';

monaco.editor.defineTheme('main', theme);

emmetHTML(monaco);

const errorStyle = css`
	background-color: rgba(255, 0, 0, 0.2);
	border-left: 4px solid red;
`;

type MonacoProps = {
	className?: string;
	language: string;
	value: string;
	errors?: { line: number; column: number; error: string }[];
	onChange?: (value: string) => void;
	onEditor?: (editor?: monaco.editor.IStandaloneCodeEditor) => void;
	completion?: CompletionFunction;
	wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
};

type MonacoState = {
	id: string;
	editor?: monaco.editor.IStandaloneCodeEditor;
	completion?: CompletionFunction;
	decorations: any;
};

export default (): m.Component<MonacoProps> => {
	let state: MonacoState = {
		id: guid(),
		decorations: [],
	};

	const updateErrors = (attrs: MonacoProps) => {
		if (!state.editor) return;

		if (!attrs.errors) {
			state.decorations = state.editor.deltaDecorations(state.decorations, []);
		} else {
			state.decorations = state.editor.deltaDecorations(
				state.decorations,
				(attrs.errors ?? [])
					.map((error) => {
						// Somehow this can be undefined even though it's not supposed to be,
						// which breaks the entire thing.
						if (!(error as unknown)) return null;

						const errorRange = new monaco.Range(error.line, 1, error.line, state.editor!.getModel().getLineMaxColumn(error.line));

						console.log(error);

						const decorationOptions = {
							range: errorRange,
							options: {
								isWholeLine: true,
								className: errorStyle,
								hoverMessage: {
									value: error.error,
								},
							},
						};

						return decorationOptions;
					})
					.filter(Boolean) as IModelDeltaDecoration[],
			);
		}
	};

	return {
		oncreate({ dom, attrs }) {
			state.editor = monaco.editor.create(dom.querySelector('.monaco-container') as HTMLElement, {
				value: attrs.value,
				language: attrs.language,
				automaticLayout: true,
				wordWrap: attrs.wordWrap ?? 'off',
				theme: 'main',
			});

			state.editor.onDidChangeModelContent((event) => {
				if (attrs.onChange) attrs.onChange(state.editor!.getValue());
			});

			if (attrs.completion) {
				monacoCompletion.registerCompletionItemProvider(state.id, attrs.completion);
				state.completion = attrs.completion;
			}

			attrs.onEditor?.(state.editor);
			updateErrors(attrs);
		},
		onupdate({ attrs }) {
			// Only relevant if the completion function changes. Might not be needed atm.
			/*
			// In case the completion function changes, we need to unregister the old one and register the new one.
			if (attrs.completion && attrs.completion !== state.completion) {
				monacoCompletion.unregisterCompletionItemProvider(state.id);
				monacoCompletion.registerCompletionItemProvider(state.id, attrs.completion);
				state.completion = attrs.completion;
			}
			*/

			if (attrs.value !== state.editor?.getValue()) {
				state.editor?.setValue(attrs.value);
			}

			updateErrors(attrs);
		},
		onremove({ attrs }) {
			if (attrs.completion) {
				monacoCompletion.unregisterCompletionItemProvider(state.id);
			}
			attrs.onEditor?.(undefined);
		},
		view({ attrs, key }) {
			return m(`div.h-100${attrs.className ?? ''}`, { key }, m('div.monaco-container', { key }));
		},
	};
};
