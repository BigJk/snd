import m from 'mithril';

import SideNav from 'js/ui/components/side-nav';

export default (): m.Component => {
	return {
		view(vnode) {
			return m('div.w-100.h-100.flex', [m(SideNav), m('div', 'Hello World')]);
		},
	};
};
