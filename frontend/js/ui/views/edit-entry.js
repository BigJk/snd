import m from 'mithril';

import api from '../../core/api';

import { error, success } from '../toast';

import dot from 'dot';

import Preview from '../components/preview';

import debounce from 'lodash-es/debounce';
import map from 'lodash-es/map';
import startCase from 'lodash-es/startCase';
import camelCase from 'lodash-es/camelCase';
import get from 'lodash-es/get';
import set from 'lodash-es/set';

export default () => {
	let state = {
		template: null,
		target: null,
		parsed_data: null,
		last_render: '',
		selected_tab: ''
	};

	let update_render = debounce(() => {
		try {
			state.last_render = dot.template(state.template.print_template)(state.parsed_data);
			m.redraw();
		} catch (e) {
			console.log(e);
		}
	}, 250);

	let templateBar = editable => {
		if (editable) {
			return (
				<div className="w5">
					<input
						className="form-input"
						value={state.target.name}
						placeholder="Entry Name..."
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
						state.target.data = JSON.stringify(state.parsed_data);
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

	let tabs = () => {
		let entries = [];
		map(state.parsed_data, (v, k) => {
			switch (typeof v) {
				case 'object':
					entries.push(
						<li className={'pointer nav-item ' + (state.selected_tab === k ? 'active' : '')}>
							<a onclick={() => (state.selected_tab = k)}>{startCase(camelCase(k))}</a>
						</li>
					);
					break;
			}
		});

		return (
			<ul className="nav">
				<li className={'pointer nav-item ' + (state.selected_tab === '' ? 'active' : '')}>
					<a onclick={() => (state.selected_tab = '')}>Global</a>
				</li>
				{entries}
			</ul>
		);
	};

	let walkRecursive = (curPath, name) => {
		let obj = get(state.parsed_data, curPath);

		switch (typeof obj) {
			case 'number':
				let oninputNumber = e => {
					let num = parseInt(e.target.value);
					if (isNaN(num)) {
						num = 0;
					}
					set(state.parsed_data, curPath, num);
					update_render();
				};
			case 'string':
				let oninputString = e => {
					set(state.parsed_data, curPath, e.target.value);
					update_render();
				};

				let isNum = typeof obj === 'number';

				return (
					<div className="form-group mw-50 mr3">
						<label className="form-label">{startCase(camelCase(name))}</label>
						{isNum ? <input type="text" className="form-input" value={obj} oninput={oninputNumber} /> : <textarea className="form-input" placeholder={startCase(camelCase(name))} value={obj} rows="3" oninput={oninputString} />}
					</div>
				);
			case 'boolean':
				let oninputBool = e => {
					set(state.parsed_data, curPath, e.target.checked);
					update_render();
				};

				return (
					<div className="form-group mw-25 pt1 mr3">
						<label className="form-label">{startCase(camelCase(name))}</label>
						<label className="form-switch">
							<input type="checkbox" checked={obj} oninput={oninputBool} />
							<i className="form-icon" /> {startCase(camelCase(obj))}
						</label>
					</div>
				);
			case 'object':
				if (Array.isArray(obj)) {
					return (
						<div className="pr3">
							<div
								className="btn btn-primary mb2"
								onclick={() => {
									obj.push(get(JSON.parse(state.template.skeleton_data), curPath)[0]);
									update_render();
								}}
							>
								Create New
							</div>
							{map(obj, (v, k) => {
								return (
									<div className="panel mb2 pt2">
										<div className="panel-body">{walkRecursive(curPath + '[' + k + ']', k)}</div>
										<div className="panel-footer">
											<div
												className="btn btn-error"
												onclick={() => {
													obj.splice(k, 1);
													update_render();
												}}
											>
												Delete
											</div>
										</div>
									</div>
								);
							})}
						</div>
					);
				}
				return (
					<div>
						<div className="f5">{startCase(camelCase(name))}</div>
						<div className="divider" />
						{map(obj, (v, k) => {
							return walkRecursive(curPath + '.' + k, k);
						})}
					</div>
				);
		}

		return <div>{curPath}</div>;
	};

	let body = () => {
		let isTop = state.selected_tab.length === 0;

		if (isTop) {
			return (
				<div>
					<div className="f5">Globals</div>
					<div className="divider" />
					{map(state.parsed_data, (v, k) => {
						if (isTop && typeof v == 'object') return null;

						return walkRecursive(k, k);
					})}
				</div>
			);
		}

		return walkRecursive(state.selected_tab, state.selected_tab);
	};

	return {
		oninit(vnode) {
			state.template = vnode.attrs.template;
			state.target = vnode.attrs.target;

			if (state.target.data.length === 0) {
				state.parsed_data = JSON.parse(state.template.skeleton_data);
			} else {
				state.parsed_data = JSON.parse(state.target.data);
			}

			update_render();
		},
		view(vnode) {
			if (!state.target) {
				return null;
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
						<div className="h-100 flex-grow-1 overflow-auto flex">
							<div className="w4 pl3">{tabs()}</div>
							<div className="divider-vert"></div>
							<div className="flex-grow-1 overflow-auto pt3 pb5">{body()}</div>
						</div>
						<div className="preview flex-shrink-0">
							<Preview content={state.last_render} stylesheets={vnode.attrs.stylesheets} />
						</div>
					</div>
				</div>
			);
		}
	};
};
