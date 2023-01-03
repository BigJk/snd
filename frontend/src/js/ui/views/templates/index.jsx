import { groupBy, map, once } from 'lodash-es';

import { inElectron, openFileDialog, openFolderDialog, shell } from '/js/electron';
import { readFile } from '/js/file';

import api from '/js/core/api';
import * as fileApi from '/js/core/file-api';
import { templateId } from '/js/core/model-helper';
import store from '/js/core/store';
import { render } from '/js/core/templating';

import { Base, Header, Input, Loading, ModalImport, Preview, PreviewBox, Select, Tooltip } from '/js/ui/components';

import binder from '/js/ui/binder';
import { dialog, error, success } from '/js/ui/toast';

// check and notify for update once at the start of the application. If the local commit is empty it's a self
// build version, so we don't notify the user in this case.
const checkUpdate = once(() => {
	if (
		!store.data.newVersion ||
		store.data.newVersion.localVersion.gitCommitHash === '' ||
		store.data.newVersion.latestVersion.commit.sha === store.data.newVersion.localVersion.gitCommitHash
	) {
		return;
	}

	dialog(
		`There is a new version of Sales & Dungeons available (${store.data.newVersion.latestVersion.name.split(' ')[0]}). Visit download page?`
	).then(() => {
		shell.openExternal('https://github.com/BigJk/snd/releases');
	});
});

const viewModes = {
	default: {
		name: 'Default',
		view(state, t, i) {
			return (
				<PreviewBox
					className={`w-50 ${(i & 1) === 0 ? 'pr2' : ''}`}
					value={t}
					previewContent={state.templates[templateId(t)] ?? 'Rendering...'}
					bottomLeft={
						<div className='lh-solid'>
							<div className='f4 b'>{t.count}</div>
							<span className='fw4 f6 black-50'>Entries</span>
						</div>
					}
					bottomRight={
						<div className='btn' onclick={() => m.route.set(`/templates/${templateId(t)}`)}>
							Open Template
						</div>
					}
					loading={state.templates[templateId(t)] === undefined}
				/>
			);
		},
	},
	compact: {
		name: 'Compact',
		view(state, t, i) {
			return (
				<div className={`w-33 ${i % 3 === 1 ? 'ph2' : ''}`}>
					<div className='flex justify-between items-center bg-white ba b--black-10 pa2 mb2'>
						<div className='b f6 flex-shrink-0'>{t.name}</div>
						<div className='btn flex-shrink-0' onclick={() => m.route.set(`/templates/${templateId(t)}`)}>
							Open Template
						</div>
					</div>
				</div>
			);
		},
	},
	card: {
		name: 'Card',
		view(state, t) {
			return (
				<div className='bg-white ba b--black-10 mr2 mb2' style={{ width: '195px' }}>
					<div className='bg-white b f6 flex-shrink-0 bb b--black-10 pa2'>{t.name}</div>
					<div className='h-100 relative' style={{ height: '200px' }}>
						<div className='pa2 bg-gray'>
							<Preview
								className='h-100'
								content={state.templates[templateId(t)] ?? 'Rendering...'}
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
								<div className='lh-copy text-muted text-overflow-hide flex-grow-1'>{t.description}</div>
								<div className='btn flex-shrink-0' onclick={() => m.route.set(`/templates/${templateId(t)}`)}>
									Open Template
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
		templates: {},
		importing: {
			show: false,
			loading: false,
			url: '',
		},
	};

	checkUpdate();

	let onimport = (type, url) => {
		switch (type) {
			case 'zip':
				{
					if (inElectron) {
						openFileDialog().then((file) => {
							state.importing.loading = true;
							api
								.importTemplateZip(file)
								.then((name) => {
									success(`Imported '${name}' successful`);

									store.pub('reload_templates');
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
								.importTemplateZip(res)
								.then((name) => {
									success(`Imported '${name}' successful`);

									store.pub('reload_templates');
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
				if (inElectron) {
					openFolderDialog()
						.then((folder) => {
							state.importing.loading = true;
							return api.importTemplateFolder(folder);
						})
						.then((name) => {
							success(`Imported '${name}' successful`);
							store.pub('reload_templates');
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
								.then((folderJsonString) => api.importTemplateJSON(folderJsonString))
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
				break;
			case 'url':
				{
					state.importing.loading = true;
					api
						.importTemplateUrl(url)
						.then((name) => {
							success(`Imported '${name}' successful`);

							store.pub('reload_templates');
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

	let body = () => {
		if (!store.there('templates')) {
			return <Loading />;
		}

		return (
			<div className='ph3 pb3'>
				{map(
					groupBy(
						store.data.templates?.filter(
							(t) =>
								state.search.length === 0 ||
								t.name.toLowerCase().indexOf(state.search.toLowerCase()) >= 0 ||
								t.name.toLowerCase().indexOf(state.search.toLowerCase()) >= 0
						),
						'author'
					),
					(val, key) => (
						<div className='w-100 mb3'>
							<div className='mb2 f5'>
								Templates by <b>{key}</b>
							</div>
							<div className='flex flex-wrap'>{val.map((t, i) => viewModes[selectedViewMode].view(state, t, i))}</div>
						</div>
					)
				)}
			</div>
		);
	};

	let updater = null;

	let updateTemplates = () => {
		Promise.all(
			store.data.templates.map(
				(t) =>
					new Promise((resolve) => {
						let id = templateId(t);
						render(t.printTemplate, { it: t.skeletonData, images: t.images })
							.then((res) => {
								resolve({
									id,
									template: res,
								});
							})
							.catch(() => {
								resolve({
									id,
									template: 'Template Error',
								});
							});
					})
			)
		).then((res) => {
			state.templates = {};
			res.forEach((res) => {
				state.templates[res.id] = res.template;
			});
		});
	};

	return {
		oninit() {
			store.pub('reload_templates');
			updater = setInterval(() => {
				store.pub('reload_templates');
			}, 5000);

			updateTemplates();
		},
		onremove() {
			clearInterval(updater);
		},
		onupdate(vnode) {
			updateTemplates();
		},
		view(vnode) {
			return (
				<Base active='templates'>
					<div className='w-100 h-100'>
						<Header title='Templates' subtitle='List all awesome Templates' classes='pt2'>
							<div className='btn btn-success mr2' onclick={() => m.route.set('/templates/new')}>
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
						{body()}
						<ModalImport
							type='template'
							show={state.importing.show}
							loading={state.importing.loading}
							onimport={onimport}
							onclose={() => {
								state.importing.show = false;
								state.importing.loading = false;
							}}
							types={['base']}
						/>
					</div>
				</Base>
			);
		},
	};
};
