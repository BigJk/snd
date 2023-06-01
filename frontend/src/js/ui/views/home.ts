import m from 'mithril';

import Base from 'js/ui/components/base';
import Hero from 'js/ui/components/hero';

export default (): m.Component => {
	return {
		view(vnode) {
			return m(Base, { active: 'dashboard', classNames: '.pa3' }, m('div', m(Hero)));
		},
	};
};
