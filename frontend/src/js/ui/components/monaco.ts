import m from 'mithril';

import { emmetHTML } from 'emmet-monaco-es';
import * as monaco from 'monaco-editor';

import guid from 'js/core/guid';
import type { CompletionFunction } from 'js/core/monaco/completion';
import * as monacoCompletion from 'js/core/monaco/completion';

emmetHTML(monaco);

type MonacoProps = {
	className?: string;
	language: string;
	value: string;
	onChange?: (value: string) => void;
	completion?: CompletionFunction;
};

type MonacoState = {
	id: string;
};

export default (): m.Component<MonacoProps> => {
	let state: MonacoState = {
		id: guid(),
	};

	return {
		oncreate({ dom, attrs }) {
			let editor = monaco.editor.create(dom.querySelector('.monaco-container') as HTMLElement, {
				value: attrs.value,
				language: attrs.language,
				automaticLayout: true,
			});

			editor.onDidChangeModelContent((event) => {
				if (attrs.onChange) attrs.onChange(editor.getValue());
			});

			if (attrs.completion) {
				monacoCompletion.registerCompletionItemProvider(state.id, attrs.completion);
			}
		},
		onupdate({ attrs }) {
			if (attrs.completion) {
				monacoCompletion.unregisterCompletionItemProvider(state.id);
				monacoCompletion.registerCompletionItemProvider(state.id, attrs.completion);
			}
		},
		onremove({ attrs }) {
			if (attrs.completion) {
				monacoCompletion.unregisterCompletionItemProvider(state.id);
			}
		},
		view({ attrs }) {
			return m(`div.h-100${attrs.className ?? ''}`, m('div.monaco-container'));
		},
	};
};
