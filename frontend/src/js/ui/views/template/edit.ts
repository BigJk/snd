import m from 'mithril';

import Base from 'js/ui/components/base';
import Title from 'js/ui/components/title';

export default (): m.Component => {
	return {
		view(vnode) {
			return m(Base, { title: m(Title, 'Edit Template'), active: 'templates', classNameContainer: '.pa3' }, m('div', []));
		},
	};
};
