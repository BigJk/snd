import m from 'mithril';

import Base from 'js/ui/components/base';

export default (): m.Component => {
	return {
		view(vnode) {
			return m(Base, m('div', 'Hello World'));
		},
	};
};
