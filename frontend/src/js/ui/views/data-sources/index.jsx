import { groupBy, map } from 'lodash-es';

import { inElectron, openFileDialog, openFolderDialog } from '/js/electron';
import { readFile } from '/js/file';

import { ModalCreate, ModalDuplicate } from './modals';

import api from '/js/core/api';
import * as fileApi from '/js/core/file-api';
import { validBaseInformation } from '/js/core/model-helper';
import { dataSourceId } from '/js/core/model-helper';
import store from '/js/core/store';
import { dataSourceById } from '/js/core/store-helper';

import { Base, Header, Input, ModalExport, ModalImport, Tooltip } from '/js/ui/components';

import binder from '/js/ui/binder';
import { dialogWarning, error, success } from '/js/ui/toast';

export default () => {
	let state = {
		search: '',
		showCreate: false,
		duplicate: {
			show: false,
			id: '',
			ds: null,
		},
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

	let onimport = (type, importData) => {
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
								.finally(() => {
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
							return api.importSourceFolder(folder);
						})
						.then((name) => {
							success(`Imported '${name}' successful`);
							store.pub('reload_sources');
						})
						.catch(error)
						.finally(() => {
							state.importing.show = false;
							state.importing.loading = false;
						});
				} else if (fileApi.hasFileApi) {
					fileApi
						.openFolderDialog(false)
						.then((folder) => {
							state.importing.loading = true;
							return fileApi
								.folderToJSON(folder)
								.then((folderJsonString) => api.importSourceJSON(folderJsonString))
								.then(() => {
									success(`Imported '${folder.name}' successful`);
									store.pub('reload_sources');
								});
						})
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
						.importSourceUrl(importData)
						.then((name) => {
							success(`Imported '${name}' successful`);

							store.pub('reload_sources');
						})
						.catch(error)
						.finally(() => {
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
								.then(() => {
									success(`Imported vtt module successful`);
									store.pub('reload_sources');
								})
								.catch(error)
								.finally(() => {
									state.importing.show = false;
									state.importing.loading = false;
								});
						});
					} else {
						// TODO: error
					}
				}
				break;
			case 'csv':
				{
					if (inElectron) {
						openFileDialog().then((file) => {
							state.importing.loading = true;
							api
								.importSourceCSV(file)
								.then((name) => {
									success(`Imported '${name}' csv successful`);
									store.pub('reload_sources');
								})
								.catch(error)
								.finally(() => {
									state.importing.show = false;
									state.importing.loading = false;
								});
						});
					} else {
						// TODO: error
					}
				}
				break;
			case 'fc5e':
				{
					if (importData.name.length === 0 || importData.author.length === 0 || importData.slug.length === 0 || importData.description.length === 0) {
						error('Please fill in all information.');
						return;
					}

					if (inElectron) {
						openFileDialog().then((file) => {
							state.importing.loading = true;
							api
								.importFC5eCompedium(file, importData.name, importData.author, importData.slug, importData.description)
								.then(() => {
									success(`Imported compedium successful`);
									store.pub('reload_sources');
								})
								.catch(error)
								.finally(() => {
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
								.finally(() => (state.exporting.show = false));
						});
					} else {
						// TODO: headless export
						state.exporting.show = false;
					}
				}
				break;
			case 'folder':
				if (inElectron) {
					openFolderDialog()
						.then((folder) => api.exportSourceFolder(state.exporting.id, folder))
						.then((file) => success('Wrote ' + file))
						.catch(error)
						.finally(() => (state.exporting.show = false));
				} else if (fileApi.hasFileApi) {
					Promise.all([fileApi.openFolderDialog(true), api.exportSourceJSON(state.exporting.id)])
						.then(([folder, json]) => fileApi.writeJSONToFolder(folder, json))
						.then(() => success('Saved'))
						.catch(error)
						.finally(() => (state.exporting.show = false));
				} else {
					error('Browser does not support File API');
				}
				break;
		}
	};

	let createDataSource = (data, skipNavigate, cb) => {
		let { valid, reason } = validBaseInformation(data);

		if (!valid) {
			error(reason);
			return;
		}

		// check if data source with same id already exists
		if (dataSourceById(dataSourceId(data))) {
			error('This Data Source already exists');
			return;
		}

		return api
			.saveSource(data)
			.then(() => {
				success('Data Source saved');

				if (skipNavigate) {
					return;
				}

				store.pub('reload_sources');
				m.route.set(`/data-sources/${dataSourceId(data)}`);
			})
			.then(cb)
			.catch(error);
	};

	let duplicateDataSource = (data) => {
		createDataSource(data, true, () => {
			api
				.copyEntries(state.duplicate.id, dataSourceId(data))
				.then(() => {
					success('Data Source duplicated');
					store.pub('reload_sources');
					m.route.set(`/data-sources/${dataSourceId(data)}`);
				})
				.catch(error);
		});
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
						<div className='bg-white pa2 ba b--black-10'>
							<table className='table lh-copy'>
								<thead>
									<tr>
										<th className='w-40'>Name</th>
										<th className='w-30'>Description</th>
										<th className='w-10'>Entries</th>
										<th className='w-20' />
									</tr>
								</thead>
								<tbody>
									{val.map((t) => (
										<tr>
											<td>
												<div className='b'>{t.name}</div>
												<div className='f8 text-muted'>{dataSourceId(t)}</div>
											</td>
											<td className='f8'>{t.description}</td>
											<td>{t.count}</td>
											<td>
												<div className='flex items-center justify-end'>
													<div className='btn btn-sm mr2' onclick={() => m.route.set(`/data-sources/${dataSourceId(t)}`)}>
														Edit Source
													</div>
													<Tooltip content='Export Options'>
														<div
															className='btn btn-sm btn-primary w2 mr2'
															onclick={() => {
																state.exporting.ds = t;
																state.exporting.id = dataSourceId(t);
																state.exporting.show = true;
															}}
														>
															<i className='ion ion-md-open' />
														</div>
													</Tooltip>
													<Tooltip content='Duplicate'>
														<div
															className='btn btn-sm btn-primary w2 mr2'
															onclick={() => {
																state.duplicate.show = true;
																state.duplicate.id = dataSourceId(t);
																state.duplicate.ds = t;
															}}
														>
															<i className='ion ion-md-copy' />
														</div>
													</Tooltip>
													<div
														className='btn btn-sm btn-error'
														onclick={() =>
															dialogWarning(`Do you really want to delete the '${t.name}' source ?`).then(() =>
																api.deleteSource(dataSourceId(t)).then(() => {
																	store.pub('reload_sources');
																})
															)
														}
													>
														<i className='ion ion-md-close-circle-outline' />
													</div>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
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
				<Base active='dataSources'>
					<div className='h-100 flex flex-column'>
						<Header title='Data Sources' subtitle='Manage collection of data.'>
							<div className='btn btn-success mr2' onclick={() => (state.showCreate = true)}>
								Create New
							</div>
							<Tooltip content='Import'>
								<div className='btn btn-primary' onclick={() => (state.importing.show = true)}>
									<i className='ion ion-md-log-in' />
								</div>
							</Tooltip>
							<div className='divider-vert' />
							<Input placeholder='Search...' value={state.search} oninput={binder.inputString(state, 'search')} />
						</Header>
						{body()}
						<ModalDuplicate
							target={state.duplicate.ds}
							show={state.duplicate.show}
							onclose={() => (state.duplicate.show = false)}
							onconfirm={duplicateDataSource}
						/>
						<ModalCreate show={state.showCreate} onclose={() => (state.showCreate = false)} onconfirm={createDataSource} />
						<ModalImport
							type='data source'
							show={state.importing.show}
							onimport={onimport}
							onclose={() => (state.importing.show = false)}
							types={['base', 'csv', 'vtt', 'fc5e']}
						/>
						<ModalExport
							type='data source'
							prefix='ds_'
							show={state.exporting.show}
							value={state.exporting.ds}
							onexport={onexport}
							onclose={() => (state.exporting.show = false)}
						/>
					</div>
				</Base>
			);
		},
	};
};
