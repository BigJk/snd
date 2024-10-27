import m from 'mithril';
import { groupBy } from 'lodash-es';

import BasicInfo, { buildId } from 'js/types/basic-info';
import * as API from 'js/core/api';
import store, { sources } from 'js/core/store';

import Button from 'js/ui/shoelace/button';
import DividerVert from 'js/ui/shoelace/divider-vert';
import IconButton from 'js/ui/shoelace/icon-button';

import AuthorTag from 'js/ui/components/atomic/author-tag';
import Title from 'js/ui/components/atomic/title';
import DataTable from 'js/ui/components/data-table/data-table';
import FilterBox from 'js/ui/components/filter-box';
import Flex from 'js/ui/components/layout/flex';
import { openDataSourceCreateModal } from 'js/ui/components/modals/create-source';
import ImportExport from 'js/ui/components/modals/imexport/import-export';
import PageEmptyState from 'js/ui/components/page-empty-state';
import Base from 'js/ui/components/view-layout/base';

import { setPortal } from 'js/ui/portal';

export default (): m.Component => {
	let searchValue = '';

	const filteredSources = () =>
		sources.value.filter(
			(source) => source.name.toLowerCase().includes(searchValue.toLowerCase()) || source.author.toLowerCase().includes(searchValue.toLowerCase()),
		);

	const allAuthors = Object.keys(groupBy(sources.value, 'author'));

	const search = () =>
		m(FilterBox, {
			value: searchValue,
			placeholder: 'Search data source...',
			onChange: (value) => {
				searchValue = value;
			},
			authors: allAuthors,
			footer: [filteredSources().length, ' data sources'],
			hideHovered: true,
		});

	const emptyState = () => {
		if (filteredSources().length > 0) {
			return null;
		}

		return m(PageEmptyState, { name: 'data sources', bigMessage: sources.value.length === 0 });
	};

	const dataTable = () =>
		m('div.mb3.pr3', { style: { marginRight: '250px' } }, [
			m(DataTable<BasicInfo>, {
				data: filteredSources(),
				items: 'center',
				columns: [
					{
						field: 'name',
						width: '250px',
						render: (parent) =>
							m('div', [
								m('div.b.f7.mb1', parent.name), //
								m('div.f8.text-muted.', [m('span.mr1', 'by'), m(AuthorTag, { author: parent.author })]),
							]),
					},
					{ field: 'description', width: '1fr', noBorder: true },
					{
						customID: ' ',
						width: 'max-content',
						render: (parent) => m(Button, { intend: 'link', onClick: () => m.route.set(`/data-source/${buildId('source', parent)}`) }, 'Open'),
					},
				],
			}), //
		]);

	return {
		oninit() {
			store.actions.loadSources();
		},
		view() {
			return m(
				Base,
				{
					title: m(Title, 'Data Sources'),
					active: 'data-sources',
					classNameContainer: '.pa3',
					rightElement: m(Flex, { items: 'center' }, [
						m(
							IconButton,
							{
								intend: 'link',
								icon: 'cloud-upload',
								onClick: () => {
									setPortal(ImportExport, {
										attributes: {
											endpoint: API.IMPORT_SOURCE,
											title: 'Import Data Source',
											loadingMessage: 'Importing... Please wait',
											verb: 'Import',
										},
									});
								},
							},
							'Import',
						), //
						m(DividerVert),
						m(
							IconButton,
							{
								intend: 'link',
								icon: 'add',
								onClick: openDataSourceCreateModal,
							},
							'Create',
						),
					]),
				},
				m('div', sources.value.length === 0 ? m(PageEmptyState, { name: 'data sources', bigMessage: true }) : [search(), dataTable()]),
			);
		},
	};
};
