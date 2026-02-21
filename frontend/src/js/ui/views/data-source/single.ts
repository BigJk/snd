import m from 'mithril';

import { buildId } from 'js/types/basic-info';
import DataSource from 'js/types/data-source';
import Entry from 'js/types/entry';
import * as API from 'js/core/api';
import store from 'js/core/store';

import Button from 'js/ui/shoelace/button';
import DividerVert from 'js/ui/shoelace/divider-vert';
import IconButton from 'js/ui/shoelace/icon-button';
import Input from 'js/ui/shoelace/input';
import Loader from 'js/ui/shoelace/loader';

import Icon from 'js/ui/components/atomic/icon';
import Tooltip from 'js/ui/components/atomic/tooltip';
import EntryListItem from 'js/ui/components/entry-list-item';
import Flex from 'js/ui/components/layout/flex';
import { openAdditionalInfosModal } from 'js/ui/components/modals/additional-infos';
import ImportExport from 'js/ui/components/modals/imexport/import-export';
import CreateSourceEntry from 'js/ui/components/modals/source/create-edit-entry';
import Monaco from 'js/ui/components/monaco';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';
import PaginatedContent from 'js/ui/components/view-layout/paginated-content';
import SidebarPage from 'js/ui/components/view-layout/sidebar-page';

import { setPortal } from 'js/ui/portal';
import { dialogWarning, error, success } from 'js/ui/toast';

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

	const showExport = () => {
		if (!state.source) return;

		setPortal(ImportExport, {
			attributes: {
				endpoint: API.EXPORT_SOURCE,
				title: 'Export Data Source',
				loadingMessage: 'Exporting... Please wait',
				verb: 'Export',
				id: buildId('source', state.source),
			},
		});
	};

	const showAdditionalInfo = () => {
		if (!state.source) return;
		openAdditionalInfosModal('source', buildId('source', state.source));
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
					rightElement: m(Flex, [
						m(
							IconButton,
							{
								className: '.mr2',
								icon: 'add',
								intend: 'success',
								size: 'sm',
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
							'Create Entry',
						), //
						m(
							IconButton,
							{
								size: 'sm',
								icon: 'create',
								intend: 'primary',
								onClick: () => editSource(attrs.id),
							},
							'Edit',
						),
						m(DividerVert),
						m(
							Tooltip,
							{ content: 'Export' },
							m(IconButton, { icon: 'download', size: 'sm', intend: 'primary', className: '.mr2', onClick: showExport }),
						),
						m(
							Tooltip,
							{ content: 'Additional Information' },
							m(IconButton, { icon: 'information-circle-outline', size: 'sm', intend: 'primary', className: '.mr2', onClick: showAdditionalInfo }),
						),
						m(
							Tooltip,
							{ content: 'Delete' },
							m(IconButton, {
								size: 'sm',
								icon: 'trash',
								intend: 'error',
								onClick: () => deleteSource(attrs.id),
							}),
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
																	m(IconButton, { intend: 'error', size: 'sm', onClick: () => deleteEntry(attrs.id, item), icon: 'trash' }),
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
