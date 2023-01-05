import { chunk, debounce } from 'lodash-es';

import { ModalChangeInfo } from './modals';

import api from '/js/core/api';

import { Base, Editor, Header, Input, LoadingFullscreen } from '/js/ui/components';

import binder from '/js/ui/binder';
import { error, success } from '/js/ui/toast';

export default () => {
	let state = {
		id: '',
		source: null,
		entries: [],
		search: '',
		filtered: [],
		found: 0,
		page: 0,
		loading: false,
		selected: {
			create: false,
			id: null,
			name: null,
			data: null,
			content: '',
		},
		showEdit: false,
	};

	let fetch = () => {
		api
			.getSource(state.id)
			.then((ds) => {
				state.source = ds;

				api
					.getEntries(state.id)
					.then((entries) => (state.entries = entries ?? []))
					.then(runSearch)
					.catch(error);
			})
			.catch(error);
	};

	let breadcrumbs = () => [
		{
			name: 'Data Sources',
			link: '/data-sources',
		},
		{
			name: state.source?.name ?? '...',
		},
	];

	let runSearch = debounce(() => {
		state.page = 0;

		if (state.search.length === 0) {
			state.filtered = chunk(state.entries, 25);
			state.found = state.entries.length;
		} else {
			let found = state.entries.filter((e) => e.name.toLowerCase().indexOf(state.search.toLowerCase()) >= 0);
			state.filtered = chunk(found, 25);
			state.found = found.length;
		}

		m.redraw();
	}, 250);

	let getPage = () => {
		if (state.filtered.length === 0) return [];

		return state.filtered[state.page];
	};

	let saveEntry = () => {
		try {
			state.selected.data = JSON.parse(state.selected.content);
		} catch (e) {
			error(`Data is malformed (${e})`);
			return;
		}

		state.loading = true;

		api
			.saveEntry(state.id, {
				id: state.selected.id,
				name: state.selected.name,
				data: state.selected.data,
			})
			.then(() => {
				success(`Saved '${state.selected.name}' entry`);
				fetch();
				state.selected.create = false;
			})
			.catch(error)
			.finally(() => (state.loading = false));
	};

	let editInfo = (data) => {
		api
			.saveSource({ ...state.source, ...data })
			.then(() => {
				success('Information updated');
				state.source = { ...state.source, ...data };
				state.showEdit = false;
			})
			.catch(error);
	};

	let editContent = () => {
		if (state.selected.id === null) {
			return (
				<div className='w-50 flex-shrink-0 br1 ba b--black-10 bg-white flex justify-center items-center f5 text-muted'>
					<div className='flex flex-column items-center'>
						<i className='ion ion-md-search f2 mb3' />
						No Entry Selected
					</div>
				</div>
			);
		}

		return (
			<div className='w-50 flex-shrink-0 br1 ba b--black-10 bg-white flex flex-column'>
				<div className='flex flex-shrink-0 pa2 bb b--black-10'>
					<div className='mr2 w-40'>
						<Input
							value={state.selected.id}
							placeholder='ID'
							disabled={!state.selected.create}
							oninput={(e) => (state.selected.id = e.target.value)}
						/>
					</div>
					<Input value={state.selected.name} placeholder='Name' oninput={(e) => (state.selected.name = e.target.value)} />
					<div className='btn btn-success ml2' onclick={saveEntry}>
						{state.selected.create ? 'Create' : 'Save'}
					</div>
				</div>
				<div className='flex-grow-1 overflow-auto'>
					<Editor
						className='h-100 w-100'
						language='javascript'
						content={state.selected.content}
						onchange={(json) => {
							state.selected.content = json;
						}}
						snippets={[]}
						autocompleteData={null}
						formatter={(json) => JSON.stringify(JSON.parse(json), null, '\t')}
					/>
				</div>
			</div>
		);
	};

	return {
		oninit(vnode) {
			state.id = vnode.attrs.id;

			fetch();
		},
		view(vnode) {
			return (
				<Base active='dataSources'>
					<LoadingFullscreen show={state.loading} content='Saving...' />
					<div className='h-100 flex flex-column'>
						<Header breadcrumbs={breadcrumbs()} subtitle='Create & Edit Data Source Entries' pt={2}>
							<div
								className='btn btn-primary mr2'
								onclick={() => {
									state.showEdit = true;
								}}
							>
								Edit Info
							</div>
							<div
								className='btn btn-success'
								onclick={() => {
									state.selected.create = true;
									state.selected.id = 'New ID';
									state.selected.name = 'Name';
									state.selected.data = {};
									state.selected.content = '{ }';
								}}
							>
								New Entry
							</div>
						</Header>
						<div className='h-100 ph3 pb3 flex justify-between overflow-auto'>
							<div className='flex-grow-1 flex-shrink-0 br1 ba b--black-10 bg-white mr2 flex flex-column overflow-auto lh-solid'>
								<div className='flex-grow-1 overflow-auto' id='entry-page'>
									{getPage().map((e) => (
										<div
											className={`w-100 bb b--black-10 mh55 pa2 flex justify-between items-center ${
												e.id !== state.selected.id ? 'hover-bg-secondary pointer' : 'bg-secondary'
											}`}
											onclick={() => {
												state.selected.create = false;
												state.selected.name = e.name;
												state.selected.data = e.data;
												state.selected.content = JSON.stringify(e.data, null, '\t');
												state.selected.id = e.id;
											}}
										>
											<div className='lh-copy'>
												<div className='fw6 f6'>{e.name}</div>
												<div className='f8 text-muted'>{e.id}</div>
											</div>
											{e.id === state.selected.id ? (
												<div>
													<div
														className='btn btn-error btn-sm'
														onclick={() =>
															api
																.deleteEntry(state.id, e.id)
																.then(() => {
																	if (state.id === state.selected.id) {
																		state.selected.id = null;
																	}

																	success('Entry deleted');
																	state.selected.id = null;
																	state.selected.data = null;
																}, error)
																.then(fetch)
														}
													>
														<i className='ion ion-md-close-circle-outline' />
													</div>
												</div>
											) : null}
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
									<div className='w-40 flex items-center justify-center'>
										<div className='flex-grow-1'>
											<Input placeholder='Search...' value={state.search} oninput={binder.inputString(state, 'search', runSearch)} />
										</div>
									</div>
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
							</div>
							<ModalChangeInfo show={state.showEdit} onclose={() => (state.showEdit = false)} onconfirm={editInfo} target={state.source} />
							{editContent()}
						</div>
					</div>
				</Base>
			);
		},
	};
};
