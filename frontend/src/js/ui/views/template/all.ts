import m from 'mithril';

import Button from 'js/ui/spectre/button';

import Title from 'js/ui/components/atomic/title';
import Base from 'js/ui/components/view-layout/base';

export default (): m.Component => {
	return {
		view(vnode) {
			return m(
				Base,
				{
					title: m(Title, 'Templates'),
					active: 'templates',
					classNameContainer: '.pa3',
					rightElement: m('div', [
						m(Button, { link: '/templates/create' }, 'Create'), //
					]),
				},
				m('div', [])
			);
		},
	};
};