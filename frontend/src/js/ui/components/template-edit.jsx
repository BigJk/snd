import { debounce, isArray, map, mergeWith, uniq } from 'lodash-es';

import { fetchMultipleEntries } from '/js/core/api-helper';
import htmlFormat from '/js/core/html-format';
import { dataSourceId, templateId } from '/js/core/model-helper';
import snippets from '/js/core/snippets';
import store from '/js/core/store';
import { render } from '/js/core/templating';

import { Editor, ImageDataURI, Input, Select, SplitView, TextArea, Tooltip } from '/js/ui/components';

import binder from '/js/ui/binder';
import { error } from '/js/ui/toast';

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
		state.templateErrors = [];
		state.listTemplateErrors = [];

		Promise.all([
			render(state.target.printTemplate, { it: state.target.skeletonData, images: state.target.images })
				.then((res) => {
					state.lastRender = res;
				})
				.catch((err) => {
					state.templateErrors = [err];
				}),

			render(state.target.listTemplate, { it: state.target.skeletonData, images: state.target.images })
				.then((res) => {
					state.lastListRender = res;
				})
				.catch((err) => {
					state.listTemplateErrors = [err];
				}),
		]).then(m.redraw);

		if (state.onRender) {
			state.onRender(state.lastRender);
		}
	}, 250);

	let updateEntries = () => {
		fetchMultipleEntries(state.editMode ? [templateId(state.target), ...(state.target.dataSources ?? [])] : state.target.dataSources ?? [])
			.then((entries) => (state.entries = entries))
			.catch(error);
	};

	let tabs = {
		Information: () => (
			<div className='pa3'>
				<div className='toast toast-primary lh-copy mb1'>Here you can set basic information about the template.</div>
				<Input label='Name' cols={9} value={state.target.name} oninput={binder.inputString(state.target, 'name')} />
				{!state.editMode ? (
					<Input
						label='Author'
						cols={9}
						value={state.target.author}
						oninput={binder.inputString(state.target, 'author', null, (txt) => txt.replace(/[^a-z0-9-]/gi, ''))}
					/>
				) : null}
				{!state.editMode ? (
					<Input
						label='Slug'
						cols={9}
						value={state.target.slug}
						oninput={binder.inputString(state.target, 'slug', null, (txt) => txt.replace(/[^a-z0-9-]/gi, ''))}
					/>
				) : null}
				<TextArea label='Description' cols={9} value={state.target.description} oninput={binder.inputString(state.target, 'description')} />
			</div>
		),
		Images: () => (
			<div className='pa3'>
				<div className='toast toast-primary lh-copy mb3'>
					Here you can add images that are available in the templates. If you export or import a template the images will be included as well.
					<br /> <br /> You can access a image in the template via: <br />
					<div className='mt1'>
						<code>&#123;&#123; images[IMAGE_NAME.png] &#125;&#125;</code>
					</div>
				</div>
				<div className='flex'>
					<ImageDataURI oninput={(name, data) => (state.target.images[name] = data)} />
					<div className='ml3 flex-grow-1'>
						<div className='mb2 f5'>Imported Images</div>
						<div className='divider' />
						{map(state.target.images, (val, key) => (
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
						))}
					</div>
				</div>
			</div>
		),
		Sources: () => (
			<div className='ph3 pt3'>
				<div className='toast toast-primary lh-copy mb2'>
					Here you can add data sources to this template. If you add a data source the entries in the data source will be available in this template.
				</div>
				<Select
					label='Add Sources'
					selected={state.selectedSource}
					keys={store.data.sources?.map(dataSourceId)}
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

						updateEntries();
					}}
				>
					Add Source
				</div>

				<div className='divider' />

				{state.target.dataSources?.map((d, i) => (
					<span className='chip'>
						{d}
						<div className='btn btn-clear' aria-label='Close' role='button' onclick={() => state.target.dataSources.splice(i, 1)} />
					</span>
				))}
			</div>
		),
		'Data Skeleton': () => (
			<div className='h-100 flex flex-column overflow-auto'>
				<Editor
					className='flex-grow-1 w-100 bb b--black-10 overflow-auto'
					language='javascript'
					content={state.skeletonDataRaw}
					formatter={(data) => {
						try {
							return JSON.stringify(JSON.parse(data), null, '\t');
						} catch (e) {
							console.log(e);
						}
						return data;
					}}
					onchange={(data) => {
						state.skeletonDataRaw = data;
						try {
							state.target.skeletonData = JSON.parse(data);
							updateRender();
						} catch (e) {
							console.log(e);
						}
					}}
				/>
				<div className='flex-shrink-0 h3 flex items-center ph3 flex'>
					<div className='mr2 w4'>
						<Input placeholder='Search...' value={state.entriesSearch} oninput={binder.inputString(state, 'entriesSearch')} />
					</div>
					<div className='mr2 w4'>
						<Select
							selected={state.entriesSelected}
							keys={state.entries.filter((e) => e.name.toLowerCase().indexOf(state.entriesSearch.toLowerCase()) >= 0).map((_, i) => i)}
							names={state.entries.filter((e) => e.name.toLowerCase().indexOf(state.entriesSearch.toLowerCase()) >= 0).map((e) => e.name)}
							oninput={(e) => (state.entriesSelected = parseInt(e.target.value))}
						/>
					</div>
					<Tooltip content='Loads the selected entry as skeleton data.'>
						<div
							className='btn btn-primary mr2'
							onclick={() => {
								if (state.entriesSelected === null) {
									return;
								}

								state.skeletonDataRaw = JSON.stringify(
									state.entries.filter((e) => e.name.toLowerCase().indexOf(state.entriesSearch.toLowerCase()) >= 0)[state.entriesSelected].data,
									null,
									'\t'
								);
								state.target.skeletonData = state.entries.filter((e) => e.name.toLowerCase().indexOf(state.entriesSearch.toLowerCase()) >= 0)[
									state.entriesSelected
								].data;
								state.entriesSearch = '';
								state.entriesSelected = null;
							}}
						>
							Load as Skeleton
						</div>
					</Tooltip>
					<Tooltip content='Merges the selected entry into the current skeleton.'>
						<div
							className='btn btn-primary'
							onclick={() => {
								if (state.entriesSelected === null) {
									return;
								}

								state.target.skeletonData = mergeWith(state.target.skeletonData, ...[state.entries[state.entriesSelected].data], entryMerger);
								state.skeletonDataRaw = JSON.stringify(state.target.skeletonData, null, '\t');
							}}
						>
							Merge Into
						</div>
					</Tooltip>
					<div className='divider divider-vert btn' />
					<Tooltip content='Merges all entries and tries to build a full skeleton from it.'>
						<div
							className='btn btn-error'
							onclick={() => {
								state.target.skeletonData = mergeWith({}, ...state.entries.map((e) => e.data), entryMerger);
								state.skeletonDataRaw = JSON.stringify(state.target.skeletonData, null, '\t');
							}}
						>
							Merge All
						</div>
					</Tooltip>
				</div>
			</div>
		),
		'Print Template': () => (
			<Editor
				className='h-100 w-100'
				language='nunjucks'
				content={state.target.printTemplate}
				onchange={(html) => {
					state.target.printTemplate = html;
					updateRender();
				}}
				snippets={snippets}
				autocompleteData={{ it: state.target.skeletonData, settings: store.data.settings }}
				errorProvider={() => state.templateErrors}
				formatter={htmlFormat}
			/>
		),
		'List Template': () => [
			<Editor
				className='h-100 w-100'
				language='nunjucks'
				content={state.target.listTemplate}
				onchange={(html) => {
					state.target.listTemplate = html;
					updateRender();
				}}
				snippets={snippets}
				autocompleteData={{ it: state.target.skeletonData, settings: store.data.settings }}
				errorProvider={() => state.listTemplateErrors}
				formatter={htmlFormat}
			/>,
			<div className='absolute right-0 bottom-0 ma3 pa2 ba b--black-10 bg-white f5 lh-solid w500'>
				<div className='fw7'>Sample Entry</div>
				<div className='black-50'>{m.trust(state.lastListRender)}</div>
			</div>,
		],
	};

	state.selectedTab = Object.keys(tabs)[0];

	return {
		oninit(vnode) {
			state.target = vnode.attrs.target;
			state.editMode = vnode.attrs.editmode ?? false;
			state.onRender = vnode.attrs.onrender;
			state.skeletonDataRaw = JSON.stringify(state.target.skeletonData, null, 2);

			updateEntries();
			updateRender();
		},
		view(vnode) {
			if (!state.target) {
				return;
			}
			return (
				<SplitView
					content={state.lastRender}
					devTools={true}
					width={340}
					scale={340.0 / store.data.settings.printerWidth}
					stylesheets={store.data.settings.stylesheets}
				>
					<ul className='tab tab-block tab-m0 flex-shrink-0'>
						{map(tabs, (v, k) => (
							<li className={'tab-item ' + (k === state.selectedTab ? 'active' : '')} onclick={() => (state.selectedTab = k)}>
								<a className='pointer'>{k}</a>
							</li>
						))}
					</ul>
					<div className='relative w-100 flex-grow-1 overflow-auto'>{tabs[state.selectedTab]()}</div>
				</SplitView>
			);
		},
	};
};
