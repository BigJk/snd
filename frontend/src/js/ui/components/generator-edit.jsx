import { chunk, debounce, isArray, map, mergeWith, uniq } from 'lodash-es';

import api from '/js/core/api';
import store from '/js/core/store';
import { renderAsync } from '/js/core/templating';

import { Editor, Input, Select, SplitView, TextArea, Tooltip } from '/js/ui/components';

import binder from '/js/ui/binder';

function entryMerger(objValue, srcValue) {
	if (typeof objValue === 'string' && typeof srcValue === 'string') {
		return objValue;
	}
	if (!isArray(objValue) && isArray(srcValue)) {
		return srcValue;
	}
	if (isArray(objValue) && !isArray(srcValue)) {
		return objValue;
	}
	if (isArray(objValue) && isArray(srcValue)) {
		return objValue.length > srcValue.length ? objValue : srcValue;
	}
	return undefined;
}

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
		testConfig: {},
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
			{ config: state.testConfig, images: state.target.images },
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
			{ config: state.testConfig, images: state.target.images },
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

	let tabs = {
		Information: () => {
			return (
				<div className='pa3'>
					<div className='toast toast-primary lh-copy mb1'>Here you can set basic information about the generator.</div>
					<Input label='Name' cols={9} value={state.target.name} oninput={binder.inputString(state.target, 'name')} />
					{!state.editMode ? (
						<Input
							label='Author'
							cols={9}
							value={state.target.author}
							oninput={binder.inputString(state.target, 'author', null, (txt) => txt.replace(/[^a-z0-9\-]/gi, ''))}
						/>
					) : null}
					{!state.editMode ? (
						<Input
							label='Slug'
							cols={9}
							value={state.target.slug}
							oninput={binder.inputString(state.target, 'slug', null, (txt) => txt.replace(/[^a-z0-9\-]/gi, ''))}
						/>
					) : null}
					<TextArea
						label='Description'
						cols={9}
						value={state.target.description}
						oninput={binder.inputString(state.target, 'description')}
					/>
				</div>
			);
		},
		Images: () => {
			return (
				<div className='pa3'>
					<div className='toast toast-primary lh-copy mb3'>
						Here you can add images that are available in the generator template. If you export or import a generator the images will be
						included as well.
						<br /> <br /> You can access a image in the generator via: <br />
						<div className='mt1'>
							<code>&#123;&#123; images[IMAGE_NAME.png] &#125;&#125;</code>
						</div>
					</div>
					<input
						className='mb1'
						type='file'
						id='files'
						name='files[]'
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
					<div className='divider' />
					<div className='mt1'>
						{map(state.target.images, (val, key) => {
							return (
								<div className='flex items-center justify-between mb2'>
									<div className='flex items-center'>
										<img src={val} alt='' width={64} className='mr2' />
										{key}
									</div>
									<div
										className='btn btn-error'
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
				<div className='ph3 pt3'>
					<div className='toast toast-primary lh-copy mb2'>
						Here you can add data sources to this generator. If you add a data source the entries in the data source will be available in
						this generator.
					</div>
					<Select
						label='Add Sources'
						selected={state.selectedSource}
						keys={store.data.sources?.map((s) => `ds:${s.author}+${s.slug}`)}
						names={store.data.sources?.map((s) => `${s.name} (${s.author})`)}
						oninput={(e) => (state.selectedSource = e.target.value)}
					/>
					<div
						className='btn btn-primary mb1'
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

					<div className='divider' />

					{state.target.dataSources?.map((d, i) => {
						return (
							<span className='chip'>
								{d}
								<div
									className='btn btn-clear'
									aria-label='Close'
									role='button'
									onclick={() => state.target.dataSources.splice(i, 1)}
								/>
							</span>
						);
					})}
				</div>
			);
		},
		Config: () => {
			return <div className='pa3'>...</div>;
		},
		'Test Config': () => {
			return <div className='pa3'>...</div>;
		},
		'Print Template': () => {
			return (
				<Editor
					className='h-100 w-100'
					language='nunjucks'
					content={state.target.printTemplate}
					onchange={(html) => {
						state.target.printTemplate = html;
						updateRender();
					}}
					snippets={snippets}
					autocompleteData={{ config: state.testConfig, settings: store.data.settings }}
					errorProvider={() => {
						return state.templateErrors;
					}}
				/>
			);
		},
	};

	state.selectedTab = Object.keys(tabs)[0];

	return {
		oninit(vnode) {
			updateRender();

			state.target = vnode.attrs.target;
			state.editMode = vnode.attrs.editmode ?? false;
			state.onRender = vnode.attrs.onrender;

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
					<ul className='tab tab-block tab-m0 flex-shrink-0'>
						{map(tabs, (v, k) => {
							return (
								<li className={'tab-item ' + (k === state.selectedTab ? 'active' : '')} onclick={() => (state.selectedTab = k)}>
									<a className='pointer'>{k}</a>
								</li>
							);
						})}
					</ul>
					<div className='relative w-100 flex-grow-1 overflow-auto'>{tabs[state.selectedTab]()}</div>
				</SplitView>
			);
		},
	};
};
