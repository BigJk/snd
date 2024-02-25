import m from 'mithril';
import { groupBy, map } from 'lodash-es';

import { buildId } from 'js/types/basic-info';
import * as API from 'js/core/api';
import store, { sources } from 'js/core/store';

import DividerVert from 'js/ui/spectre/divider-vert';
import IconButton from 'js/ui/spectre/icon-button';
import Input from 'js/ui/spectre/input';

import Icon from 'js/ui/components/atomic/icon';
import Title from 'js/ui/components/atomic/title';
import Flex from 'js/ui/components/layout/flex';
import Grid from 'js/ui/components/layout/grid';
import { openDataSourceCreateModal } from 'js/ui/components/modals/create-source';
import ImportExport from 'js/ui/components/modals/imexport/import-export';
import PageEmptyState from 'js/ui/components/page-empty-state';
import SourceBox from 'js/ui/components/source-box';
import Base from 'js/ui/components/view-layout/base';

import { setPortal } from 'js/ui/portal';

export default (): m.Component => {
	let searchValue = '';

	const filteredSources = () =>
		sources.value.filter(
			(source) => source.name.toLowerCase().includes(searchValue.toLowerCase()) || source.author.toLowerCase().includes(searchValue.toLowerCase()),
		);

	const authorGroupTitle = (author: string) =>
		m('div', [
			m('div.text-muted.f8.fw5.ttu.mb1', 'Data Source by'), //
			m(Title, author), //
		]);

	const dataSourceCount = (length: number) => m('div.f8.fw5.ttu.mb1.text-muted', `${length} Data Sources`);

	const dataSourcesByAuthor = () =>
		map(groupBy(filteredSources(), 'author'), (sources, author) =>
			m('div.bg-white.br2.ph3.mb3.ba.b--black-10', [
				m(Flex, { justify: 'between', className: '.mv3.bb.b--black-10.pb3' }, [
					authorGroupTitle(author), //
					dataSourceCount(sources.length), //
				]), //
				m(
					Grid,
					{ className: '.mb3', minWidth: '350px', maxWidth: '1fr' },
					sources.map((source) =>
						m(SourceBox, {
							source: source,
							onClick: () => {
								m.route.set(`/data-source/${buildId('source', source)}`);
							},
						}),
					),
				),
			]),
		);

	const search = () =>
		m('div.bg-white.mb3.br2.ba.b--black-10.pa3', [
			m('div.f8.fw5.ttu.mb3.text-muted', 'What are you looking for?'),
			m(Flex, { items: 'center' }, [
				m(Icon, { icon: 'search', className: '.mr3', size: 4 }), //
				m(Input, {
					value: searchValue,
					placeholder: 'Search data sources...',
					className: '.f6',
					minimal: true,
					onChange: (value) => {
						searchValue = value;
					},
				}),
			]),
		]);

	const emptyState = () => {
		if (filteredSources().length > 0) {
			return null;
		}

		return m(PageEmptyState, { name: 'data sources', bigMessage: sources.value.length === 0 });
	};

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
				m('div', [search(), emptyState(), dataSourcesByAuthor()]),
			);
		},
	};
};
