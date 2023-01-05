import { chunk, debounce } from 'lodash-es';

import { inElectron, openFolderDialog } from '/js/electron';

import { ModalInfo, ModalSync } from './modals';

import api from '/js/core/api';
import * as fileApi from '/js/core/file-api';
import store from '/js/core/store';
import { render } from '/js/core/templating';
import { keepOpen, on } from '/js/core/ws';

import { AdvancedSearch, Base, Header, Input, Loading, LoadingFullscreen, ModalExport, SplitView, Tooltip } from '/js/ui/components';

import binder from '/js/ui/binder';
import { dialogWarning, error, success } from '/js/ui/toast';

export default () => {
	let state = {
		template: null,
		entries: [],
		entriesTemplate: {},
		filtered: [],
		renderedTemplate: {
			id: null,
			template: '',
		},
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
		showInfo: false,
		printing: false,
	};

	let renderTemplate = () => {
		state.renderedTemplate.id = state.selected.id;

		render(state.template.printTemplate, {
			it: state.selected.data ?? state.template.skeletonData,
			images: state.template.images,
		}).then((res) => {
			if (state.renderedTemplate.id === state.selected.id) {
				state.renderedTemplate.template = res;
				m.redraw();
			}
		});
	};

	let getSelectedTemplate = () => {
		if (state.renderedTemplate.id !== state.selected.id || state.renderedTemplate.template.length === 0) {
			renderTemplate();
		}

		return state.renderedTemplate.template;
	};

	let getListTemplate = (entry) => {
		if (state.template.listTemplate.trim().length === 0) {
			return '';
		}

		if (state.entriesTemplate[entry.id]) {
			return state.entriesTemplate[entry.id];
		}

		render(state.template.listTemplate, { it: entry.data }).then((res) => {
			state.entriesTemplate[entry.id] = res;
			m.redraw();
		});

		return 'Loading...';
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

	let breadcrumbs = () => [
		{
			name: 'Templates',
			link: '/templates',
		},
		{
			name: state.template?.name ?? '...',
		},
	];

	let onexport = (type) => {
		switch (type) {
			case 'zip':
				{
					if (inElectron) {
						openFolderDialog().then((folder) => {
							api
								.exportTemplateZip(state.template.id, folder)
								.then(() => success('Wrote ' + folder))
								.catch(error)
								.finally(() => (state.showExport = false));
						});
					} else {
						window.open('/api/export/template/zip/' + state.template.id, '_blank');
					}
				}
				break;
			case 'folder':
				if (inElectron) {
					openFolderDialog()
						.then((folder) => api.exportTemplateFolder(state.template.id, folder))
						.then((file) => success('Wrote ' + file))
						.catch(error)
						.finally(() => (state.showExport = false));
				} else if (fileApi.hasFileApi) {
					Promise.all([fileApi.openFolderDialog(true), api.exportTemplateJSON(state.template.id)])
						.then(([folder, json]) => fileApi.writeJSONToFolder(folder, json))
						.then(() => success('Saved'))
						.catch(error)
						.finally(() => (state.showExport = false));
				} else {
					error('Browser does not support File API');
				}
				break;
		}
	};

	let stopSync = () => {
		api
			.syncStop(state.template.id)
			.then(() => {
				success(`Synced stopped`);
				state.syncActive = false;
				state.showSync = false;
			})
			.catch(error);
	};

	let startSync = () => {
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
				content={getSelectedTemplate()}
				extraChildren={
					state.advancedSearch
						? [
								<div className='h-100 bg-light-gray br1 ba b--black-10 ph3 pt2 pb3 overflow-auto' style={{ width: '370px' }}>
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
				<div className='flex-grow-1 overflow-auto' id='entry-page'>
					{state.filtered.length === 0
						? null
						: state.filtered[state.page].map((e) => (
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
										<div className='fw6 f5'>{e.name}</div>
										<div className='black-50'>{m.trust(getListTemplate(e))}</div>
									</div>
									<div>
										{e.id === state.selected.id ? (
											<div className='flex'>
												<div
													className='btn btn-success btn-sm mr2'
													onclick={() => {
														state.printing = true;

														render(state.template.printTemplate, { it: e.data, images: state.template.images })
															.then((res) => {
																api
																	.print(res)
																	.then(() => success('Printing send'), error)
																	.then(() => (state.printing = false));
															})
															.catch((err) => {
																error(err);
																state.printing = false;
															});
													}}
												>
													<i className='ion ion-md-print' />
												</div>
												<div
													className='btn btn-primary btn-sm mr2'
													onclick={() => {
														openFolderDialog().then((folder) => {
															render(state.template.printTemplate, {
																it: e.data,
																images: state.template.images,
															}).then((res) => {
																api.screenshot(res, folder + '/' + e.name + '.png').then(() => success('Screenshot created'), error);
															});
														});
													}}
												>
													<i className='ion ion-md-camera' />
												</div>
												{e.source === state.template.id ? (
													<div>
														<div
															className='btn btn-primary btn-sm mr2'
															onclick={() => m.route.set(`/templates/${state.template.id}/edit/${state.selected.id}`)}
														>
															<i className='ion ion-md-create' />
														</div>
														<div
															className='btn btn-error btn-sm'
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
															<i className='ion ion-md-close-circle-outline' />
														</div>
													</div>
												) : (
													''
												)}
											</div>
										) : null}
									</div>
								</div>
						  ))}
				</div>
				<div className='ph3 pv2 flex-shrink-0 bt b--black-10 bg-light-gray flex justify-between items-center'>
					<i
						className='ion ion-md-arrow-dropleft f3 pointer dim'
						onclick={() => {
							if (state.page > 0) {
								state.page--;
								document.getElementById('entry-page').scrollTop = 0;
							}
						}}
					/>
					<div className='w5 tc'>
						Page {state.page + 1} / {state.filtered.length} <span className='ml2 o-50'>({state.found} Found)</span>
					</div>
					{!state.advancedSearch ? (
						<div className='w-40 flex items-center justify-center'>
							<div className='flex-grow-1'>
								<Input placeholder='Search...' value={state.search} oninput={binder.inputString(state, 'search', runSearch)} />
							</div>
							<i className='ion ion-md-cog ml2 f6 dim pointer' onclick={() => (state.advancedSearch = true)} />
						</div>
					) : null}
					<i
						className='ion ion-md-arrow-dropright f3 pointer dim'
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

					// Render template
					renderTemplate();
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
				<Base active='templates'>
					<div className='h-100 flex flex-column'>
						<Header breadcrumbs={breadcrumbs()} subtitle='Create, Edit and Print Entries' pt={2}>
							<div className='btn btn-success mr2' onclick={() => m.route.set(`/templates/${state.template.id}/new`)}>
								New Entry
							</div>
							{!state.syncActive ? (
								<div className='btn btn-primary mr2' onclick={() => m.route.set(`/templates/${state.template.id}/edit`)}>
									Edit
								</div>
							) : null}
							<Tooltip content='Duplicate'>
								<div className='btn btn-primary mr2' onclick={() => m.route.set(`/templates/dupe/${state.template.id}`)}>
									<i className='ion ion-md-copy' />
								</div>
							</Tooltip>
							<Tooltip content='Export'>
								<div className='btn btn-primary mr2' onclick={() => (state.showExport = true)}>
									<i className='ion ion-md-open' />
								</div>
							</Tooltip>
							<Tooltip content='Template sync'>
								<div className={`btn ${state.syncActive ? 'btn-success' : 'btn-primary'} mr2`} onclick={() => (state.showSync = true)}>
									<i className={`ion ion-md-sync ${state.syncActive ? 'rotating' : ''}`} />
								</div>
							</Tooltip>
							<Tooltip content='Additional Information'>
								<div className='btn btn-primary' onclick={() => (state.showInfo = true)}>
									<i className='ion ion-md-information' />
								</div>
							</Tooltip>
							<div className='divider-vert' />
							<Tooltip content='Delete the template'>
								<div
									className='btn btn-error'
									onclick={() =>
										dialogWarning(`Do you really want to delete the '${state.template.name}' template?`).then(() =>
											api.deleteTemplate(state.template.id).then(() => {
												success('Template deleted');
												store.pub('reload_templates');
												m.route.set('/templates');
											}, error)
										)
									}
								>
									<i className='ion ion-md-close-circle-outline' />
								</div>
							</Tooltip>
						</Header>
						{body(vnode)}
						<LoadingFullscreen show={state.printing} />
						<ModalExport
							type='template'
							show={state.showExport}
							value={state.template}
							onexport={onexport}
							onclose={() => (state.showExport = false)}
						/>
						<ModalInfo show={state.showInfo} id={vnode.attrs.id} onclose={() => (state.showInfo = false)} />
						<ModalSync
							show={state.showSync}
							active={state.syncActive}
							onstart={startSync}
							onstop={stopSync}
							onclose={() => (state.showSync = false)}
						/>
					</div>
				</Base>
			);
		},
	};
};
