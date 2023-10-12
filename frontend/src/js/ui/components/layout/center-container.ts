import m from 'mithril';
import { css } from 'goober';
import Flex from 'js/ui/components/layout/flex';

const containerClass = css`
	max-width: 800px;
	width: 100%;
`;

export default (): m.Component => ({
	view: ({ children }) => m(Flex, { justify: 'center' }, m(`div.${containerClass}`, children)),
});
