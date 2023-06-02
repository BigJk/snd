import m from 'mithril';

import store from 'js/core/store';

import Select from 'js/ui/spectre/select';

import Base from 'js/ui/components/base';
import Title from 'js/ui/components/title';

export default (): m.Component => {
	return {
		view(vnode) {
			return m(
				Base,
				{ title: m(Title, 'Devices'), active: 'devices', classNames: '.pa3' },
				m(
					'div.mw5',
					m(Select, {
						keys: Object.keys(store.value.printer).filter((k) => Object.keys(store.value.printer[k]).length > 0),
						selected: null,
						oninput: (e) => {
							console.log(e);
						},
					})
				)
			);
		},
	};
};
