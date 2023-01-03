import { groupBy, map } from 'lodash-es';

import { inElectron, openFileDialog, openFolderDialog } from '/js/electron';
import { readFile } from '/js/file';

import { ModalCreate } from './modals';

import api from '/js/core/api';
import store from '/js/core/store';

import { Base, Header, Input, ModalExport, ModalImport, Tooltip } from '/js/ui/components';

import binder from '/js/ui/binder';
import { dialogWarning, error, success } from '/js/ui/toast';

export default () => {
	let state = {
		search: '',
		showCreate: false,
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
						.importSourceUrl(importData)
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
								.then(() => {
									success(`Imported vtt module successful`);
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

	let createDataSource = (data) => {
		if (data.name.length === 0) {
			error('Please insert a name');
			return;
		}

		if (data.author.length === 0) {
			error('Please insert a author');
			return;
		}

		if (data.slug.length === 0) {
			error('Please insert a slug');
			return;
		}

		if (store.data.sources.find((ds) => `ds:${ds.author}+${ds.slug}` === `ds:${data.author}+${data.slug}`)) {
			error('This Data Source already exists');
			return;
		}

		api.saveSource(data).then(() => {
			success('Data Source saved');
			store.pub('reload_sources');
			m.route.set(`/data-sources/ds:${data.author}+${data.slug}`);
		}, error);
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
							<table className='table'>
								<thead>
									<tr>
										<th className='w-40'>Name</th>
										<th className='w-30'>Description</th>
										<th className='w-10'>Entries</th>
										<th className='w-20' />
									</tr>
								</thead>
								<tbody>
									{val.map((t, i) => (
										<tr>
											<td className='b'>{t.name}</td>
											<td className='f8'>{t.description}</td>
											<td>{t.count}</td>
											<td>
												<div className='flex items-center justify-end'>
													<div className='btn btn-sm mr2' onclick={() => m.route.set(`/data-sources/ds:${t.author}+${t.slug}`)}>
														Edit Source
													</div>
													<Tooltip content='Export Options'>
														<div
															className='btn btn-sm btn-primary w2 mr2'
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
														className='btn btn-sm btn-error'
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
