import { debounce, map, pickBy, uniq } from 'lodash-es';

import { fetchMultipleEntries } from '/js/core/api-helper';
import { render } from '/js/core/generator';
import htmlFormat from '/js/core/html-format';
import { dataSourceId } from '/js/core/model-helper';
import snippets from '/js/core/snippets';
import store from '/js/core/store';

import { Editor, GeneratorConfig, Input, Loading, Select, SplitView, Switch, TextArea } from '/js/ui/components';
import Types from '/js/ui/components/generator/types';

import binder from '/js/ui/binder';
import { dialogWarning, error } from '/js/ui/toast';

export default () => {
	let state = {
		target: null,
		editMode: false,
		rendering: false,
		lastRender: '',
		selectedTab: '',
		selectedSource: '',
		testConfig: {},
		onRender: null,
		templateErrors: [],
		entries: null,
		entriesSearch: '',
		entriesSelected: null,
		imagesToUpload: [],
	};

	let sanitizeConfig = () => {
		state.target.config.forEach((conf) => {
			if (state.testConfig[conf.key] === undefined) {
				state.testConfig[conf.key] = conf.default;
			}
		});

		if (state.testConfig.seed === undefined) {
			state.testConfig.seed = 'TEST_SEED';
		}

		state.testConfig = pickBy(state.testConfig, (val, key) => key === 'seed' || state.target.config.some((conf) => conf.key === key));
	};

	let updateRender = debounce(() => {
		state.templateErrors = [];
		state.rendering = true;

		sanitizeConfig();

		render(state.target, state.entries, state.testConfig)
			.then((res) => {
				state.lastRender = res;
			})
			.catch((err) => {
				state.templateErrors = [err];
			})
			.finally(() => {
				state.rendering = false;
				m.redraw();
			});

		if (state.onRender) {
			state.onRender(state.lastRender);
		}

		m.redraw();
	}, 1000);

	let updateRenderSanitize = () => {
		sanitizeConfig();
		updateRender();
	};

	let updateEntries = () => {
		fetchMultipleEntries(state.target.dataSources ?? [])
			.then((entries) => (state.entries = entries))
			.catch(error);
	};

	let tabs = {
		Information: () => (
			<div className='pa3'>
				<div className='toast toast-primary lh-copy mb1'>Here you can set basic information about the generator.</div>
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
				<Switch
					label='Pass Entries to Javascript (creates "entries" js variable)'
					labelCol={5}
					value={state.target.passEntriesToJS}
					oninput={binder.checkbox(state.target, 'passEntriesToJS')}
				/>
				<TextArea label='Description' cols={9} value={state.target.description} oninput={binder.inputString(state.target, 'description')} />
			</div>
		),
		Images: () => (
			<div className='pa3'>
				<div className='toast toast-primary lh-copy mb3'>
					Here you can add images that are available in the generator template. If you export or import a generator the images will be included as
					well.
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

							reader.onload = ((name) => (e) => {
								if (!state.target.images) {
									state.target.images = {};
								}
								state.target.images[name] = e.target.result;
								m.redraw();
							})(f.name);

							reader.readAsDataURL(f);
						}
					}}
				/>
				<div className='divider' />
				<div className='mt1'>
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
		),
		Sources: () => (
			<div className='ph3 pt3'>
				<div className='toast toast-primary lh-copy mb2'>
					Here you can add data sources to this generator. If you add a data source the entries in the data source will be available in this
					generator.
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
		Config: () => (
			<div className='pa3'>
				<div
					className='btn btn-primary mb1'
					onclick={() => {
						state.target.config.push({
							key: 'option_key_' + Math.ceil(Math.random() * 10000),
							name: 'Option Name',
							description: 'Option description',
							type: 'Text',
							data: 'hello world',
							default: 'hello world',
						});

						updateRenderSanitize();
					}}
				>
					New Config Value
				</div>
				<div className='divider' />
				{state.target.config.map((val, i) => [
					<div className='flex w-100'>
						<div className='w-50 flex-shrink-0 mr3'>
							<Input label='Key' placeholder='Key' value={val.key} oninput={binder.inputString(val, 'key', updateRenderSanitize)} />
							<Input label='Name' placeholder='Name' value={val.name} oninput={binder.inputString(val, 'name', updateRenderSanitize)} />
							<Input
								label='Description'
								placeholder='Description'
								value={val.description}
								oninput={binder.inputString(val, 'description', updateRenderSanitize)}
							/>
						</div>
						<div className='w-50 flex-shrink-0 pr3'>
							<Select
								label='Type'
								keys={Object.keys(Types)}
								names={Object.keys(Types).map((key) => Types[key].name)}
								selected={val.type}
								labelCol={4}
								oninput={binder.inputString(val, 'type', (newType) => {
									val.default = Types[newType].defaultValue();
									state.testConfig[val.key] = val.default;
									updateRenderSanitize();
								})}
							/>
							{m(Types[val.type].view, {
								value: val.default,
								oninput: (newVal) => {
									val.default = newVal;
									state.testConfig[val.key] = val.default;
									updateRenderSanitize();
								},
								inEdit: true,
								label: 'Default Value',
							})}
						</div>
					</div>,
					<div
						className='btn btn-error mt3 mb1'
						onclick={() => {
							dialogWarning(`Do you really want to delete the '${val.name}' option?`).then(() => {
								state.target.config.splice(i, 1);
								updateRenderSanitize();
							});
						}}
					>
						Delete
					</div>,
					<div className='divider' />,
				])}
			</div>
		),
		'Test Config': () => (
			<div className='ph3 pt2'>
				<GeneratorConfig
					config={state.target.config}
					value={state.testConfig}
					onchange={(key, val) => {
						state.testConfig[key] = val;
						updateRenderSanitize();
					}}
				/>
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
				snippets={[
					...snippets,
					{
						name: 'dice',
						content: `dice.roll('1d6').total`,
					},
					{
						name: 'random',
						content: `random()`,
					},
				]}
				autocompleteData={{ config: state.testConfig, settings: store.data.settings }}
				errorProvider={() => state.templateErrors}
				formatter={htmlFormat}
			/>
		),
	};

	state.selectedTab = Object.keys(tabs)[0];

	return {
		oninit(vnode) {
			state.target = vnode.attrs.target;
			state.editMode = vnode.attrs.editmode ?? false;
			state.onRender = vnode.attrs.onrender;
			state.testConfig = vnode.attrs.testConfig ?? {
				seed: 'TEST_SEED',
			};

			updateEntries();
			updateRender();
		},
		view(vnode) {
			if (!state.target || state.entries === null) {
				return <Loading />;
			}

			return (
				<SplitView
					content={state.lastRender}
					devTools={true}
					width={340}
					scale={340.0 / store.data.settings.printerWidth}
					stylesheets={store.data.settings.stylesheets}
					loading={state.rendering}
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
