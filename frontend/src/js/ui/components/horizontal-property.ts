import m from 'mithril';

import { css } from 'goober';

import Flex from 'js/ui/components/layout/flex';

type HorizontalPropertyProps = {
	className?: string;
	rightClassName?: string;
	label: string;
	description: string;
	bottomBorder?: boolean;
	centered?: boolean;
};

const rightClass = css`
	width: 50%;
	max-width: 300px;
`;

export default (): m.Component<HorizontalPropertyProps> => {
	return {
		view({ attrs, children }) {
			return m(
				`div.pv2.w-100${attrs.bottomBorder ? '.bb.b--black-05.mb2' : ''}${attrs.className}`,
				{},
				m(Flex, { className: `.w-100`, justify: 'between', items: attrs.centered ? 'center' : 'start' }, [
					m('div.lh-copy', [
						m('div.f6.fw6', attrs.label), //
						m('div.text-muted.f7.fw4', attrs.description),
					]), //
					m(`div.ml4.flex-shrink-0.${rightClass}${attrs.rightClassName ?? ''}`, children),
				])
			);
		},
	};
};
