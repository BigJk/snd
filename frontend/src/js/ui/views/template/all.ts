import m from 'mithril';
import { groupBy } from 'lodash-es';

import { buildId } from 'js/types/basic-info';
import Template from 'js/types/template';
import * as API from 'js/core/api';
import store, { templates } from 'js/core/store';

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
	let hovered: Template | null = null;

	const filteredTemplates = () =>
		templates.value.filter(
			(template) =>
				template.name.toLowerCase().includes(searchValue.toLowerCase()) || template.author.toLowerCase().includes(searchValue.toLowerCase()),
		);

	const allAuthors = Object.keys(groupBy(templates.value, 'author'));

	const search = () =>
		m(FilterBox, {
			value: searchValue,
			placeholder: 'Search templates...',
			onChange: (value) => {
				searchValue = value;
			},
			authors: allAuthors,
			footer: [filteredTemplates().length, ' templates'],
			hoveredId: hovered ? buildId('template', hovered) : undefined,
		});

	const dataTable = () =>
		m('div.mb3.pr3', { style: { marginRight: '250px' } }, [
			m(DataTable<Template>, {
				data: filteredTemplates(),
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
										backgroundImage: `url("/api/preview-image/${buildId('template', parent)}")`,
										backgroundSize: '100% auto',
										backgroundPosition: 'center top',
										backgroundRepeat: 'no-repeat',
									},
									onclick: () => m.route.set(`/template/${buildId('template', parent)}`),
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
						render: (parent) => m(Button, { intend: 'link', onClick: () => m.route.set(`/template/${buildId('template', parent)}`) }, 'Open'),
					},
				],
			}), //
		]);

	return {
		oninit() {
			store.actions.loadTemplates();
		},
		view(vnode) {
			return m(
				Base,
				{
					title: m(Title, 'Templates'),
					active: 'templates',
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
											endpoint: API.IMPORT_TEMPLATE,
											title: 'Import Template',
											loadingMessage: 'Importing... Please wait',
											verb: 'Import',
										},
									});
								},
							},
							'Import',
						), //
						m(DividerVert),
						m(IconButton, { link: '/template/create', intend: 'link', icon: 'add' }, 'Create'), //
					]),
				},
				m('div', templates.value.length === 0 ? m(PageEmptyState, { name: 'templates', bigMessage: true }) : [search(), dataTable()]),
			);
		},
	};
};
