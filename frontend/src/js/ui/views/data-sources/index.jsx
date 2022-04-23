import api from '/js/core/api';
import store from '/js/core/store';
import binder from '/js/ui/binder';

import { Base, Header, Input, Modal, Tooltip } from '/js/ui/components';

import { openFolderDialog, openFileDialog, inElectron } from '/js/electron';
import { readFile } from '/js/file'
import { groupBy, map } from 'lodash-es';
import { success } from '/js/ui/toast';

export default () => {
	let state = {
		search: '',
		importing: {
			show: false,
			url: '',
			loading: false,
		},
	};

	let modal = () => {
		if (!state.importing.show) return null;

		if (state.importing.loading)
			return (
				<Modal title="Import" noclose={true}>
					<div className="flex flex-column justify-center items-center">
						<div className="loading loading-lg mb2" />
						Fetching data...
					</div>
				</Modal>
			);

		return (
			<Modal
				title="Import"
				onclose={() => {
					state.importing.show = false;
					state.importing.url = '';
					state.importing.loading = false;
				}}
			>
				<div className="mb3 lh-copy">
					<div className="mb2">
						<b>Import data sources either locally (e.g. .zip, folder) or from the internet via a URL</b>
					</div>
					<div>
						<b>Warning:</b> A data source with the same author and identification name will overwrite any previous imported version!
					</div>
				</div>
				<div className="mb3">
					<div
						className="btn btn-primary mr2"
						onclick={() => {
							if (inElectron) {
								openFileDialog().then((file) => {
									state.importing.loading = true;
									api.importSourceZip(file).then((name) => {
										success(`Imported '${name}' successful`);

										store.pub('reload_sources');

										state.importing.show = false;
										state.importing.loading = false;
									});
								});
							} else {
								readFile().then(res => {
									state.importing.loading = true;
									api.importSourceZip(res).then((name) => {
										success(`Imported '${name}' successful`);

										store.pub('reload_sources');

										state.importing.show = false;
										state.importing.loading = false;
									});
								})
							}
						}}
					>
						Import .zip
					</div>
					<div
						className="btn btn-primary"
						onclick={() => {
							openFolderDialog().then((folder) => {
								state.importing.loading = true;
								api.importSourceFolder(folder).then((name) => {
									success(`Imported '${name}' successful`);

									store.pub('reload_sources');

									state.importing.show = false;
									state.importing.loading = false;
								});
							});
						}}
					>
						Import Folder
					</div>
				</div>
				<div className="divider" />
				<div>
					<Input label="Import URL" placeholder="http://example.com/cool_data.zip" oninput={binder.inputString(state.importing, 'url')} />
					<div
						className="btn btn-primary"
						onclick={() => {
							state.importing.loading = true;
							api.importSourceUrl(state.importing.url).then((name) => {
								success(`Imported '${name}' successful`);

								store.pub('reload_sources');

								state.importing.show = false;
								state.importing.loading = false;
							});
						}}
					>
						Import
					</div>
				</div>
			</Modal>
		);
	};

	let body = () => {
		return (
			<div className="ph3 pb3">
				{map(
					groupBy(
						store.data.sources?.filter((t) => {
							return state.search.length === 0 || t.name.toLowerCase().indexOf(state.search.toLowerCase()) >= 0;
						}),
						'author'
					),
					(val, key) => {
						return (
							<div className="w-100 mb3">
								<div className="mb2 f5">
									Sources by <b>{key}</b>
								</div>
								<div className="flex flex-wrap">
									{val.map((t, i) => {
										return (
											<div className={`w-50 ${(i & 1) === 0 ? 'pr2' : ''}`}>
												<div className="flex ba b--black-10 h4 mb2 bg-white">
													<div className="flex-grow-1 pv2 ph2 lh-solid flex flex-column justify-between">
														<div>
															<div className="f5 mb2 flex justify-between items-center">
																{t.name}

																<span className="f8 fw4 text-muted">
																	{t.author}/{t.slug}
																</span>
															</div>
															<div className="divider" />
															<div className="fw4 f7 black-50 mb1">{t.description}</div>
														</div>
														<div className="flex justify-between items-end">
															<div className="lh-solid">
																<div className="f4 b">{t.count}</div>
																<span className="fw4 f6 black-50">Entries</span>
															</div>
															<div
																className="btn btn-error"
																onclick={() =>
																	api.deleteSource(`ds:${t.author}+${t.slug}`).then(() => {
																		store.pub('reload_sources');
																	})
																}
															>
																<i className="ion ion-md-close-circle-outline" />
															</div>
														</div>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						);
					}
				)}
			</div>
		);
	};

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
					<div className="h-100 flex flex-column">
						<Header title="Data Sources" subtitle="Manage collection of data.">
							<Tooltip content="Import">
								<div className="btn btn-primary" onclick={() => (state.importing.show = true)}>
									<i className="ion ion-md-log-in" />
								</div>
							</Tooltip>
							<div className="divider-vert" />
							<Input placeholder="Search..." value={state.search} oninput={binder.inputString(state, 'search')} />
						</Header>
						{body()}
						{modal()}
					</div>
				</Base>
			);
		},
	};
};
