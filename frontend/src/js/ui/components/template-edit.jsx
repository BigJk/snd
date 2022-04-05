import store from '/js/core/store';

import binder from '/js/ui/binder';

import { renderAsync } from '/js/core/templating';

import Editor from '/js/ui/components/editor';
import TextArea from '/js/ui/components/text-area';
import Input from '/js/ui/components/input';
import SplitView from '/js/ui/components/split-view';

import debounce from 'lodash-es/debounce';
import map from 'lodash-es/map';

const snippets = [
	{
		name: 'if',
		content: `{% if variable %}
  
{% endif %}`,
	},
	{
		name: 'if-else',
		content: `{% if variable %}
  
{% elif tired %}

{% else %}

{% endif %}`,
	},
	{
		name: 'if-in-place',
		content: '{{ "true" if foo else "false" }}',
	},
	{
		name: 'for-in',
		content: `{% for item in items %}
		
{% else %}

{% endfor %}`,
	},
	{
		name: 'macro',
		content: `{% macro your_macro(val, other_val='') %}

{% endmacro %}`,
	},
	{
		name: 'set',
		content: `{% set x = 5 %}`,
	},
	{
		name: 'set-block',
		content: `{% set x %}
		
{% endset %}`,
	},
];

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
		listTemplateErrors: [],
	};

	let updateRender = debounce(() => {
		let rerender = false;

		state.templateErrors = [];
		state.listTemplateErrors = [];

		renderAsync(
			state.target.printTemplate,
			state.parsedData,
			(res) => {
				rerender = true;
				state.lastRender = res;
			},
			(err) => {
				state.templateErrors = [err];
			}
		);

		renderAsync(
			state.target.listTemplate,
			state.parsedData,
			(res) => {
				rerender = true;
				state.lastListRender = res;
			},
			(err) => {
				state.listTemplateErrors = [err];
			}
		);

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
					onchange={(html) => {
						state.target.printTemplate = html;
						updateRender();
					}}
					snippets={snippets}
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
					onchange={(html) => {
						state.target.listTemplate = html;
						updateRender();
					}}
					snippets={snippets}
					autocompleteData={state.parsedData}
					errorProvider={() => {
						return state.listTemplateErrors;
					}}
				/>,
				<div className="absolute right-0 bottom-0 ma3 pa2 ba b--black-10 bg-white f5 lh-solid w500">
					<div className="fw7">Sample Entry</div>
					<div className="black-50">{m.trust(state.lastListRender)}</div>
				</div>,
			];
		},
		'Data Skeleton': () => {
			return (
				<Editor
					className="h-100 w-100"
					language="javascript"
					content={state.skeletonDataRaw}
					formatter={(data) => {
						try {
							return JSON.stringify(JSON.parse(data), null, '\t');
						} catch (e) {}
						return data;
					}}
					onchange={(data) => {
						state.skeletonDataRaw = data;
						try {
							state.parsedData = JSON.parse(data);
							updateRender();
						} catch (e) {}
						state.target.skeletonData = JSON.stringify(state.parsedData);
					}}
				/>
			);
		},
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
				<SplitView
					content={state.lastRender}
					width={340}
					scale={340.0 / store.data.settings.printerWidth}
					stylesheets={store.data.settings.stylesheets}
				>
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
		},
	};
};
