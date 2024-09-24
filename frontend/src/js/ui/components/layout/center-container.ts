import m from 'mithril';

import { css } from 'goober';

import Flex from 'js/ui/components/layout/flex';

const containerClass = css`
	max-width: 800px;
	width: 100%;
`;

type CenterContainerProps = {
	key?: string;
};

export default (): m.Component<CenterContainerProps> => ({
	view: ({ attrs, children }) => m(Flex, { key: attrs.key, justify: 'center' }, m(`div.${containerClass}`, { key: attrs.key }, children)),
});
