import store from '/js/core/store';

import binder from '/js/ui/binder';

import Input from '/js/ui/components/input';
import SplitView from '/js/ui/components/split-view';

import { debounce, map, startCase, camelCase, get, defaultsDeep } from 'lodash-es';

import { render } from '/js/core/templating';

export default () => {
	let state = {
		template: null,
		target: null,
		parsedData: null,
		lastRender: '',
		selectedTab: '',
		onRender: null,
	};

	let updateRender = debounce(() => {
		try {
			state.lastRender = render(state.template.printTemplate, state.parsedData);
			m.redraw();

			if (state.onRender) {
				state.onRender(state.lastRender);
			}
		} catch (e) {}
		state.target.data = JSON.stringify(state.parsedData);
	}, 250);

	let tabs = () => {
		let entries = [];
		map(state.parsedData, (v, k) => {
			switch (typeof v) {
				case 'object':
					entries.push(
						<li className={'pointer nav-item ' + (state.selectedTab === k ? 'active' : '')}>
							<a onclick={() => (state.selectedTab = k)}>{startCase(camelCase(k))}</a>
						</li>
					);
					break;
			}
		});

		return (
			<ul className="nav">
				<li className={'pointer nav-item ' + (state.selectedTab === '' ? 'active' : '')}>
					<a onclick={() => (state.selectedTab = '')}>Global</a>
				</li>
				{entries}
			</ul>
		);
	};

	let walkRecursive = (curPath, name) => {
		let obj = get(state.parsedData, curPath);

		switch (typeof obj) {
			case 'number':
			case 'string':
				let isNum = typeof obj === 'number';

				return (
					<div className="form-group mw-50 mr3">
						<label className="form-label">{startCase(camelCase(name))}</label>
						{isNum ? (
							<input type="text" className="form-input" value={obj} oninput={binder.inputNumber(state.parsedData, curPath, updateRender)} />
						) : (
							<textarea
								className="form-input"
								placeholder={startCase(camelCase(name))}
								value={obj}
								rows="3"
								oninput={binder.inputString(state.parsedData, curPath, updateRender)}
							/>
						)}
					</div>
				);
			case 'boolean':
				return (
					<div className="form-group mw-25 pt1 mr3">
						<label className="form-label">{startCase(camelCase(name))}</label>
						<label className="form-switch">
							<input type="checkbox" checked={obj} oninput={binder.checkbox(state.parsedData, curPath, updateRender)} />
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
									obj.push(get(JSON.parse(state.template.skeletonData), curPath)[0]);
									updateRender();
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
													updateRender();
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
		let isTop = state.selectedTab.length === 0;

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
					{map(state.parsedData, (v, k) => {
						if (isTop && typeof v == 'object') return null;

						return walkRecursive(k, k);
					})}
				</div>
			);
		}

		return walkRecursive(state.selectedTab, state.selectedTab);
	};

	return {
		oninit(vnode) {
			state.template = vnode.attrs.template;
			state.target = vnode.attrs.target;
			state.onRender = vnode.attrs.onrender;

			if (state.target.data.length === 0) {
				state.parsedData = JSON.parse(state.template.skeletonData);
			} else {
				state.parsedData = defaultsDeep(JSON.parse(state.target.data), JSON.parse(state.template.skeletonData));
			}

			updateRender();
		},
		view(vnode) {
			if (!state.target) {
				return null;
			}

			return (
				<SplitView
					content={state.lastRender}
					width={340}
					scale={340.0 / store.data.settings.printerWidth}
					stylesheets={store.data.settings.stylesheets}
				>
					<div className="h-100 flex-grow-1 overflow-auto flex">
						<div className="w4 pl3">{tabs()}</div>
						<div className="divider-vert" />
						<div className="flex-grow-1 overflow-auto pt3 pb5">{body()}</div>
					</div>
				</SplitView>
			);
		},
	};
};
