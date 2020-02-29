import m from 'mithril';

import store from '../../core/store';

import binder from '../binder';

import * as nunjucks from 'nunjucks';

import Editor from './editor';
import Preview from './preview';
import TextArea from './textarea';
import Input from './input';

import debounce from 'lodash-es/debounce';
import map from 'lodash-es/map';

export default () => {
	let state = {
		target: null,
		parsed_data: null,
		last_render: '',
		last_list_render: '',
		selected_tab: '',
		skeleton_data_raw: '',
		on_render: null,
		template_errors: [],
		list_template_errors: []
	};

	let template_error = e => {
		let match = /.*\[Line (\d+), Column (\d+)\].*\n[ \t]*(.*)$/gm.exec(e.message);
		if (match) {
			return {
				line: parseInt(match[1]),
				column: parseInt(match[2]),
				error: match[3]
			};
		}
		return null;
	};

	let update_render = debounce(() => {
		let rerender = false;

		state.template_errors = [];
		state.list_template_errors = [];

		try {
			state.last_render = nunjucks.renderString(state.target.print_template, { it: state.parsed_data });
			rerender = true;
		} catch (e) {
			let err = template_error(e);
			if (err) {
				state.template_errors = [err];
			}
		}

		try {
			state.last_list_render = nunjucks.renderString(state.target.list_template, { it: state.parsed_data });
			rerender = true;
		} catch (e) {
			let err = template_error(e);
			if (err) {
				state.list_template_errors = [err];
			}
		}

		if (rerender) {
			m.redraw();
		}

		if (state.on_render) {
			state.on_render(state.last_render);
		}
	}, 250);

	update_render();

	let tabs = {
		Information: () => {
			return (
				<div className="ph3 pt2">
					<Input label="Name" cols={9} value={state.target.name} oninput={binder.inputString(state.target, 'name')} />
					<TextArea label="Description" cols={9} value={state.target.description} oninput={binder.inputString(state.target, 'description')} />
				</div>
			);
		},
		'Print Template': () => {
			return (
				<Editor
					className="h-100 w-100"
					language="nunjucks"
					content={state.target.print_template}
					onchange={html => {
						state.target.print_template = html;
						update_render();
					}}
					autocomplete_data={state.parsed_data}
					error_provider={() => {
						return state.template_errors;
					}}
				/>
			);
		},
		'List Template': () => {
			return [
				<Editor
					className="h-100 w-100"
					language="htmlmixed"
					content={state.target.list_template}
					onchange={html => {
						state.target.list_template = html;
						update_render();
					}}
					error_provider={() => {
						return state.list_template_errors;
					}}
				/>,
				<div className="absolute right-0 bottom-0 ma3 ph3 pv3 ba b--black-10 bg-white f5 lh-solid w500">
					<div className="fw7">Sample Entry</div>
					{m.trust(state.last_list_render)}
				</div>
			];
		},
		'Data Skeleton': () => {
			return (
				<Editor
					className="h-100 w-100"
					language="javascript"
					content={state.skeleton_data_raw}
					onchange={data => {
						state.skeleton_data_raw = data;
						try {
							state.parsed_data = JSON.parse(data);
							update_render();
						} catch (e) {}
						state.target.skeleton_data = JSON.stringify(state.parsed_data);
					}}
				/>
			);
		}
	};

	state.selected_tab = Object.keys(tabs)[0];

	return {
		oninit(vnode) {
			state.target = vnode.attrs.target;
			state.on_render = vnode.attrs.onrender;
			if (state.target.skeleton_data.length > 0) {
				state.parsed_data = JSON.parse(state.target.skeleton_data);
			} else {
				state.parsed_data = {};
			}
			state.skeleton_data_raw = JSON.stringify(state.parsed_data, null, 2);
		},
		view(vnode) {
			if (!state.target) {
				return;
			}
			return (
				<div className="w-100 h-100 flex flex-column">
					<div className="w-100 h-100 flex-grow-1 overflow-auto flex">
						<div className="w-100 h-100 flex flex-column overflow-auto">
							<ul className="tab tab-block tab-m0 flex-shrink-0">
								{map(tabs, (v, k) => {
									return (
										<li className={'tab-item ' + (k === state.selected_tab ? 'active' : '')} onclick={() => (state.selected_tab = k)}>
											<a className="pointer">{k}</a>
										</li>
									);
								})}
							</ul>
							<div className="relative w-100 flex-grow-1 overflow-auto">{tabs[state.selected_tab]()}</div>
						</div>
						<div className="bl b--black-10 bg-light-gray preview flex-shrink-0">
							<Preview className="h-100" content={state.last_render} width={340} scale={340.0 / store.data.settings.printer_width} stylesheets={store.data.settings.stylesheets} />
						</div>
					</div>
				</div>
			);
		}
	};
};
