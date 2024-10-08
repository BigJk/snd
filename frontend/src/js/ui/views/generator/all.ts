import m from 'mithril';
import { groupBy, map } from 'lodash-es';

import { buildId } from 'js/types/basic-info';
import { sanitizeConfig } from 'js/types/generator';
import * as API from 'js/core/api';
import store, { generators } from 'js/core/store';

import DividerVert from 'js/ui/shoelace/divider-vert';
import IconButton from 'js/ui/shoelace/icon-button';
import Input from 'js/ui/shoelace/input';

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

	const filteredGenerators = () =>
		generators.value.filter(
			(generator) =>
				generator.name.toLowerCase().includes(searchValue.toLowerCase()) || generator.author.toLowerCase().includes(searchValue.toLowerCase()),
		);

	const authorGroupTitle = (author: string) =>
		m('div', [
			m('div.text-muted.f8.fw5.ttu.mb1', 'Generator by'), //
			m(Title, author), //
		]);

	const generatorCount = (length: number) => m('div.f8.fw5.ttu.mb1.text-muted', `${length} Generators`);

	const generatorsByAuthor = () =>
		map(groupBy(filteredGenerators(), 'author'), (generators, author) =>
			m('div.bg-white.br2.ph3.mb3.ba.b--black-10', [
				m(Flex, { justify: 'between', className: '.mv3.bb.b--black-10.pb3' }, [
					authorGroupTitle(author), //
					generatorCount(generators.length), //
				]), //
				m(
					Grid,
					{ className: '.mb3', minWidth: '350px', maxWidth: '1fr' },
					generators.map((generator) =>
						m(TemplateBox, {
							onClick: () => m.route.set(`/generator/${buildId('generator', generator)}`),
							generator: generator,
							config: sanitizeConfig(generator, {
								seed: 'TEST_SEED',
							}),
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
					placeholder: 'Search generators...',
					className: '.f6',
					minimal: true,
					onChange: (value) => {
						searchValue = value;
					},
				}),
			]),
		]);

	const emptyState = () => {
		if (filteredGenerators().length > 0) {
			return null;
		}

		return m(PageEmptyState, { name: 'generators', bigMessage: generators.value.length === 0 });
	};

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
				m('div', [search(), emptyState(), generatorsByAuthor()]),
			);
		},
	};
};
