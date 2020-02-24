import m from 'mithril';

import dot from 'dot';

import api from '../../core/api';

import { newTemplate, newEntry } from '../../core/factory';
import { success, error } from '../toast';

import Header from '../components/header';
import SideNav from '../components/side-nav';
import Preview from '../components/preview';
import ListHeader from '../components/list-header';
import ListEntry from '../components/list-entry';

import EditTemplate from './edit-template';
import EditEntry from './edit-entry';

import debounce from 'lodash-es/debounce';
import cloneDeep from 'lodash-es/cloneDeep';

let render_if = (a, elem) => {
	if (a) return elem;
	return null;
};

const STATES = {
	HOME: 0,
	TEMPLATE: 1,
	ENTRY: 2
};

export default () => {
	let state = {
		current_state: STATES.HOME,
		selected_template: null,
		selected_entry: null,
		selected_data: null,
		pages: 0,
		page: 0,
		search: '',
		templates: [],
		entries: [],
		data: null,
		settings: null
	};

	let fetchSettings = () => {
		api.getSettings().then(settings => {
			state.settings = settings;
		});
	};

	let fetchTemplates = () => {
		api.getTemplates().then(temps => {
			state.templates = temps;

			if (state.selected_template) {
				state.templates.forEach(t => {
					if (state.selected_template.id === t.id) {
						state.selected_template = t;
					}
				});
			}
		});
	};

	let fetchPages = () => {
		api.getEntriesPages(state.selected_template.id, state.search).then(pages => {
			state.pages = pages;
		});
	};

	let fetchEntries = () => {
		api.getEntries(state.selected_template.id, state.page, state.search).then(entries => {
			if (!entries) {
				state.entries = [];
				return;
			}

			entries.forEach(e => {
				e.parsed = JSON.parse(e.data);
			});

			state.entries = entries;
		});
	};

	let runSearch = debounce(() => {
		state.page = 0;
		fetchPages();
		fetchEntries();
	}, 250);

	let getPreview = () => {
		try {
			if (!state.selected_template) return '';
			let template = dot.template(state.selected_template.print_template);
			if (state.selected_entry) return template(JSON.parse(state.selected_entry.data ?? '{}'));
			return template(JSON.parse(state.selected_template.skeleton_data ?? '{}'));
		} catch (e) {
			return '';
		}
	};

	let body = () => {
		switch (state.current_state) {
			case STATES.HOME:
				return (
					<div className="flex-grow-1 flex overflow-auto">
						<SideNav page="home" />
						<div className="h-100 w-25 overflow-auto flex flex-column">
							<ListHeader title="Templates">
								<i
									className="ion ion-md-add-circle f5 green dim pointer"
									onclick={() => {
										state.current_state = STATES.TEMPLATE;
										state.data = newTemplate();
									}}
								/>
							</ListHeader>
							<div className="flex-grow-1 overflow-auto list">
								{state.templates?.map((t, i) => {
									return (
										<ListEntry
											onclick={() => {
												state.selected_template = t;
												state.selected_entry = null;
												state.page = 0;
												state.search = '';

												fetchPages();
												fetchEntries();
											}}
											active={state.selected_template?.id === t.id}
										>
											<div className="flex justify-between">
												<span>{i + 1}.</span>
												{t.name}
											</div>
											{t.description.length > 0 ? <div className="tr pt2 mt2 bt b--black-10 f7">{t.description}</div> : null}
										</ListEntry>
									);
								})}
							</div>
						</div>
						<div className="h-100 flex-grow-1 overflow-auto bl b--black-10 flex flex-column">
							<ListHeader title={state.selected_template?.name ?? 'Nothing Selected...'}>
								{render_if(
									state.selected_template,
									<div className="flex items-center justify-center">
										<i
											className="ion ion-md-add-circle f5 green dim pointer mr2"
											onclick={() => {
												state.current_state = STATES.ENTRY;
												state.data = newEntry();
											}}
										/>
										<i
											className="ion ion-md-brush f5 blue dim pointer mr2"
											onclick={() => {
												state.current_state = STATES.TEMPLATE;
												state.data = cloneDeep(state.selected_template);
											}}
										/>
										<i
											className="ion ion-md-close-circle-outline f5 red dim pointer"
											onclick={() => {
												api.deleteTemplate(state.selected_template.id).then(() => {
													state.selected_template = null;
													state.selected_entry = null;
													state.entries = null;
													fetchTemplates();
												});
											}}
										/>
									</div>
								)}
							</ListHeader>
							<div className="flex-grow-1 overflow-auto list">
								{(() => {
									if (!state.entries || state.entries.length === 0) return null;

									let tmp = dot.template(state.selected_template.list_template);

									return state.entries?.map((t, i) => {
										return (
											<ListEntry
												onclick={() => {
													state.selected_entry = t;
												}}
												active={state.selected_entry?.id === t.id}
											>
												<div className="flex justify-between">
													<span>{state.page * 50 + i + 1}.</span>
													{t.name}
												</div>
												{m.trust(tmp(t.parsed))}
											</ListEntry>
										);
									});
								})()}
							</div>
							{render_if(
								state.selected_template,
								<div className="bg-light-gray bt b--black-10 ph3 pv2 flex justify-between items-center flex-shrink-0">
									<i
										className="ion ion-md-arrow-dropleft f3 pointer dim"
										onclick={() => {
											if (state.page > 0) {
												state.page--;
											}
											fetchEntries();
										}}
									/>
									<div>
										Page {state.page + 1} / {state.pages}
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
											if (state.page < state.pages - 1) {
												state.page++;
											}
											fetchEntries();
										}}
									/>
								</div>
							)}
						</div>
						<div className="bl b--black-10 h-100 flex-shrink-0 overflow-auto flex flex-column">
							<ListHeader title={state.selected_entry?.name ?? 'Nothing Selected...'}>
								{render_if(
									state.selected_entry,
									<div className="flex items-center justify-center">
										<i
											className="ion ion-md-print f5 orange dim pointer mr2"
											onclick={() => {
												api.print(getPreview()).then(
													() => {
														success('Job sent');
													},
													err => {
														error(err);
													}
												);
											}}
										/>
										<i
											className="ion ion-md-brush f5 blue dim pointer mr2"
											onclick={() => {
												state.current_state = STATES.ENTRY;
												state.data = cloneDeep(state.selected_entry);
											}}
										/>
										<i
											className="ion ion-md-close-circle-outline f5 red dim pointer"
											onclick={() => {
												api.deleteEntry(state.selected_template.id, state.selected_entry.id).then(() => {
													state.selected_entry = null;
													fetchPages();
													fetchEntries();
												});
											}}
										/>
									</div>
								)}
							</ListHeader>
							<div className="preview flex-grow-1">
								<Preview content={getPreview()} stylesheets={state.settings?.stylesheets} width={state.settings?.printer_width} />
							</div>
						</div>
					</div>
				);
			case STATES.TEMPLATE:
				return (
					<div className="flex-grow-1 flex overflow-auto">
						<EditTemplate
							previewWidth={state.settings?.printer_width}
							stylesheets={state.settings?.stylesheets}
							editName={state.data.id == null}
							target={state.data}
							onclose={() => {
								state.current_state = STATES.HOME;
								state.data = null;
							}}
							onsave={finished => {
								if (finished.name.length < 3) {
									error('Please insert a name!');
									return;
								}

								api.saveTemplate(finished).then(
									() => {
										fetchTemplates();
										success('Template created');
										state.current_state = STATES.HOME;
										state.data = null;
									},
									err => {
										error("Couldn't create template");
										console.log(err);
									}
								);
							}}
						/>
					</div>
				);
			case STATES.ENTRY:
				return (
					<div className="flex-grow-1 flex overflow-auto">
						<EditEntry
							previewWidth={state.settings?.printer_width}
							stylesheets={state.settings?.stylesheets}
							editName={state.data.id == null}
							template={state.selected_template}
							target={state.data}
							onclose={() => {
								state.current_state = STATES.HOME;
								state.data = null;
							}}
							onsave={finished => {
								if (finished.name.length < 3) {
									error('Please insert a name!');
									return;
								}

								api.saveEntry(state.selected_template.id, finished).then(
									() => {
										state.selected_entry = finished;
										fetchPages();
										fetchEntries();
										fetchEntries();
										success('Entry created');
										state.current_state = STATES.HOME;
										state.data = null;
									},
									err => {
										error("Couldn't create entry");
										console.log(err);
									}
								);
							}}
						/>
					</div>
				);
		}
	};

	fetchTemplates();
	fetchSettings();

	return {
		view(vnode) {
			return (
				<div className="h-100 w-100 flex flex-column black-80">
					<Header />
					{body()}
				</div>
			);
		}
	};
};
