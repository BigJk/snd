import m from 'mithril';

import { css } from 'goober';

import BasicInfo, { buildId } from 'js/types/basic-info';
import DataSource from 'js/types/data-source';
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

type DataSourceBoxProps = {
	source: DataSource;
	onClick?: () => void;
};

export default (): m.Component<DataSourceBoxProps> => {
	let key = Math.ceil(Math.random() * 1000000000).toString();

	const cutDescription = (description: string) => {
		if (description.length > 100) {
			return description.substring(0, 100) + '...';
		}
		return description;
	};

	return {
		oninit({ attrs }) {
			key = buildId('source', attrs.source);
		},
		view({ attrs }) {
			return m(
				'div',
				{
					onclick: attrs.onClick,
				},
				m(Flex, { className: `.pointer.${style}`, key }, [
					m(
						'div.info.bg-black-01.w-100.ba.b--black-05.lh-copy.overflow-auto',
						{ key: key + '.info' },
						m('div.ph2.pv1.overflow-auto', [
							m(Flex, { className: '.mb2.pb2.bb.b--black-05', justify: 'between' }, [
								m('div.b', attrs.source.name), //
								m('div.text-muted', attrs.source.count),
							]), //
							m('div.f8.fw5.break-word', cutDescription(attrs.source.description)),
						]),
					),
				]),
			);
		},
	};
};
