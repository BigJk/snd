import store from '/js/core/store';
import api from '/js/core/api';

import { keepOpen, on } from '/js/core/ws';

import { openFolderDialog } from '/js/electron';

import { Base, Header, SplitView, Loading, TextArea, Modal } from '/js/ui/components';

import { transform, debounce, chunk, flatten } from 'lodash-es';

import { success, error } from '/js/ui/toast';
import { tryRender } from '/js/core/templating';

export default () => {
	let state = {
		template: null,
		entries: [],
		filtered: [],
		selected: {
			id: null,
			data: null,
		},
		syncActive: false,
		search: '',
		page: 0,
		showExport: false,
		showSync: false,
		printing: false,
	};

	let loadEntries = () => {
		api.getEntriesWithSources(state.template.id).then((entries) => {
			state.entries = entries ?? [];
			state.entries.forEach((e) => {
				if (state.selected.id === e.id) {
					state.selected.data = e.data;
				}
			});
			state.filtered = chunk(state.entries, 25);
			if (state.search.length > 0) {
				runSearch();
			}
		});
	};

	let runSearch = debounce(() => {
		state.selected.id = null;
		state.selected.data = null;
		state.page = 0;

		if (state.search.length === 0) {
			state.filtered = chunk(state.entries, 25);
		} else {
			state.filtered = chunk(
				state.entries.filter((e) => {
					return e.name.toLowerCase().indexOf(state.search.toLowerCase()) >= 0;
				}),
				50
			);
		}

		m.redraw();
	}, 250);

	let breadcrumbs = () => {
		return [
			{
				name: 'Templates',
				link: '/templates',
			},
			{
				name: state.template?.name ?? '...',
			},
		];
	};

	let modalExport = () => {
		if (!state.showExport) return null;

		return (
			<Modal title="Export" onclose={() => (state.showExport = null)}>
				<div className="mb3">
					You can export this template in multiple formats. This will only export the template itself and entries in the template and not in any
					associated data sources!
				</div>
				<div
					className="btn btn-primary mr2"
					onclick={() => {
						openFolderDialog().then((folder) => {
							api
								.exportTemplateZip(state.template.id, folder)
								.then((file) => {
									success('Wrote ' + file);
								})
								.catch((err) => {
									error(err);
								});
						});
					}}
				>
					Export as{' '}
					<b>
						{state.template.author}_{state.template.slug}.zip
					</b>
				</div>
				<div
					className="btn btn-primary"
					onclick={() => {
						openFolderDialog().then((folder) => {
							api
								.exportTemplateFolder(state.template.id, folder)
								.then((file) => {
									success('Wrote ' + file);
								})
								.catch((err) => {
									error(err);
								});
						});
					}}
				>
					Export to{' '}
					<b>
						{state.template.author}_{state.template.slug}
					</b>{' '}
					folder
				</div>
			</Modal>
		);
	};

	let modalSync = () => {
		if (!state.showSync) return null;

		return (
			<Modal title="Live Sync" onclose={() => (state.showSync = false)}>
				<div className="mb3">You can synchronise a template to a folder so that you are able to edit it in an external editor.</div>
				{state.syncActive ? (
					<div
						className="btn btn-error"
						onclick={() => {
							api
								.syncStop(state.template.id)
								.then(() => {
									success(`Synced stopped`);
									state.syncActive = false;
									state.showSync = false;
								})
								.catch(error);
						}}
					>
						Stop Sync
					</div>
				) : (
					<div
						className="btn btn-primary"
						onclick={() => {
							openFolderDialog().then((folder) => {
								api
									.syncStart(state.template.id, folder)
									.then((folder) => {
										success(`Synced to '${folder}'`);
										state.syncActive = true;
										state.showSync = false;
									})
									.catch(error);
							});
						}}
					>
						Start Sync
					</div>
				)}
			</Modal>
		);
	};

	let printingLoading = () => {
		if (!state.printing) {
			return;
		}

		return (
			<div className="modal active relative">
				<div className="modal-overlay" />
				<div className="absolute flex flex-column">
					<div className="loading loading-lg mb2" />
					<div className="black-70">Printing...</div>
				</div>
			</div>
		);
	};

	let body = (vnode) => {
		if (!state.template || !store.data.settings) {
			return <Loading />;
		}

		return (
			<SplitView
				width={340}
				scale={340.0 / store.data.settings.printerWidth}
				stylesheets={store.data.settings.stylesheets}
				content={tryRender(state.template.printTemplate, state.selected.data ?? state.template.skeletonData, state.template.images)}
			>
				<div className="flex-grow-1 overflow-auto" id="entry-page">
					{state.filtered.length === 0
						? null
						: state.filtered[state.page].map((e) => {
								return (
									<div
										className={`w-100 bb b--black-10 mh55 pa2 flex justify-between items-center ${
											e.id !== state.selected.id ? 'hover-bg-secondary pointer' : 'bg-secondary'
										}`}
										onclick={() => {
											state.selected.data = e.data;
											state.selected.id = e.id;
										}}
									>
										<div>
											<div className="fw6 f5">{e.name}</div>
											<div className="black-50">{m.trust(tryRender(state.template.listTemplate, e.data, null))}</div>
										</div>
										<div>
											{e.id === state.selected.id ? (
												<div className="flex">
													<div
														className="btn btn-success btn-sm mr2"
														onclick={() => {
															state.printing = true;
															api
																.print(tryRender(state.template.printTemplate, e.data, state.template.images))
																.then(() => success('Printing send'), error)
																.then(() => (state.printing = false));
														}}
													>
														<i className="ion ion-md-print" />
													</div>
													<div
														className="btn btn-primary btn-sm mr2"
														onclick={() => {
															openFolderDialog().then((folder) => {
																api
																	.screenshot(
																		tryRender(state.template.printTemplate, e.data, state.template.images),
																		folder + '/' + e.data.name + '.png'
																	)
																	.then(() => success('Screenshot created'), error);
															});
														}}
													>
														<i className="ion ion-md-camera" />
													</div>
													{e.source === state.template.id ? (
														<div>
															<div
																className="btn btn-primary btn-sm mr2"
																onclick={() => m.route.set(`/templates/${state.template.id}/edit/${state.selected.id}`)}
															>
																<i className="ion ion-md-create" />
															</div>
															<div
																className="btn btn-error btn-sm"
																onclick={() =>
																	api
																		.deleteEntry(state.template.id, e.id)
																		.then(() => {
																			success('Entry deleted');
																			state.selected.id = null;
																			state.selected.data = null;
																		}, error)
																		.then(loadEntries)
																}
															>
																<i className="ion ion-md-close-circle-outline" />
															</div>
														</div>
													) : (
														''
													)}
												</div>
											) : null}
										</div>
									</div>
								);
						  })}
				</div>
				<div className="ph3 pv2 flex-shrink-0 bt b--black-10 bg-light-gray flex justify-between items-center">
					<i
						className="ion ion-md-arrow-dropleft f3 pointer dim"
						onclick={() => {
							if (state.page > 0) {
								state.page--;
								document.getElementById('entry-page').scrollTop = 0;
							}
							loadEntries();
						}}
					/>
					<div className="w4 tc">
						Page {state.page + 1} / {state.filtered.length}
					</div>
					<div className="w-50">
						<input
							className="form-input"
							placeholder="Search..."
							type="text"
							value={state.search}
							oninput={(e) => {
								state.search = e.target.value;
								runSearch();
							}}
						/>
					</div>
					<i
						className="ion ion-md-arrow-dropright f3 pointer dim"
						onclick={() => {
							if (state.page < state.filtered.length - 1) {
								state.page++;
								document.getElementById('entry-page').scrollTop = 0;
							}
							loadEntries();
						}}
					/>
				</div>
			</SplitView>
		);
	};

	let wsOnRemove = null;
	let keepOpenRemove = null;

	return {
		oninit(vnode) {
			let templateId = vnode.attrs.id;

			if (store.data.lastTemplateState?.template.id === templateId) {
				state = store.data.lastTemplateState;
			}

			api
				.getTemplate(templateId)
				.then((template) => {
					state.template = template;
					state.template.id = vnode.attrs.id;
				})
				.then(loadEntries);

			// check if sync is active
			api.syncActive(templateId).then((active) => (state.syncActive = active));

			// websocket events
			wsOnRemove = on('TemplateUpdated/' + templateId, () => {
				console.log('update got');

				api.getTemplate(templateId).then((template) => {
					state.template = template;
					state.template.id = vnode.attrs.id;
				});
			});
			keepOpenRemove = keepOpen(templateId);
		},
		onremove() {
			if (state.syncActive) {
				api.syncStop(state.template.id);
			}

			keepOpenRemove();
			wsOnRemove();
			store.set('lastTemplateState', state);
		},
		view(vnode) {
			return (
				<Base active="templates">
					<div className="h-100 flex flex-column">
						<Header breadcrumbs={breadcrumbs()} subtitle="Create, Edit and Print Entries" pt={2}>
							<div className="btn btn-success mr2" onclick={() => m.route.set(`/templates/${state.template.id}/new`)}>
								New Entry
							</div>
							<div className="btn btn-primary mr2" onclick={() => m.route.set(`/templates/${state.template.id}/edit`)}>
								Edit
							</div>
							<div className="btn btn-primary mr2" onclick={() => (state.showExport = true)}>
								<i className="ion ion-md-open" />
							</div>
							<div className={`btn ${state.syncActive ? 'btn-success' : 'btn-primary'}`} onclick={() => (state.showSync = true)}>
								<i className={`ion ion-md-sync ${state.syncActive ? 'rotating' : ''}`} />
							</div>
							<div className="divider-vert" />
							<div
								className="btn btn-error"
								onclick={() =>
									api.deleteTemplate(state.template.id).then(() => {
										success('Template deleted');
										store.pub('reload_templates');
										m.route.set('/templates');
									}, error)
								}
							>
								<i className="ion ion-md-close-circle-outline" />
							</div>
						</Header>
						{body(vnode)}
						{modalExport()}
						{modalSync()}
						{printingLoading()}
					</div>
				</Base>
			);
		},
	};
};
