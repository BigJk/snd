import store from '/js/core/store';
import api from '/js/core/api';

import * as msgpack from 'msgpack-lite';

import { Base, Header, SplitView, Loading, TextArea, Modal } from '/js/ui/components';

import { transform, debounce } from 'lodash-es';

import { success, error } from '/js/ui/toast';
import { tryRender } from '/js/core/templating';

export default () => {
	let state = {
		id: null,
		template: null,
		entries: [],
		selected: {
			id: null,
			data: null,
		},
		search: '',
		page: 0,
		maxPage: 0,
		showExport: false,
		exportText: '',
	};

	let loadEntries = () => {
		api.getEntries(state.template.id, state.page, state.search).then((entries) => {
			state.entries = entries ?? [];
			state.entries.forEach((e) => {
				if (state.selected.id === e.id) {
					state.selected.data = e.data;
				}
			});
		});
	};

	let loadPages = () => {
		api.getEntriesPages(state.template.id, state.search).then((maxPage) => {
			state.maxPage = maxPage;
		});
	};

	let runSearch = debounce(() => {
		state.selected.id = null;
		state.selected.data = null;
		state.page = 0;
		loadPages();
		loadEntries();
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

	let modal = () => {
		if (!state.showExport) return null;

		return (
			<Modal title="Export" onclose={() => (state.showExport = null)}>
				<div className="mb2">The following code represents this Template:</div>
				<TextArea value={state.exportText} rows={15} />
			</Modal>
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
				content={tryRender(state.template.printTemplate, JSON.parse(state.selected.data ?? state.template.skeletonData))}
			>
				<div className="flex-grow-1 overflow-auto">
					{state.entries.map((e) => {
						return (
							<div
								className={`w-100 bb b--black-10 pa2 flex justify-between items-center ${
									e.id !== state.selected.id ? 'hover-bg-secondary pointer' : 'bg-secondary'
								}`}
								onclick={() => {
									state.selected.data = e.data;
									state.selected.id = e.id;
								}}
							>
								<div>
									<div className="fw6 f5">{e.name}</div>
									<div className="black-50">{m.trust(tryRender(state.template.listTemplate, JSON.parse(e.data)))}</div>
								</div>
								<div>
									{e.id === state.selected.id ? (
										<div>
											<div
												className="btn btn-success btn-sm mr2"
												onclick={() =>
													api.print(tryRender(state.template.printTemplate, JSON.parse(e.data))).then(() => success('Printing send'), error)
												}
											>
												<i className="ion ion-md-print" />
											</div>
											<div className="btn btn-primary btn-sm mr2" onclick={() => m.route.set(`/templates/${state.template.id}/edit/${e.id}`)}>
												<i className="ion ion-md-create" />
											</div>
											<div className="btn btn-error btn-sm">
												<i
													className="ion ion-md-close-circle-outline"
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
												/>
											</div>
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
							}
							loadEntries();
						}}
					/>
					<div className="w4 tc">
						Page {state.page + 1} / {state.maxPage}
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
							if (state.page < state.maxPage - 1) {
								state.page++;
							}
							loadEntries();
						}}
					/>
				</div>
			</SplitView>
		);
	};

	return {
		oninit(vnode) {
			let templateId = parseInt(vnode.attrs.id);

			if (store.data.lastTemplateState?.template.id === templateId) {
				state = store.data.lastTemplateState;
			}

			api
				.getTemplate(templateId)
				.then((template) => (state.template = template))
				.then(() => {
					loadPages();
					loadEntries();
				});
		},
		onremove() {
			store.set('lastTemplateState', state);
		},
		view(vnode) {
			return (
				<Base active="templates">
					<div className="h-100 flex flex-column">
						<Header breadcrumbs={breadcrumbs()} subtitle="Create, Edit and Print Entries">
							<div className="btn btn-success mr2" onclick={() => m.route.set(`/templates/${state.template.id}/new`)}>
								New Entry
							</div>
							<div className="btn btn-primary mr2" onclick={() => m.route.set(`/templates/${state.template.id}/edit`)}>
								Edit
							</div>
							<btn
								className="btn btn-primary"
								onclick={() => {
									state.exportText = msgpack
										.encode(
											JSON.stringify(
												transform(state.template, (res, val, key) => {
													if (['name', 'description', 'printTemplate', 'listTemplate', 'skeletonData'].some((s) => s === key)) {
														res[key] = val;
													}
												})
											)
										)
										.toString('base64');
									state.showExport = true;
								}}
							>
								<i className="ion ion-md-open" />
							</btn>
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
						{modal()}
					</div>
				</Base>
			);
		},
	};
};
