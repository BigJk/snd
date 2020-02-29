import m from 'mithril';

import store from '../../../../core/store';
import api from '../../../../core/api';

import * as nunjucks from 'nunjucks';

import Base from '../../../components/base';
import Header from '../../../components/header';
import Preview from '../../../components/preview';
import Loading from '../../../components/loading';

import debounce from 'lodash-es/debounce';

import { success, error } from '../../../toast';

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
			<div className="h-100 flex justify-between overflow-auto">
				<div className="flex-grow-1 flex flex-column overflow-auto lh-solid">
					<div className="flex-grow-1 overflow-auto">
						{state.entries.map(e => {
							return (
								<div
									className={`w-100 bb b--black-10 pa3 ${e.id !== state.selected.id ? 'hover-bg-secondary pointer' : 'bg-secondary'}`}
									onclick={() => {
										state.selected.data = e.data;
										state.selected.id = e.id;
									}}
								>
									<div className="flex justify-between items-center h2">
										<div className="fw6 f5">{e.name}</div>
										{e.id === state.selected.id ? (
											<div>
												<div className="btn btn-success btn-sm mr2" onclick={() => api.print(nunjucks.renderString(state.template.print_template, { it: JSON.parse(e.data) })).then(() => success('Printing send'), error)}>
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
									<div>{m.trust(nunjucks.renderString(state.template.list_template, { it: JSON.parse(e.data) }))}</div>
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
								oninput={e => {
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
				</div>
				<Preview
					className="bg-light-gray flex-shrink-0"
					width={340}
					scale={340.0 / store.data.settings.printer_width}
					stylesheets={store.data.settings.stylesheets}
					content={nunjucks.renderString(state.template.print_template, { it: JSON.parse(state.selected.data ?? state.template.skeleton_data) })}
				/>
			</div>
		);
	};

	return {
		oninit(vnode) {
			let templateId = parseInt(vnode.attrs.id);

			if (store.data.last_template_state?.template.id === templateId) {
				state = store.data.last_template_state;
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
			store.set('last_template_state', state);
		},
		view(vnode) {
			return (
				<Base active="templates">
					<div className="h-100 flex flex-column">
						<Header breadcrumbs={breadcrumbs()}>
							<div className="btn btn-success btn-sm mr2" onclick={() => m.route.set(`/templates/${state.template.id}/new`)}>
								New Entry
							</div>
							<div className="btn btn-primary btn-sm mr2" onclick={() => m.route.set(`/templates/${state.template.id}/edit`)}>
								Edit Template
							</div>
							<div
								className="btn btn-error btn-sm"
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
