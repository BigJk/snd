import m from 'mithril';

import { css } from 'goober';

import { buildId } from 'js/types/basic-info';
import Generator from 'js/types/generator';
import Template from 'js/types/template';

import Flex from 'js/ui/components/layout/flex';
import PrintPreviewTemplate from 'js/ui/components/print-preview-template';
import { PrintPreviewTemplateProps } from 'js/ui/components/print-preview-template';

const style = css`
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

type TemplateBoxProps = PrintPreviewTemplateProps & {
	onClick?: () => void;
};

export default (): m.Component<TemplateBoxProps> => {
	let key = Math.ceil(Math.random() * 1000000000).toString();

	const cutDescription = (description: string) => {
		if (description.length > 100) {
			return description.substring(0, 100) + '...';
		}
		return description;
	};

	return {
		oninit({ attrs }) {
			if (attrs.template) {
				key = buildId('template', attrs.template);
			} else if (attrs.generator) {
				key = buildId('generator', attrs.generator);
			}
		},
		view({ attrs }) {
			let templateOrGenerator: Template | Generator | undefined = attrs.template;
			if (!templateOrGenerator) {
				templateOrGenerator = attrs.generator;
			}
			if (!templateOrGenerator) return;

			return m(
				'div',
				{
					onclick: attrs.onClick,
				},
				m(Flex, { className: `.pointer.${style}`, key }, [
					m(PrintPreviewTemplate, {
						...attrs,
						key: key + '.preview',
						className: '.template.pointer.no-mouse-events.bg-black-05.ph1.ba.b--black-10.overflow-auto.flex-shrink-0',
						width: 150,
						hideAiNotice: true,
					}),
					m(
						'div.info.bg-black-01.w-100.bt.br.bb.b--black-05.lh-copy.overflow-auto',
						{ key: key + '.info' },
						m('div.ph2.pv1.overflow-auto', [
							m('div.f6.fw5', templateOrGenerator.name), //
							m('div.f8.ttu.fw5.text-muted.mb2.pb2.bb.b--black-05', `By ${templateOrGenerator.author}`), //
							m('div.f8.fw5.break-word', cutDescription(templateOrGenerator.description)), //
						])
					),
				])
			);
		},
	};
};
