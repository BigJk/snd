import { debounce, map, pickBy, uniq } from 'lodash-es';

import api from '/js/core/api';
import { render } from '/js/core/generator';
import snippets from '/js/core/snippets';
import store from '/js/core/store';

import { Editor, GeneratorConfig, Input, Select, SplitView, Switch, TextArea } from '/js/ui/components';
import Types from '/js/ui/components/generator/types';

import binder from '/js/ui/binder';

export default () => {
	let state = {
		target: null,
		editMode: false,
		lastRender: '',
		selectedTab: '',
		selectedSource: '',
		testConfig: {},
		onRender: null,
		templateErrors: [],
		entries: [],
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

		state.testConfig = pickBy(state.testConfig, (val, key) => {
			return state.target.config.some((conf) => {
				return conf.key === key || key === 'seed';
			});
		});
	};

	let updateRender = debounce(() => {
		state.templateErrors = [];

		sanitizeConfig();

		render(state.target, state.entries, state.testConfig)
			.then((res) => {
				state.lastRender = res;
			})
			.catch((err) => {
				state.templateErrors = [err];
			})
			.then(m.redraw);

		if (state.onRender) {
			state.onRender(state.lastRender);
		}
	}, 1000);

	let updateRenderSanitize = () => {
		sanitizeConfig();
		updateRender();
	};

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
					<Switch
						label='Pass Entries to Javascript'
						labelCol={5}
						value={state.target.passEntriesToJS}
						oninput={binder.checkbox(state.target, 'passEntriesToJS')}
					/>
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
			return (
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
					{state.target.config.map((val, i) => {
						return [
							<div className='flex w-100'>
								<div className='flex-grow-1 mr3'>
									<Input
										label='Key'
										placeholder='Key'
										value={val.key}
										oninput={binder.inputString(val, 'key', updateRenderSanitize)}
									></Input>
									<Input
										label='Name'
										placeholder='Name'
										value={val.name}
										oninput={binder.inputString(val, 'name', updateRenderSanitize)}
									></Input>
									<Input
										label='Description'
										placeholder='Description'
										value={val.description}
										oninput={binder.inputString(val, 'description', updateRenderSanitize)}
									></Input>
								</div>
								<div className='flex-grow-1'>
									<Select
										label='Printer Type'
										keys={Object.keys(Types)}
										selected={val.type}
										labelCol={4}
										oninput={binder.inputString(val, 'type', (newType) => {
											val.data = val.default = Types[newType].defaultValue;
											state.testConfig[val.key] = val.default;
											updateRenderSanitize();
										})}
									></Select>
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
									state.target.config.splice(i, 1);
									updateRenderSanitize();
								}}
							>
								Delete
							</div>,
							<div className='divider' />,
						];
					})}
				</div>
			);
		},
		'Test Config': () => {
			return (
				<div className='ph3 pt2'>
					<GeneratorConfig
						config={state.target.config}
						value={state.testConfig}
						onchange={(key, val) => {
							state.testConfig[key] = val;
							updateRenderSanitize();
						}}
					></GeneratorConfig>
				</div>
			);
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
			state.testConfig = vnode.attrs.testConfig ?? {
				seed: 'TEST_SEED',
			};

			if (state.editMode) {
				api.getEntriesWithSources(`gen:${state.target.author}+${state.target.slug}`).then((entries) => {
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
