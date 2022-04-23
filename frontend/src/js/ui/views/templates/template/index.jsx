import store from '/js/core/store';
import binder from '/js/ui/binder';
import api from '/js/core/api';

import { keepOpen, on } from '/js/core/ws';

import { openFolderDialog, inElectron } from '/js/electron';

import { Base, Header, SplitView, Loading, Modal, AdvancedSearch, Input, Tooltip } from '/js/ui/components';

import { debounce, chunk } from 'lodash-es';

import { success, error } from '/js/ui/toast';
import { tryRender } from '/js/core/templating';

export default () => {
	let state = {
		template: null,
		entries: [],
		filtered: [],
		found: 0,
		selected: {
			id: null,
			data: null,
		},
		syncActive: false,
		advancedSearch: false,
		search: '',
		searchFn: null,
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
			state.found = state.entries.length;
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

		if (state.search.length === 0 && state.searchFn === null && state.advancedSearch) {
			state.filtered = chunk(state.entries, 25);
		} else {
			let found = state.entries.filter((e) => {
				if (state.searchFn && state.advancedSearch) {
					return state.searchFn(e.name, e.data);
				}

				return e.name.toLowerCase().indexOf(state.search.toLowerCase()) >= 0;
			});
			state.filtered = chunk(found, 25);
			state.found = found.length;
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
						if (inElectron) {
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
						} else {
							window.open('/api/export/template/zip/' + state.template.id, "_blank")
						}
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
				extraChildren={
					state.advancedSearch
						? [
								<div className="h-100 bg-light-gray br1 ba b--black-10 ph3 pt2 pb3 overflow-auto" style={{ width: '370px' }}>
									<AdvancedSearch
										target={state.template.skeletonData}
										onchange={(fn) => {
											state.searchFn = fn;
											runSearch();
										}}
										onclose={() => {
											state.search = '';
											state.advancedSearch = false;
											runSearch();
										}}
									/>
								</div>,
						  ]
						: []
				}
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
																		folder + '/' + e.name + '.png'
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
						}}
					/>
					<div className="w5 tc">
						Page {state.page + 1} / {state.filtered.length} <span className="ml2 o-50">({state.found} Found)</span>
					</div>
					{!state.advancedSearch ? (
						<div className="w-40 flex items-center justify-center">
							<div className="flex-grow-1">
								<Input placeholder="Search..." value={state.search} oninput={binder.inputString(state, 'search', runSearch)} />
							</div>
							<i className="ion ion-md-cog ml2 f6 dim pointer" onclick={() => (state.advancedSearch = true)} />
						</div>
					) : null}
					<i
						className="ion ion-md-arrow-dropright f3 pointer dim"
						onclick={() => {
							if (state.page < state.filtered.length - 1) {
								state.page++;
								document.getElementById('entry-page').scrollTop = 0;
							}
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
							{!state.syncActive ? (
								<div className="btn btn-primary mr2" onclick={() => m.route.set(`/templates/${state.template.id}/edit`)}>
									Edit
								</div>
							) : null}
							<Tooltip content="Import & Export">
								<div className="btn btn-primary mr2" onclick={() => (state.showExport = true)}>
									<i className="ion ion-md-open" />
								</div>
							</Tooltip>
							<Tooltip content="Template sync">
								<div className={`btn ${state.syncActive ? 'btn-success' : 'btn-primary'}`} onclick={() => (state.showSync = true)}>
									<i className={`ion ion-md-sync ${state.syncActive ? 'rotating' : ''}`} />
								</div>
							</Tooltip>
							<div className="divider-vert" />
							<Tooltip content="Delete the template">
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
							</Tooltip>
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
