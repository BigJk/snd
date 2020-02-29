import m from 'mithril';

import store from '../../core/store';

import binder from '../binder';

import * as nunjucks from 'nunjucks';

import Preview from './preview';
import Input from './input';

import debounce from 'lodash-es/debounce';
import map from 'lodash-es/map';
import startCase from 'lodash-es/startCase';
import camelCase from 'lodash-es/camelCase';
import get from 'lodash-es/get';
import defaultsDeep from 'lodash-es/defaultsDeep';

export default () => {
	let state = {
		template: null,
		target: null,
		parsed_data: null,
		last_render: '',
		selected_tab: '',
		on_render: null
	};

	let update_render = debounce(() => {
		try {
			state.last_render = nunjucks.renderString(state.template.print_template, { it: state.parsed_data });
			m.redraw();

			if (state.on_render) {
				state.on_render(state.last_render);
			}
		} catch (e) {
			console.log(e);
		}
		state.target.data = JSON.stringify(state.parsed_data);
	}, 250);

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
			case 'string':
				let isNum = typeof obj === 'number';

				return (
					<div className="form-group mw-50 mr3">
						<label className="form-label">{startCase(camelCase(name))}</label>
						{isNum ? (
							<input type="text" className="form-input" value={obj} oninput={binder.inputNumber(state.parsed_data, curPath, update_render)} />
						) : (
							<textarea className="form-input" placeholder={startCase(camelCase(name))} value={obj} rows="3" oninput={binder.inputString(state.parsed_data, curPath, update_render)} />
						)}
					</div>
				);
			case 'boolean':
				return (
					<div className="form-group mw-25 pt1 mr3">
						<label className="form-label">{startCase(camelCase(name))}</label>
						<label className="form-switch">
							<input type="checkbox" checked={obj} oninput={binder.checkbox(state.parsed_data, curPath, update_render)} />
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
					<div className="pr3">
						<div className="f5">Globals</div>
						<div className="divider" />
						<div className="pb2">
							<Input label="Entry Name" value={state.target.name} oninput={binder.inputString(state.target, 'name')} />
						</div>
						<div className="divider" />
					</div>
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
			state.on_render = vnode.attrs.onrender;

			if (state.target.data.length === 0) {
				state.parsed_data = JSON.parse(state.template.skeleton_data);
			} else {
				state.parsed_data = defaultsDeep(JSON.parse(state.target.data), JSON.parse(state.template.skeleton_data));
			}

			update_render();
		},
		view(vnode) {
			if (!state.target) {
				return null;
			}
			return (
				<div className="w-100 h-100 flex flex-column">
					<div className="w-100 h-100 flex-grow-1 overflow-auto flex">
						<div className="h-100 flex-grow-1 overflow-auto flex">
							<div className="w4 pl3">{tabs()}</div>
							<div className="divider-vert" />
							<div className="flex-grow-1 overflow-auto pt3 pb5">{body()}</div>
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
