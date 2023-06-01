import 'ionicons/dist/css/ionicons-core.css';
import 'ionicons/dist/css/ionicons.css';
import 'tachyons/css/tachyons.css';

import m from 'mithril';

import SettingStore from 'js/stores/settings';
import TemplatesStore from 'js/stores/templates';

TemplatesStore.subscribe((state) => {
	console.log(state);
});

SettingStore.actions.load();
TemplatesStore.actions.load();

const TestComp = (): m.Component => {
	return {
		view(vnode: m.Vnode) {
			return m('div', 'Hello World');
		},
	};
};

m.route(document.body, '/', {
	'/': TestComp,
	'/about': TestComp,
});
