import m from 'mithril';

import Logo from 'js/ui/components/logo';

export default (): m.Component => {
	return {
		view(vnode) {
			return m('div.grid-bg', { style: { width: '90px' } }, m('div.flex.flex-column.items-center.pt3', [m(Logo)]));
		},
	};
};
