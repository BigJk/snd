import 'codemirror/lib/codemirror.css';

import m from 'mithril';

import CodeMirror from 'codemirror/lib/codemirror.js';

require('codemirror/mode/htmlmixed/htmlmixed');
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/go/go');

import emmet from '@emmetio/codemirror-plugin';

emmet(CodeMirror);

export default () => {
	let state = {
		dom: null,
		editor: null,
		onchange: null
	};

	let setup_codemirror = vnode => {
		state.editor = new CodeMirror(vnode.dom, {
			value: vnode.attrs.content ?? '',
			mode: vnode.attrs.language ?? 'text',
			lineNumbers: true,
			lineWrapping: true,
			extraKeys: {
				Tab: 'emmetExpandAbbreviation',
				Enter: 'emmetInsertLineBreak'
			}
		});

		state.editor.setSize('100%', '100%');

		state.editor.on('change', () => {
			state.onchange?.(state.editor.getValue());
		});

		state.onchange = vnode.attrs.onchange;
	};

	return {
		oncreate(vnode) {
			setup_codemirror(vnode);
		},
		onupdate(vnode) {
			vnode.dom.innerHTML = '';
			setup_codemirror(vnode);
		},
		onremove(vnode) {
			state.editor = null;
		},
		onbeforeupdate(vnode, old) {
			state.onchange = vnode.attrs.onchange;

			if (vnode.attrs.content !== state.editor.getValue()) {
				state.editor.setValue(vnode.attrs.content);
			}

			if (vnode.attrs.language !== state.editor.getMode().name) {
				return true;
			}

			return false;
		},
		view(vnode) {
			return <div className={vnode.attrs.className} />;
		}
	};
};
