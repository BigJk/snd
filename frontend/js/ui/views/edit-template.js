import m from 'mithril';

import api from '../../core/api';

import { error, success } from '../toast';

import debounce from 'lodash-es/debounce';
import map from 'lodash-es/map';

import dot from 'dot';

import Editor from '../components/editor';
import Preview from '../components/preview';

export default () => {
	let state = {
		target: null,
		parsed_data: null,
		last_render: '',
		last_list_render: '',
		selected_tab: '',
		skeleton_data_raw: ''
	};

	let update_render = debounce(() => {
		let rerender = false;

		try {
			state.last_render = dot.template(state.target.print_template)(state.parsed_data);
			rerender = true;
		} catch (e) {
			console.log(e);
		}

		try {
			state.last_list_render = dot.template(state.target.list_template)(state.parsed_data);
			rerender = true;
		} catch (e) {
			console.log(e);
		}

		if (rerender) {
			m.redraw();
		}
	}, 250);

	let templateBar = editable => {
		if (editable) {
			return (
				<div className="w5">
					<input
						className="form-input"
						value={state.target.name}
						placeholder="Template Name..."
						onchange={e => {
							state.target.name = e.target.value;
						}}
					/>
				</div>
			);
		}
		return 'Template: ' + state.target.name;
	};

	let buttons = (onsave, onclose) => {
		let buttons = [];
		if (onsave) {
			buttons.push(
				<div
					className="btn btn-success ml2"
					onclick={() => {
						state.target.skeleton_data = JSON.stringify(state.parsed_data);
						onsave(state.target);
					}}
				>
					Save Changes
				</div>
			);
		}
		if (onclose) {
			buttons.push(
				<div className="btn btn-error ml2" onclick={onclose}>
					Abort
				</div>
			);
		}
		return buttons;
	};

	update_render();

	let tabs = {
		'Print Template': () => {
			return (
				<Editor
					className="h-100 w-100"
					language="htmlmixed"
					content={state.target.print_template}
					onchange={html => {
						state.target.print_template = html;
						update_render();
					}}
					autocomplete_data={state.parsed_data}
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
				/>,
				<div className="absolute right-0 bottom-0 ma3 ph3 pv2 ba b--black-10 bg-white f5 lh-solid w500">
					<div className="flex justify-between">
						<span>1.</span>
						Sample Entry
					</div>
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
					}}
				/>
			);
		},
		'Other Information': () => {
			return (
				<div className="pa3">
					<textarea className="form-input" cols="30" rows="10" value={state.target.description} placeholder="Short description..." onchange={e => (state.target.description = e.target.value)} />
				</div>
			);
		}
	};

	state.selected_tab = Object.keys(tabs)[0];

	return {
		oninit(vnode) {
			state.target = vnode.attrs.target;
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
					<div className="flex-shrink-0 bb b--black-10 ph3 pv2 bg-light-gray flex justify-between items-center">
						{templateBar(vnode.attrs.editName)}
						<div>
							<div
								className="btn btn-primary ml2"
								onclick={() => {
									api.print(state.last_render).then(
										() => {
											success('Job sent');
										},
										err => {
											error(err);
										}
									);
								}}
							>
								Test Print
							</div>
							{buttons(vnode.attrs.onsave, vnode.attrs.onclose)}
						</div>
					</div>
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
						<div className="preview flex-shrink-0">
							<Preview content={state.last_render} stylesheets={vnode.attrs.stylesheets} width={vnode.attrs.previewWidth} />
						</div>
					</div>
				</div>
			);
		}
	};
};
