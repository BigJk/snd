import m from 'mithril';

import { groupBy, map } from 'lodash-es';

import { css } from 'goober';

import { buildId } from 'js/types/basic-info';
import Generator, { sanitizeConfig } from 'js/types/generator';

import { generators } from 'js/core/store';

import Button from 'js/ui/spectre/button';
import Input from 'js/ui/spectre/input';

import Icon from 'js/ui/components/atomic/icon';
import Title from 'js/ui/components/atomic/title';
import Flex from 'js/ui/components/layout/flex';
import Grid from 'js/ui/components/layout/grid';
import PrintPreviewTemplate from 'js/ui/components/print-preview-template';
import Base from 'js/ui/components/view-layout/base';

const generatorElementStyle = css`
	max-width: 500px;
	transition: transform 0.15s ease-in-out;

	&:hover {
		transform: scale(1.02);

		.info {
			border-color: var(--col-primary);
		}

		.generator {
			border-left-color: var(--col-primary);
			border-top-color: var(--col-primary);
			border-bottom-color: var(--col-primary);
		}
	}
`;

export default (): m.Component => {
	let searchValue = '';

	const authorGroupTitle = (author: string) => {
		return m('div', [
			m('div.text-muted.f8.fw5.ttu.mb1', 'Generator by'), //
			m(Title, author), //
		]);
	};

	const generatorCount = (length: number) => m('div.f8.fw5.ttu.mb1.text-muted', `${length} Generators`);

	const generatorElement = (generator: Generator) => {
		let key = buildId('generator', generator);

		return m(
			'div',
			{
				onclick: () => {
					m.route.set(`/generator/${buildId('generator', generator)}`);
				},
			},
			m(Flex, { className: `.pointer.${generatorElementStyle}`, key }, [
				m(PrintPreviewTemplate, {
					key: key + '.preview',
					className: '.template.pointer.no-mouse-events.bg-black-05.ph1.ba.b--black-10.overflow-auto.flex-shrink-0',
					generator: generator,
					config: sanitizeConfig(generator, {}),
					width: 150,
				}),
				m(
					'div.info.bg-black-01.w-100.bt.br.bb.b--black-05.lh-copy.overflow-auto',
					{ key: key + '.info' },
					m('div.ph2.pv1.overflow-auto', [
						m('div.f6.fw5', generator.name), //
						m('div.f8.ttu.fw5.text-muted.mb2.pb2.bb.b--black-05', `By ${generator.author}`), //
						m('div.f8.fw5.break-word', generator.description), //
					])
				),
			])
		);
	};

	const generatorsByAuthor = () => {
		return map(
			groupBy(
				generators.value.filter((generator) => {
					return (
						generator.name.toLowerCase().includes(searchValue.toLowerCase()) || generator.author.toLowerCase().includes(searchValue.toLowerCase())
					);
				}),
				'author'
			),
			(generators, author) => {
				return m('div.bg-white.br2.ph3.mb3.ba.b--black-10', [
					m(Flex, { justify: 'between', className: '.mv3.bb.b--black-10.pb3' }, [
						authorGroupTitle(author), //
						generatorCount(generators.length), //
					]), //
					m(Grid, { className: '.mb3', minWidth: '350px', maxWidth: '1fr' }, generators.map(generatorElement)),
				]);
			}
		);
	};

	const search = () => {
		return m('div.bg-white.mb3.br2.ba.b--black-10.pa3', [
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
	};

	return {
		view(vnode) {
			return m(
				Base,
				{
					title: m(Title, 'Templates'),
					active: 'generators',
					classNameContainer: '.pa3',
					rightElement: m('div', [
						m(Button, { link: '/generator/create' }, 'Create'), //
					]),
				},
				m('div', [search(), generatorsByAuthor()])
			);
		},
	};
};
