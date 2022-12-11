import { groupBy, map } from 'lodash-es';

import { inElectron, openFileDialog, openFolderDialog } from '/js/electron';
import { readFile } from '/js/file';

import api from '/js/core/api';
import store from '/js/core/store';

import { Base, Header, Input, ModalExport, ModalImport, PreviewBox, Tooltip } from '/js/ui/components';

import binder from '/js/ui/binder';
import { dialogWarning, error, success } from '/js/ui/toast';

export default () => {
	let state = {
		search: '',
		importing: {
			show: false,
			loading: false,
		},
		exporting: {
			id: '',
			ds: null,
			show: false,
		},
	};

	let onimport = (type, url) => {
		switch (type) {
			case 'zip':
				{
					if (inElectron) {
						openFileDialog().then((file) => {
							state.importing.loading = true;
							api
								.importSourceZip(file)
								.then((name) => {
									success(`Imported '${name}' successful`);
									store.pub('reload_sources');
								})
								.catch(error)
								.then(() => {
									state.importing.show = false;
									state.importing.loading = false;
								});
						});
					} else {
						readFile().then((res) => {
							state.importing.loading = true;
							api
								.importSourceZip(res)
								.then((name) => {
									success(`Imported '${name}' successful`);

									store.pub('reload_sources');
								})
								.catch(error)
								.then(() => {
									state.importing.show = false;
									state.importing.loading = false;
								});
						});
					}
				}
				break;
			case 'folder':
				{
					openFolderDialog().then((folder) => {
						state.importing.loading = true;
						api
							.importSourceFolder(folder)
							.then((name) => {
								success(`Imported '${name}' successful`);

								store.pub('reload_sources');
							})
							.catch(error)
							.then(() => {
								state.importing.show = false;
								state.importing.loading = false;
							});
					});
				}
				break;
			case 'url':
				{
					state.importing.loading = true;
					api
						.importSourceUrl(url)
						.then((name) => {
							success(`Imported '${name}' successful`);

							store.pub('reload_sources');
						})
						.catch(error)
						.then(() => {
							state.importing.show = false;
							state.importing.loading = false;
						});
				}
				break;
			case 'vtt':
				{
					if (inElectron) {
						openFileDialog().then((file) => {
							state.importing.loading = true;
							api
								.importVttModule(file)
								.then((name) => {
									success(`Imported '${name}' module successful`);
									store.pub('reload_sources');
								})
								.catch(error)
								.then(() => {
									state.importing.show = false;
									state.importing.loading = false;
								});
						});
					} else {
						// TODO: error
					}
				}
				break;
		}
	};

	let onexport = (type) => {
		switch (type) {
			case 'zip':
				{
					if (inElectron) {
						openFolderDialog().then((folder) => {
							api
								.exportSourceZip(state.exporting.id, folder)
								.then((file) => success('Wrote ' + file))
								.catch(error)
								.then(() => (state.exporting.show = false));
						});
					} else {
						// TODO: headless export
						state.exporting.show = false;
					}
				}
				break;
			case 'folder':
				{
					openFolderDialog().then((folder) => {
						api
							.exportSourceFolder(state.exporting.id, folder)
							.then((file) => success('Wrote ' + file))
							.catch(error)
							.then(() => (state.exporting.show = false));
					});
				}
				break;
		}
	};

	let body = () => (
		<div className='ph3 pb3'>
			{map(
				groupBy(
					store.data.sources?.filter((t) => state.search.length === 0 || t.name.toLowerCase().indexOf(state.search.toLowerCase()) >= 0),
					'author'
				),
				(val, key) => (
					<div className='w-100 mb3'>
						<div className='mb2 f5'>
							Sources by <b>{key}</b>
						</div>
						<div className='flex flex-wrap'>
							{val.map((t, i) => (
								<PreviewBox
									className={`w-50 ${(i & 1) === 0 ? 'pr2' : ''}`}
									value={t}
									bottomLeft={
										<div className='lh-solid'>
											<div className='f4 b'>{t.count}</div>
											<span className='fw4 f6 black-50'>Entries</span>
										</div>
									}
									bottomRight={
										<div>
											<Tooltip content={'Export Options'}>
												<div
													className='btn btn-primary w2 mr2'
													onclick={() => {
														state.exporting.ds = t;
														state.exporting.id = `ds:${t.author}+${t.slug}`;
														state.exporting.show = true;
													}}
												>
													<i className='ion ion-md-open' />
												</div>
											</Tooltip>
											<div
												className='btn btn-error'
												onclick={() =>
													dialogWarning(`Do you really want to delete the '${t.name}' source ?`).then(() =>
														api.deleteSource(`ds:${t.author}+${t.slug}`).then(() => {
															store.pub('reload_sources');
														})
													)
												}
											>
												<i className='ion ion-md-close-circle-outline' />
											</div>
										</div>
									}
								></PreviewBox>
							))}
						</div>
					</div>
				)
			)}
		</div>
	);

	let updater = null;

	return {
		oninit() {
			store.pub('reload_sources');
			updater = setInterval(() => {
				store.pub('reload_sources');
			}, 5000);
		},
		onremove() {
			clearInterval(updater);
		},
		view(vnode) {
			return (
				<Base active={'dataSources'}>
					<div className='h-100 flex flex-column'>
						<Header title='Data Sources' subtitle='Manage collection of data.'>
							<Tooltip content='Import'>
								<div className='btn btn-primary' onclick={() => (state.importing.show = true)}>
									<i className='ion ion-md-log-in' />
								</div>
							</Tooltip>
							<div className='divider-vert' />
							<Input placeholder='Search...' value={state.search} oninput={binder.inputString(state, 'search')} />
						</Header>
						{body()}
						<ModalImport
							type={'data source'}
							show={state.importing.show}
							onimport={onimport}
							onclose={() => (state.importing.show = false)}
							extra={
								<div className='mt3'>
									<div className='divider' />
									<div>
										<div className='mt2 mb3 lh-copy'>
											<b className='db'>FoundryVTT Import</b>
											You can also import data from FoundryVTT Modules and Systems. This will convert all the included packs and add them as Data
											Sources. To import a Module or System open the module.json or system.json file in it's folder.
										</div>
										<div className='btn btn-primary mr2' onclick={() => onimport('vtt')}>
											Import FoundryVTT (module.json, system.json)
										</div>
									</div>
								</div>
							}
						></ModalImport>
						<ModalExport
							type={'data source'}
							prefix={'ds_'}
							show={state.exporting.show}
							value={state.exporting.ds}
							onexport={onexport}
							onclose={() => (state.exporting.show = false)}
						></ModalExport>
					</div>
				</Base>
			);
		},
	};
};
