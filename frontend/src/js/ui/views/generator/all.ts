import m from 'mithril';
import { groupBy } from 'lodash-es';

import { buildId } from 'js/types/basic-info';
import Generator from 'js/types/generator';
import * as API from 'js/core/api';
import store, { generators } from 'js/core/store';

import Button from 'js/ui/shoelace/button';
import DividerVert from 'js/ui/shoelace/divider-vert';
import IconButton from 'js/ui/shoelace/icon-button';

import AuthorTag from 'js/ui/components/atomic/author-tag';
import Title from 'js/ui/components/atomic/title';
import DataTable from 'js/ui/components/data-table/data-table';
import FilterBox from 'js/ui/components/filter-box';
import Flex from 'js/ui/components/layout/flex';
import ImportExport from 'js/ui/components/modals/imexport/import-export';
import PageEmptyState from 'js/ui/components/page-empty-state';
import Base from 'js/ui/components/view-layout/base';

import { setPortal } from 'js/ui/portal';

export default (): m.Component => {
	let searchValue = '';
	let hovered: Generator | null = null;

	const filteredGenerators = () =>
		generators.value.filter(
			(generator) =>
				generator.name.toLowerCase().includes(searchValue.toLowerCase()) || generator.author.toLowerCase().includes(searchValue.toLowerCase()),
		);

	const allAuthors = Object.keys(groupBy(generators.value, 'author'));

	const search = () =>
		m(FilterBox, {
			value: searchValue,
			placeholder: 'Search generator...',
			onChange: (value) => {
				searchValue = value;
			},
			authors: allAuthors,
			footer: [filteredGenerators().length, ' generators'],
			hoveredId: hovered ? buildId('generator', hovered) : undefined,
			hoverText: 'Hover over a generator to preview',
		});

	const dataTable = () =>
		m('div.mb3.pr3', { style: { marginRight: '250px' } }, [
			m(DataTable<Generator>, {
				data: filteredGenerators(),
				items: 'center',
				columns: [
					{
						customID: 'action',
						header: ' ',
						width: 'max-content',

						render: (parent) =>
							m(
								'div.relative.dim.pointer',
								{
									style: {
										width: '100px',
										height: '40px',
										backgroundImage: `url("/api/preview-image/${buildId('generator', parent)}")`,
										backgroundSize: '100% auto',
										backgroundPosition: 'center top',
										backgroundRepeat: 'no-repeat',
									},
									onclick: () => m.route.set(`/generator/${buildId('generator', parent)}`),
									onmouseover: () => (hovered = parent),
									onmouseout: () => (hovered = null),
								},
								[
									m('div.absolute.bottom-0.right-0.w-100', {
										style: {
											height: '50%',
											background: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 100%)',
										},
									}),
								],
							),
					},
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
						render: (parent) => m(Button, { intend: 'link', onClick: () => m.route.set(`/generator/${buildId('generator', parent)}`) }, 'Open'),
					},
				],
			}), //
		]);

	return {
		oninit() {
			store.actions.loadGenerators();
		},
		view(vnode) {
			return m(
				Base,
				{
					title: m(Title, 'Generators'),
					active: 'generators',
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
											endpoint: API.IMPORT_GENERATOR,
											title: 'Import Generator',
											loadingMessage: 'Importing... Please wait',
											verb: 'Import',
										},
									});
								},
							},
							'Import',
						), //
						m(DividerVert),
						m(IconButton, { link: '/generator/create', intend: 'link', icon: 'add' }, 'Create'), //
					]),
				},
				m('div', generators.value.length === 0 ? m(PageEmptyState, { name: 'generators', bigMessage: true }) : [search(), dataTable()]),
			);
		},
	};
};
