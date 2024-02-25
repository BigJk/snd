import m from 'mithril';
import { groupBy, map } from 'lodash-es';

import { buildId } from 'js/types/basic-info';
import * as API from 'js/core/api';
import store, { templates } from 'js/core/store';

import DividerVert from 'js/ui/spectre/divider-vert';
import IconButton from 'js/ui/spectre/icon-button';
import Input from 'js/ui/spectre/input';

import Icon from 'js/ui/components/atomic/icon';
import Title from 'js/ui/components/atomic/title';
import Flex from 'js/ui/components/layout/flex';
import Grid from 'js/ui/components/layout/grid';
import ImportExport from 'js/ui/components/modals/imexport/import-export';
import PageEmptyState from 'js/ui/components/page-empty-state';
import TemplateBox from 'js/ui/components/template-box';
import Base from 'js/ui/components/view-layout/base';

import { setPortal } from 'js/ui/portal';

export default (): m.Component => {
	let searchValue = '';

	const filteredTemplates = () =>
		templates.value.filter(
			(template) =>
				template.name.toLowerCase().includes(searchValue.toLowerCase()) || template.author.toLowerCase().includes(searchValue.toLowerCase()),
		);

	const authorGroupTitle = (author: string) =>
		m('div', [
			m('div.text-muted.f8.fw5.ttu.mb1', 'Templates by'), //
			m(Title, author), //
		]);

	const templateCount = (length: number) => m('div.f8.fw5.ttu.mb1.text-muted', `${length} Templates`);

	const templatesByAuthor = () =>
		map(groupBy(filteredTemplates(), 'author'), (templates, author) =>
			m('div.bg-white.br2.ph3.mb3.ba.b--black-10', [
				m(Flex, { justify: 'between', className: '.mv3.bb.b--black-10.pb3' }, [
					authorGroupTitle(author), //
					templateCount(templates.length), //
				]), //
				m(
					Grid,
					{ className: '.mb3', minWidth: '350px', maxWidth: '1fr' },
					templates.map((template) =>
						m(TemplateBox, { template: template, onClick: () => m.route.set(`/template/${buildId('template', template)}`) }),
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
					placeholder: 'Search templates...',
					className: '.f6',
					minimal: true,
					onChange: (value) => {
						searchValue = value;
					},
				}),
			]),
		]);

	const emptyState = () => {
		if (filteredTemplates().length > 0) {
			return null;
		}

		return m(PageEmptyState, { name: 'templates', bigMessage: templates.value.length === 0 });
	};

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
				m('div', [search(), emptyState(), templatesByAuthor()]),
			);
		},
	};
};
