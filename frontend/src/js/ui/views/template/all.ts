import m from 'mithril';

import { groupBy, map } from 'lodash-es';

import { buildId } from 'js/types/basic-info';

import { templates } from 'js/core/store';

import Button from 'js/ui/spectre/button';
import Input from 'js/ui/spectre/input';

import Icon from 'js/ui/components/atomic/icon';
import Title from 'js/ui/components/atomic/title';
import Flex from 'js/ui/components/layout/flex';
import Grid from 'js/ui/components/layout/grid';
import TemplateBox from 'js/ui/components/template-box';
import Base from 'js/ui/components/view-layout/base';

export default (): m.Component => {
	let searchValue = '';

	const authorGroupTitle = (author: string) =>
		m('div', [
			m('div.text-muted.f8.fw5.ttu.mb1', 'Templates by'), //
			m(Title, author), //
		]);

	const templateCount = (length: number) => m('div.f8.fw5.ttu.mb1.text-muted', `${length} Templates`);

	const templatesByAuthor = () =>
		map(
			groupBy(
				templates.value.filter(
					(template) =>
						template.name.toLowerCase().includes(searchValue.toLowerCase()) || template.author.toLowerCase().includes(searchValue.toLowerCase()),
				),
				'author',
			),
			(templates, author) =>
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

	return {
		view(vnode) {
			return m(
				Base,
				{
					title: m(Title, 'Templates'),
					active: 'templates',
					classNameContainer: '.pa3',
					rightElement: m('div', [
						m(Button, { link: '/template/create' }, 'Create'), //
					]),
				},
				m('div', [search(), templatesByAuthor()]),
			);
		},
	};
};
