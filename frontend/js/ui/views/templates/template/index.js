import m from 'mithril';

import store from '../../../../core/store';
import api from '../../../../core/api';

import * as nunjucks from 'nunjucks';

import Base from '../../../components/base';
import Header from '../../../components/header';
import Loading from '../../../components/loading';
import SplitView from '../../../components/split-view';

import debounce from 'lodash-es/debounce';

import { success, error } from '../../../toast';

let tryRender = (t, v) => {
	try {
		return nunjucks.renderString(t, v);
	} catch (e) {
	}
	return "Template error";
};

export default () => {
	let state = {
		id: null,
		template: null,
		entries: [],
		selected: {
			id: null,
			data: null
		},
		search: '',
		page: 0,
		maxPage: 0
	};

	let loadEntries = () => {
		api.getEntries(state.template.id, state.page, state.search).then(entries => {
			state.entries = entries ?? [];
			state.entries.forEach(e => {
				if (state.selected.id === e.id) {
					state.selected.data = e.data;
				}
			});
		});
	};

	let loadPages = () => {
		api.getEntriesPages(state.template.id, state.search).then(maxPage => {
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
				link: '/templates'
			},
			{
				name: state.template?.name ?? '...'
			}
		];
	};

	let body = vnode => {
		if (!state.template || !store.data.settings) {
			return <Loading />;
		}

		return (
			<SplitView width={340} scale={340.0 / store.data.settings.printerWidth} stylesheets={store.data.settings.stylesheets} content={tryRender(state.template.printTemplate, { it: JSON.parse(state.selected.data ?? state.template.skeletonData) })}>
				<div className="flex-grow-1 overflow-auto">
					{state.entries.map(e => {
						return (
							<div
								className={`w-100 bb b--black-10 pa2 flex justify-between items-center ${e.id !== state.selected.id ? 'hover-bg-secondary pointer' : 'bg-secondary'}`}
								onclick={() => {
									state.selected.data = e.data;
									state.selected.id = e.id;
								}}
							>
								<div>
									<div className="fw6 f5">{e.name}</div>
									<div className="black-50">{m.trust(tryRender(state.template.listTemplate, { it: JSON.parse(e.data) }))}</div>
								</div>
								<div>
									{e.id === state.selected.id ? (
										<div>
											<div className="btn btn-success btn-sm mr2" onclick={() => api.print(tryRender(state.template.printTemplate, { it: JSON.parse(e.data) })).then(() => success('Printing send'), error)}>
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
							onInput={e => {
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
				.then(template => (state.template = template))
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
							<div className="btn btn-primary" onclick={() => m.route.set(`/templates/${state.template.id}/edit`)}>
								Edit Template
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
					</div>
				</Base>
			);
		}
	};
};
