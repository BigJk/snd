import api from '/js/core/api';
import store from '/js/core/store';
import binder from '/js/ui/binder';

import { renderAsync } from '/js/core/templating';

import { Editor, TextArea, Input, SplitView, Select } from '/js/ui/components';

import { chunk, debounce, map, uniq } from 'lodash-es';

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
		editMode: false,
		lastRender: '',
		lastListRender: '',
		selectedTab: '',
		selectedSource: '',
		skeletonDataRaw: '',
		onRender: null,
		templateErrors: [],
		listTemplateErrors: [],
		entries: [],
		entriesSearch: '',
		entriesSelected: null,
		imagesToUpload: [],
	};

	let updateRender = debounce(() => {
		let rerender = false;

		state.templateErrors = [];
		state.listTemplateErrors = [];

		renderAsync(
			state.target.printTemplate,
			state.target.skeletonData,
			state.target.images,
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
			state.target.skeletonData,
			state.target.images,
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
					{!state.editMode ? (
						<Input
							label="Author"
							cols={9}
							value={state.target.author}
							oninput={binder.inputString(state.target, 'author', null, (txt) => txt.replace(/[^a-z0-9\-]/gi, ''))}
						/>
					) : null}
					{!state.editMode ? (
						<Input
							label="Slug"
							cols={9}
							value={state.target.slug}
							oninput={binder.inputString(state.target, 'slug', null, (txt) => txt.replace(/[^a-z0-9\-]/gi, ''))}
						/>
					) : null}
					<TextArea label="Description" cols={9} value={state.target.description} oninput={binder.inputString(state.target, 'description')} />
				</div>
			);
		},
		Images: () => {
			return (
				<div className="pa3">
					<input
						className="mb1"
						type="file"
						id="files"
						name="files[]"
						multiple
						onchange={(e) => {
							let files = e.target.files;

							for (let i = 0, f; (f = files[i]); i++) {
								if (!f.type.match('image.*')) {
									continue;
								}

								let reader = new FileReader();

								reader.onload = ((name) => {
									return (e) => {
										if (!state.target.images) {
											state.target.images = {};
										}
										state.target.images[name] = e.target.result;
										m.redraw();
									};
								})(f.name);

								reader.readAsDataURL(f);
							}
						}}
					/>
					<div className="divider" />
					<div className="mt1">
						{map(state.target.images, (val, key) => {
							return (
								<div className="flex items-center justify-between mb2">
									<div className="flex items-center">
										<img src={val} alt="" width={64} className="mr2" />
										{key}
									</div>
									<div
										className="btn btn-error"
										onclick={() => {
											delete state.target.images[key];
										}}
									>
										Delete
									</div>
								</div>
							);
						})}
					</div>
				</div>
			);
		},
		Sources: () => {
			return (
				<div className="ph3 pt2">
					<Select
						label="Add Sources"
						selected={state.selectedSource}
						keys={store.data.sources?.map((s) => `ds:${s.author}+${s.slug}`)}
						names={store.data.sources?.map((s) => `${s.name} (${s.author})`)}
						oninput={(e) => (state.selectedSource = e.target.value)}
					/>
					<div
						className="btn btn-primary mb1"
						onclick={() => {
							if (state.selectedSource.length === 0) {
								return;
							}

							if (!state.target.dataSources) {
								state.target.dataSources = [];
							}

							state.target.dataSources.push(state.selectedSource);
							state.target.dataSources = uniq(state.target.dataSources);
							state.selectedSource = '';
						}}
					>
						Add Source
					</div>

					<div className="divider" />

					{state.target.dataSources?.map((d, i) => {
						return (
							<span className="chip">
								{d}
								<div className="btn btn-clear" aria-label="Close" role="button" onclick={() => state.target.dataSources.splice(i, 1)} />
							</span>
						);
					})}
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
					autocompleteData={state.target.skeletonData}
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
					autocompleteData={state.target.skeletonData}
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
				<div className="h-100 flex flex-column overflow-auto">
					<Editor
						className="flex-grow-1 w-100 bb b--black-10 overflow-auto"
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
								state.target.skeletonData = JSON.parse(data);
								updateRender();
							} catch (e) {}
						}}
					/>
					{state.editMode ? (
						<div className="flex-shrink-0 h3 flex items-center ph3 flex">
							<div className="mr3 w4">
								<Input placeholder="Search..." value={state.entriesSearch} oninput={binder.inputString(state, 'entriesSearch')} />
							</div>
							<div className="mr3 w4">
								<Select
									selected={state.entriesSelected}
									keys={state.entries.filter((e) => e.name.toLowerCase().indexOf(state.entriesSearch.toLowerCase()) >= 0).map((_, i) => i)}
									names={state.entries.filter((e) => e.name.toLowerCase().indexOf(state.entriesSearch.toLowerCase()) >= 0).map((e) => e.name)}
									oninput={(e) => (state.entriesSelected = parseInt(e.target.value))}
								/>
							</div>
							<div
								className="btn btn-primary"
								onclick={() => {
									state.skeletonDataRaw = JSON.stringify(state.entries[state.entriesSelected].data, null, '\t');
									state.target.skeletonData = state.entries[state.entriesSelected].data;
								}}
							>
								Load as Skeleton
							</div>
						</div>
					) : null}
				</div>
			);
		},
	};

	state.selectedTab = Object.keys(tabs)[0];

	return {
		oninit(vnode) {
			state.target = vnode.attrs.target;
			state.editMode = vnode.attrs.editmode ?? false;
			state.onRender = vnode.attrs.onrender;
			state.skeletonDataRaw = JSON.stringify(state.target.skeletonData, null, 2);

			if (state.editMode) {
				api.getEntriesWithSources(`tmpl:${state.target.author}+${state.target.slug}`).then((entries) => {
					state.entries = entries ?? [];
				});
			}
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
