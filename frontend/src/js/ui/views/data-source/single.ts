import m from 'mithril';

import DataSource from 'js/types/data-source';
import Entry from 'js/types/entry';

import * as API from 'js/core/api';

import Button from 'js/ui/spectre/button';
import Loader from 'js/ui/spectre/loader';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';
import SidebarPage from 'js/ui/components/view-layout/sidebar-page';

import { error } from 'js/ui/toast';
import PaginatedContent from 'js/ui/components/view-layout/paginated-content';
import Input from 'js/ui/spectre/input';
import EntryListItem from 'js/ui/components/entry-list-item';
import Monaco from 'js/ui/components/monaco';

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

	const filteredEntries = () => {
		if (!state.source) {
			return [];
		}

		return state.entries.filter((entry) => {
			return entry.name.toLowerCase().includes(state.search.toLowerCase());
		});
	};

	return {
		oninit({ attrs }) {
			API.exec<DataSource>(API.GET_SOURCE, attrs.id)
				.then((source) => {
					state.source = source;

					API.exec<Entry[]>(API.GET_ENTRIES, attrs.id)
						.then((entries) => {
							state.entries = entries;
						})
						.catch(error);
				})
				.catch(error);
		},
		view() {
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
					rightElement: m('div', [
						m(
							Button,
							{
								intend: 'error',
							},
							'Delete',
						), //
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
										// @ts-ignore
										renderItem: (item) =>
											m(EntryListItem, {
												entry: item,
												selected: item.id === state.selectedEntry?.id,
												onClick: () => {
													state.selectedEntry = item;
													state.editValue = '';
												},
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
					m(
						'div.bg-white.ba.b--black-10',
						{ style: { width: '500px' } },
						m(Monaco, {
							language: 'json',
							value: state.selectedEntry ? JSON.stringify(state.selectedEntry.data, null, 2) : '',
						}),
					),
				),
			);
		},
	};
};
