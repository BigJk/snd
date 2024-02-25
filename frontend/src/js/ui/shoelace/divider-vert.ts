import m from 'mithril';

import { css } from 'goober';

const noSpace = css`
	--spacing: 0px;
`;

type DividerProps = {
	noSpacing?: boolean;
};

export default (): m.Component<DividerProps> => ({
	view({ attrs }) {
		return m('div.flex.items-center', m(`sl-divider[vertical].${attrs.noSpacing ? noSpace : ''}`, { style: { minHeight: '15px' } }));
	},
});
