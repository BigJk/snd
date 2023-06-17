import m from 'mithril';

import Title from 'js/ui/components/atomic/title';
import Base from 'js/ui/components/view-layout/base';

const SettingsGridStyle = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 100%))',
	gridGap: '1rem',
};

export default (): m.Component => {
	return {
		view(vnode) {
			return m(Base, { title: m(Title, 'Settings'), active: 'settings', classNameContainer: '.pa3' }, m('div', { style: SettingsGridStyle }, []));
		},
	};
};
