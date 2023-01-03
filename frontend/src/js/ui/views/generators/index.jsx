import { groupBy, map, pickBy } from 'lodash-es';

import { inElectron, openFileDialog, openFolderDialog } from '/js/electron';
import { readFile } from '/js/file';

import api from '/js/core/api';
import * as fileApi from '/js/core/file-api';
import { render } from '/js/core/generator';
import { generatorId } from '/js/core/model-helper';
import store from '/js/core/store';

import { Header, Input, ModalImport, Preview, PreviewBox, Select, Tooltip } from '/js/ui/components';
import Base from '/js/ui/components/base';

import binder from '/js/ui/binder';
import { error, success } from '/js/ui/toast';

const viewModes = {
	default: {
		name: 'Default',
		view(state, id, g, i) {
			return (
				<PreviewBox
					className={`w-50 ${(i & 1) === 0 ? 'pr2' : ''}`}
					value={g}
					previewContent={state.rendered[id] ?? 'Rendering...'}
					loading={state.rendered[id] === undefined}
					bottomRight={
						<div className='btn' onclick={() => m.route.set(`/generators/gen:${g.author}+${g.slug}`)}>
							Open Generator
						</div>
					}
				/>
			);
		},
	},
	compact: {
		name: 'Compact',
		view(state, id, g, i) {
			return (
				<div className={`w-33 ${i % 3 === 1 ? 'ph2' : ''}`}>
					<div className='flex justify-between items-center bg-white ba b--black-10 pa2 mb2'>
						<div className='b f6 flex-shrink-0'>{g.name}</div>
						<div className='btn flex-shrink-0' onclick={() => m.route.set(`/generators/gen:${g.author}+${g.slug}`)}>
							Open Generator
						</div>
					</div>
				</div>
			);
		},
	},
	card: {
		name: 'Card',
		view(state, id, g) {
			return (
				<div className='bg-white ba b--black-10 mr2 mb2' style={{ width: '195px' }}>
					<div className='bg-white b f6 flex-shrink-0 bb b--black-10 pa2'>{g.name}</div>
					<div className='h-100 relative' style={{ height: '200px' }}>
						<div className='pa2 bg-gray'>
							<Preview
								className='h-100'
								content={state.rendered[id] ?? 'Rendering...'}
								stylesheets={store.data.settings.stylesheets}
								width={140}
								scale={140 / store.data.settings.printerWidth}
							/>
						</div>
						<div
							className='absolute w-100 h-100 left-0 top-0 z-2'
							style={{ background: 'linear-gradient(0deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.80) 100%)' }}
						>
							<div className='flex flex-column justify-between h-100 pa2'>
								<div className='lh-copy text-muted text-overflow-hide flex-grow-1'>{g.description}</div>
								<div className='btn flex-shrink-0' onclick={() => m.route.set(`/generators/gen:${g.author}+${g.slug}`)}>
									Open Generator
								</div>
							</div>
						</div>
					</div>
				</div>
			);
		},
	},
};
let selectedViewMode = 'default';

export default () => {
	let state = {
		search: '',
		importing: {
			show: false,
			loading: false,
		},
		configs: {},
		rendered: {},
		entries: {},
	};

	let sanitizeConfig = (g) => {
		let id = generatorId(g);

		// create base config
		if (state.configs[id] === undefined) {
			state.configs[id] = {
				seed: 'TEST_SEED',
			};
		}

		// set seed if uninitialized
		if (state.configs[id].seed === undefined) {
			state.configs[id].seed = 'TEST_SEED';
		}

		// set default values for initialized fields
		g.config.forEach((conf) => {
			if (state.configs[id][conf.key] === undefined) {
				state.configs[id][conf.key] = conf.default;
			}
		});

		// remove old fields that are not present in the config anymore.
		state.configs[id] = pickBy(state.configs[id], (val, key) => key === 'seed' || g.config.some((conf) => conf.key === key));
	};

	let rerender = (g) => {
		let id = generatorId(g);

		return render(g, state.entries[id], state.configs[id])
			.then((res) => {
				state.rendered[id] = res;
			})
			.catch((err) => {
				state.rendered[id] = `Error: ${err}`;
			});
	};

	let onimport = (type, url) => {
		switch (type) {
			case 'zip':
				{
					if (inElectron) {
						openFileDialog().then((file) => {
							state.importing.loading = true;
							api
								.importGeneratorZip(file)
								.then((name) => {
									success(`Imported '${name}' successful`);
									store.pub('reload_generators');
								})
								.catch(error)
								.finally(() => {
									state.importing.show = false;
									state.importing.loading = false;
								});
						});
					} else {
						readFile().then((res) => {
							state.importing.loading = true;
							api
								.importGeneratorZip(res)
								.then((name) => {
									success(`Imported '${name}' successful`);
									store.pub('reload_generators');
								})
								.catch(error)
								.finally(() => {
									state.importing.show = false;
									state.importing.loading = false;
								});
						});
					}
				}
				break;
			case 'folder':
				{
					if (inElectron) {
						openFolderDialog()
							.then((folder) => {
								state.importing.loading = true;
								return api.importGeneratorFolder(folder);
							})
							.then((name) => {
								success(`Imported '${name}' successful`);
								store.pub('reload_generators');
							})
							.catch(error)
							.finally(() => {
								state.importing.show = false;
								state.importing.loading = false;
							});
					} else if (fileApi.hasFileApi) {
						fileApi
							.openFolderDialog(false)
							.then((folder) =>
								fileApi
									.folderToJSON(folder)
									.then((folderJsonString) => api.importGeneratorJSON(folderJsonString))
									.then(() => {
										success(`Imported '${folder.name}' successful`);
										store.pub('reload_generators');
									})
							)
							.catch(error)
							.finally(() => {
								state.importing.show = false;
								state.importing.loading = false;
							});
					} else {
						error('Browser does not support File API');
					}
				}
				break;
			case 'url':
				{
					state.importing.loading = true;
					api
						.importGeneratorUrl(url)
						.then((name) => {
							success(`Imported '${name}' successful`);
							store.pub('reload_generators');
						})
						.catch(error)
						.finally(() => {
							state.importing.show = false;
							state.importing.loading = false;
						});
				}
				break;
		}
	};

	let updater = null;

	return {
		oninit() {
			store.pub('reload_generators');
			updater = setInterval(() => {
				store.pub('reload_generators');
			}, 5000);
		},
		onremove() {
			clearInterval(updater);
		},
		view() {
			return (
				<Base active='generators'>
					<Header title='Generators' subtitle='Generators create unique content that you can use to spice up your session.' classes='pt2'>
						<div className='btn btn-success mr2' onclick={() => m.route.set('/generators/new')}>
							Create New
						</div>
						<Tooltip content='Import'>
							<div className='btn btn-primary' onclick={() => (state.importing.show = true)}>
								<i className='ion ion-md-log-in' />
							</div>
						</Tooltip>
						<div className='divider-vert' />
						<Input placeholder='Search...' value={state.search} oninput={binder.inputString(state, 'search')} />
						<div className='divider-vert' />
						<div className='w5'>
							<Select
								value={selectedViewMode}
								keys={Object.keys(viewModes)}
								names={Object.keys(viewModes).map((t) => viewModes[t].name + ' View')}
								oninput={(e) => (selectedViewMode = e.target.value)}
								noDefault={true}
							/>
						</div>
					</Header>
					<div className='ph3 flex flex-wrap'>
						{map(
							groupBy(
								store.data.generators?.filter(
									(t) =>
										state.search.length === 0 ||
										t.name.toLowerCase().indexOf(state.search.toLowerCase()) >= 0 ||
										t.author.toLowerCase().indexOf(state.search.toLowerCase()) >= 0
								),
								'author'
							),
							(val, key) => (
								<div className='w-100 mb3'>
									<div className='mb2 f5'>
										Generators by <b>{key}</b>
									</div>
									<div className='flex flex-wrap'>
										{val.map((g, i) => {
											let id = generatorId(g);

											sanitizeConfig(g);

											if (state.rendered[id] === undefined) {
												rerender(g).then(m.redraw);
											}

											if (state.entries[id] === undefined) {
												api.getEntriesWithSources(generatorId(g)).then((entries) => {
													state.entries[id] = entries ?? [];
												});
											}

											return viewModes[selectedViewMode].view(state, id, g, i);
										})}
									</div>
								</div>
							)
						)}
					</div>
					<ModalImport
						type='generator'
						show={state.importing.show}
						loading={state.importing.loading}
						onimport={onimport}
						onclose={() => {
							state.importing.show = false;
							state.importing.loading = false;
						}}
						types={['base']}
					/>
				</Base>
			);
		},
	};
};
