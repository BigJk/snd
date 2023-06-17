import m from 'mithril';

import Flex from 'js/ui/components/layout/flex';

export default (): m.Component => {
	return {
		view({ attrs, children }) {
			return m(Flex, { className: '.w-100', items: 'center', justify: 'center' }, children);
		},
	};
};
