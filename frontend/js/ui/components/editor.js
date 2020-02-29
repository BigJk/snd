import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/hint/show-hint.css';

import m from 'mithril';

import CodeMirror from 'codemirror/lib/codemirror.js';

require('codemirror/addon/mode/overlay');
require('codemirror/addon/hint/show-hint');
require('codemirror/mode/htmlmixed/htmlmixed');
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/go/go');
require('codemirror-nunjucks');

import emmet from '@emmetio/codemirror-plugin';

emmet(CodeMirror);

import get from 'lodash-es/get';
import map from 'lodash-es/map';
import debounce from 'lodash-es/debounce';

export default () => {
	let state = {
		dom: null,
		editor: null,
		onchange: null,
		autocomplete_data: null,
		error_provider: null,
		error_checker: null,
		error_widgets: []
	};

	let openHint = () => {
		state.editor.showHint({
			completeSingle: false,
			hint: () => {
				if (!state.autocomplete_data) return null;

				let cursor = state.editor.getDoc().getCursor();
				let line = state.editor
					.getDoc()
					.getLine(cursor.line)
					.slice(0, cursor.ch);

				let match = /it\.(\S*)$/gm.exec(line);
				if (match) {
					let filter = '';

					let path = match[1];
					if (path[path.length - 1] === '.') {
						path = path.slice(0, path.length - 1);
					} else if (path.length > 0) {
						let parts = path.split('.');
						filter = parts[parts.length - 1];
						path = parts.slice(0, parts.length - 1).join('.');
					}

					let base = path.length === 0 ? state.autocomplete_data : get(state.autocomplete_data, path);
					if (base && typeof base === 'object' && !Array.isArray(base)) {
						return {
							from: cursor,
							to: cursor,
							list: map(base, (v, k) => {
								if (filter.length > 0 && k.indexOf(filter) !== 0) {
									return null;
								}

								let rest = k.slice(filter.length);
								if (rest.length === 0) return null;

								return {
									text: rest + (typeof v === 'object' && !Array.isArray(v) ? '.' : ''),
									render: function(elt, data, cur) {
										const wrapper = document.createElement('div');
										m.render(
											wrapper,
											<div className="flex justify-between">
												<span>
													<b>{filter}</b>
													{rest}
												</span>
												<span className="pl2 o-50">{Object.prototype.toString.call(v).slice(8, -1)}</span>
											</div>
										);
										elt.appendChild(wrapper);
									}
								};
							}).filter(e => {
								return e;
							})
						};
					}
				}

				return null;
			}
		});
	};

	let setup_codemirror = vnode => {
		state.editor = new CodeMirror(vnode.dom, {
			value: vnode.attrs.content ?? '',
			mode: vnode.attrs.language ?? 'text',
			lineNumbers: true,
			lineWrapping: true,
			styleActiveLine: true,
			extraKeys: {
				Tab: 'emmetExpandAbbreviation',
				Enter: 'emmetInsertLineBreak',
				'Ctrl-Space': openHint,
				'Cmd-Space': openHint
			}
		});

		state.error_checker = debounce(() => {
			if (!state.error_provider) return;

			let res = state.error_provider(state.editor.getValue());
			if (res instanceof Promise) {
				res.then(res => {
					state.error_widgets.map(w => w.clear());
					state.error_widgets = res.map(e => {
						return state.editor.markText({ line: e.line - 1, ch: e.column - 2 }, { line: e.line - 1, ch: e.column - 1 }, { className: 'syntax-error', attributes: { error: e.error } });
					});
				});
			} else {
				state.error_widgets.map(w => w.clear());
				state.error_widgets = res.map(e => {
					let from = { line: e.line - 1, ch: e.column - 2 };
					let to = { line: e.line - 1, ch: e.column - 1 };
					return state.editor.markText({ line: e.line - 1, ch: e.column - 2 }, { line: e.line - 1, ch: e.column - 1 }, { className: 'syntax-error', attributes: { error: e.error } });
				});
			}
		}, 1500);

		state.editor.setSize('100%', '100%');

		state.editor.on('change', () => {
			if (state.autocomplete_data) openHint();
			state.onchange?.(state.editor.getValue());
			state.error_checker();
		});

		state.onchange = vnode.attrs.onchange;
		state.autocomplete_data = vnode.attrs.autocomplete_data;
		state.error_provider = vnode.attrs.error_provider;
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
			state.autocomplete_data = vnode.attrs.autocomplete_data;
			state.error_provider = vnode.attrs.error_provider;

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
