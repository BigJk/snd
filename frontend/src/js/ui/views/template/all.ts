import m from 'mithril';

import { groupBy, map } from 'lodash-es';

import { css } from 'goober';

import { templates } from 'js/core/store';

import Button from 'js/ui/spectre/button';

import Title from 'js/ui/components/atomic/title';
import Flex from 'js/ui/components/layout/flex';
import Grid from 'js/ui/components/layout/grid';
import PrintPreviewTemplate from 'js/ui/components/print-preview-template';
import Base from 'js/ui/components/view-layout/base';

const templateElementStyle = css`
	max-width: 500px;
	transition: transform 0.15s ease-in-out;

	&:hover {
		transform: scale(1.02);

		.info {
			border-color: var(--col-primary);
		}

		.template {
			border-left-color: var(--col-primary);
			border-top-color: var(--col-primary);
			border-bottom-color: var(--col-primary);
		}
	}
`;

export default (): m.Component => {
	return {
		view(vnode) {
			return m(
				Base,
				{
					title: m(Title, 'Templates'),
					active: 'templates',
					classNameContainer: '.pa3',
					rightElement: m('div', [
						m(Button, { link: '/templates/create' }, 'Create'), //
					]),
				},
				m(
					'div',
					map(groupBy(templates.value, 'author'), (templates, author) => {
						return m('div.bg-white.ph3.mb3.ba.b--black-10', [
							m('div.mv3.bb.b--black-10.pb3', [
								m('div.text-muted.f8.fw5.ttu.mb1', 'Templates by'), //
								m(Title, { className: '' }, author), //
							]), //
							m(
								Grid,
								{ className: '.mb3', minWidth: '350px', maxWidth: '1fr' },
								templates.map((template) =>
									m(Flex, { className: `.pointer.${templateElementStyle}` }, [
										m(PrintPreviewTemplate, {
											className: '.template.pointer.no-mouse-events.bg-black-05.ph1.ba.b--black-10',
											template: template,
											width: 150,
										}),
										m(
											'div.info.bg-black-01.w-100.bt.br.bb.b--black-05.lh-copy',
											m('div.ph2.pv1', [
												m('div.f6.fw5', template.name), //
												m('div.f8.ttu.fw5.text-muted.mb2.pb2.bb.b--black-05', `By ${template.author}`), //
												m('div.f8.fw5', template.description), //
											])
										),
									])
								)
							),
						]);
					})
				)
			);
		},
	};
};
