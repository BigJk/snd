import m from 'mithril';

import store from 'core/store';

import binder from '../binder';

import * as nunjucks from 'nunjucks';

import Editor from './editor';
import Preview from './preview';
import TextArea from './textarea';
import Input from './input';
import SplitView from './split-view';

import debounce from 'lodash-es/debounce';
import map from 'lodash-es/map';

export default () => {
	let state = {
		target: null,
		parsedData: null,
		lastRender: '',
		lastListRender: '',
		selectedTab: '',
		skeletonDataRaw: '',
		onRender: null,
		templateErrors: [],
		listTemplateErrors: []
	};

	let templateError = e => {
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

	let updateRender = debounce(() => {
		let rerender = false;

		state.templateErrors = [];
		state.listTemplateErrors = [];

		try {
			state.lastRender = nunjucks.renderString(state.target.printTemplate, { it: state.parsedData });
			rerender = true;
		} catch (e) {
			let err = templateError(e);
			if (err) {
				state.templateErrors = [err];
			}
		}

		try {
			state.lastListRender = nunjucks.renderString(state.target.listTemplate, { it: state.parsedData });
			rerender = true;
		} catch (e) {
			let err = templateError(e);
			if (err) {
				state.listTemplateErrors = [err];
			}
		}

		if (rerender) {
			m.redraw();
		}

		if (state.onRender) {
			state.onRender(state.lastRender);
		}
	}, 250);

	updateRender();

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
					content={state.target.printTemplate}
					onchange={html => {
						state.target.printTemplate = html;
						updateRender();
					}}
					autocompleteData={state.parsedData}
					errorProvider={() => {
						return state.templateErrors;
					}}
				/>
			);
		},
		'List Template': () => {
			return [
				<Editor
					className="h-100 w-100"
					language="htmlmixed"
					content={state.target.listTemplate}
					onchange={html => {
						state.target.listTemplate = html;
						updateRender();
					}}
					autocompleteData={state.parsedData}
					errorProvider={() => {
						return state.listTemplateErrors;
					}}
				/>,
				<div className="absolute right-0 bottom-0 ma3 pa2 ba b--black-10 bg-white f5 lh-solid w500">
					<div className="fw7">Sample Entry</div>
					<div className="black-50">{m.trust(state.lastListRender)}</div>
				</div>
			];
		},
		'Data Skeleton': () => {
			return (
				<Editor
					className="h-100 w-100"
					language="javascript"
					content={state.skeletonDataRaw}
					onchange={data => {
						state.skeletonDataRaw = data;
						try {
							state.parsedData = JSON.parse(data);
							updateRender();
						} catch (e) {}
						state.target.skeletonData = JSON.stringify(state.parsedData);
					}}
				/>
			);
		}
	};

	state.selectedTab = Object.keys(tabs)[0];

	return {
		oninit(vnode) {
			state.target = vnode.attrs.target;
			state.onRender = vnode.attrs.onrender;
			if (state.target.skeletonData.length > 0) {
				state.parsedData = JSON.parse(state.target.skeletonData);
			} else {
				state.parsedData = {};
			}
			state.skeletonDataRaw = JSON.stringify(state.parsedData, null, 2);
		},
		view(vnode) {
			if (!state.target) {
				return;
			}
			return (
				<SplitView content={state.lastRender} width={340} scale={340.0 / store.data.settings.printerWidth} stylesheets={store.data.settings.stylesheets}>
					<ul className="tab tab-block tab-m0 flex-shrink-0">
						{map(tabs, (v, k) => {
							return (
								<li className={'tab-item ' + (k === state.selectedTab ? 'active' : '')} onclick={() => (state.selectedTab = k)}>
									<a className="pointer">{k}</a>
								</li>
							);
						})}
					</ul>
					<div className="relative w-100 flex-grow-1 overflow-auto">{tabs[state.selectedTab]()}</div>
				</SplitView>
			);
		}
	};
};
