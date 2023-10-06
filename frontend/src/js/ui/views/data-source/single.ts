import m from 'mithril';

import DataSource from 'js/types/data-source';
import Entry from 'js/types/entry';

import * as API from 'js/core/api';

import Button from 'js/ui/spectre/button';
import Loader from 'js/ui/spectre/loader';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';
import SidebarPage from 'js/ui/components/view-layout/sidebar-page';

import { dialogWarning, error, success } from 'js/ui/toast';
import PaginatedContent from 'js/ui/components/view-layout/paginated-content';
import Input from 'js/ui/spectre/input';
import EntryListItem from 'js/ui/components/entry-list-item';
import Monaco from 'js/ui/components/monaco';
import Icon from 'js/ui/components/atomic/icon';
import Tooltip from 'js/ui/components/atomic/tooltip';
import store from 'js/core/store';
import Flex from 'js/ui/components/layout/flex';
import CreateSourceEntry from 'js/ui/components/modals/source/create-edit-entry';

type SingleSourceProps = {
	id: string;
};

type SingleSourceState = {
	source: DataSource | null;
	entries: Entry[];
	selectedEntry: Entry | null;
	search: string;
	editValue: string;
};

const PER_PAGE = 30;

export default (): m.Component<SingleSourceProps> => {
	const state: SingleSourceState = {
		source: null,
		entries: [],
		selectedEntry: null,
		search: '',
		editValue: '',
	};

	const fetchData = (id: string) =>
		new Promise<void>((resolve, reject) => {
			API.exec<DataSource>(API.GET_SOURCE, id)
				.then((source) => {
					state.source = source;

					API.exec<Entry[] | null>(API.GET_ENTRIES, id)
						.then((entries) => {
							state.entries = entries ?? [];
							resolve();
						})
						.catch(reject);
				})
				.catch(reject);
		});

	const editSource = (id: string) => {
		// TODO: ...
	};

	const deleteSource = (id: string) => {
		dialogWarning('Are you sure you want to delete this data source?').then(() => {
			API.exec<void>(API.DELETE_SOURCE, id)
				.then(() => {
					success(`Deleted '${state.source?.name}' data source`);
					m.route.set('/data-source');
					store.actions.loadSources();
				})
				.catch(error);
		});
	};

	const filteredEntries = () => {
		if (!state.source) {
			return [];
		}

		return state.entries.filter((entry) => entry.name.toLowerCase().includes(state.search.toLowerCase()));
	};

	const clickEntry = (entry: Entry) => {
		if (entry.id === state.selectedEntry?.id) {
			return;
		}

		if (selectedChanged()) {
			dialogWarning('Are you sure you want to discard your changes?').then(() => {
				state.selectedEntry = entry;
				state.editValue = '';
			});
		} else {
			state.selectedEntry = entry;
			state.editValue = '';
		}
	};

	const deleteEntry = (id: string, entry: Entry) => {
		API.exec<void>(API.DELETE_ENTRY, id, entry.id)
			.then(() => {
				state.selectedEntry = null;
				state.editValue = '';
				success(`Deleted '${entry.name}' entry`);
				fetchData(id).catch(error);
			})
			.catch(error);
	};

	const saveSelected = (id: string) => {
		if (!state.selectedEntry) {
			return;
		}

		try {
			let entry = { ...state.selectedEntry, data: state.editValue ? JSON.parse(state.editValue) : state.selectedEntry.data };
			API.exec<void>(API.SAVE_ENTRY, id, entry)
				.then(() => {
					success(`Saved '${entry.name}' entry`);
					state.selectedEntry = entry;
					fetchData(id).catch(error);
				})
				.catch(error);
		} catch (e) {
			error(e as string);
		}
	};

	const selectedJson = () => {
		if (!state.selectedEntry) {
			return '';
		}

		if (state.editValue) {
			return state.editValue;
		}

		return JSON.stringify(state.selectedEntry.data, null, 2);
	};

	const selectedChanged = () => {
		if (!state.selectedEntry) {
			return false;
		}
		return state.editValue !== JSON.stringify(state.selectedEntry?.data, null, 2);
	};

	return {
		oninit({ attrs }) {
			fetchData(attrs.id);
		},
		view({ attrs }) {
			return m(
				Base,
				{
					title: m(Breadcrumbs, {
						items: [
							{
								link: '/data-source',
								label: 'Data Sources',
							},
							{ label: state.source ? state.source.name : m(Loader, { className: '.mh2' }) },
						],
					}),
					active: 'data-sources',
					classNameContainer: '.pa3',
					rightElement: m(Flex, { gap: 2 }, [
						m(
							Button,
							{
								intend: 'success',
								onClick: () =>
									CreateSourceEntry().then((res) => {
										const newEntry = { id: res.id, name: res.name, data: {} };
										API.exec<void>(API.SAVE_ENTRY, attrs.id, newEntry)
											.then(() => {
												success(`Created '${res.name}' entry`);
												fetchData(attrs.id)
													.then(() => {
														state.selectedEntry = newEntry;
														state.editValue = '';
													})
													.catch(error);
											})
											.catch(error);
									}),
							},
							[m(Icon, { icon: 'add' }), 'Create Entry'],
						), //
						m(
							Button,
							{
								intend: 'primary',
								onClick: () => editSource(attrs.id),
							},
							m(Icon, { icon: 'create' }),
						),
						m(
							Button,
							{
								intend: 'error',
								onClick: () => deleteSource(attrs.id),
							},
							m(Icon, { icon: 'trash' }),
						),
					]),
				},
				m(
					// @ts-ignore
					SidebarPage,
					{
						tabs: [{ label: 'Entries', icon: '' }],
						content: {
							Entries: () =>
								m(
									PaginatedContent<Entry>,
									{
										items: filteredEntries(),
										perPage: PER_PAGE,
										renderItem: (item) =>
											// @ts-ignore
											m(EntryListItem, {
												entry: item,
												selected: item.id === state.selectedEntry?.id,
												onClick: () => clickEntry(item),
												right:
													item.id === state.selectedEntry?.id
														? m(Flex, { gap: 2 }, [
																m(
																	Tooltip,
																	{ content: 'Edit Entry' },
																	m(
																		Button,
																		{
																			intend: 'primary',
																			size: 'sm',
																			onClick: () => {
																				CreateSourceEntry(item.id, item.name).then((res) => {
																					state.selectedEntry = { ...state.selectedEntry!, name: res.name };
																					saveSelected(attrs.id);
																				});
																			},
																		},
																		m(Icon, { icon: 'create' }),
																	),
																),
																m(
																	Tooltip,
																	{ content: 'Delete Entry' },
																	m(Button, { intend: 'error', size: 'sm', onClick: () => deleteEntry(attrs.id, item) }, m(Icon, { icon: 'trash' })),
																),
														  ])
														: null,
											}),
									},
									m(
										'div.w5',
										m(Input, {
											placeholder: 'Search...',
											value: state.search,
											onChange: (val) => (state.search = val),
										}),
									),
								),
						},
					},
					m('div.bg-white.ba.b--black-10.relative', { style: { width: '500px' } }, [
						selectedChanged()
							? m(
									Button,
									{
										className: '.absolute.ma3.left-0.bottom-0.z-1',
										intend: 'success',
										onClick: () => saveSelected(attrs.id),
									},
									'Save Change',
							  )
							: null,
						m(Monaco, {
							className: '.z-0',
							language: 'json',
							value: selectedJson(),
							onChange: (value) => {
								state.editValue = value;
								m.redraw();
							},
						}),
					]),
				),
			);
		},
	};
};
