import m from 'mithril';

import { emmetHTML } from 'emmet-monaco-es';
import * as monaco from 'monaco-editor';

import guid from 'js/core/guid';
import type { CompletionFunction } from 'js/core/monaco/completion';
import * as monacoCompletion from 'js/core/monaco/completion';
// @ts-ignore
import theme from 'js/core/monaco/theme.json';

monaco.editor.defineTheme('main', theme);

emmetHTML(monaco);

type MonacoProps = {
	className?: string;
	language: string;
	value: string;
	onChange?: (value: string) => void;
	completion?: CompletionFunction;
	wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
};

type MonacoState = {
	id: string;
	editor?: monaco.editor.IStandaloneCodeEditor;
	completion?: CompletionFunction;
};

export default (): m.Component<MonacoProps> => {
	let state: MonacoState = {
		id: guid(),
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
		},
		onremove({ attrs }) {
			if (attrs.completion) {
				monacoCompletion.unregisterCompletionItemProvider(state.id);
			}
		},
		view({ attrs, key }) {
			return m(`div.h-100${attrs.className ?? ''}`, { key }, m('div.monaco-container', { key }));
		},
	};
};
