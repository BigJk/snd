import 'tachyons/css/tachyons.css';

import 'ionicons/dist/css/ionicons-core.css';
import 'ionicons/dist/css/ionicons.css';

import 'spectre.css/dist/spectre.css';
import 'spectre.css/dist/spectre-icons.css';
import 'spectre.css/dist/spectre-exp.css';

import '../css/style.css';

import m from 'mithril';

import Home from './ui/views/home';
import Scripts from './ui/views/scripts';
import Settings from './ui/views/settings';

m.route(document.getElementById('app'), '/', {
	'/': Home,
	'/scripts': Scripts,
	'/settings': Settings
});

if (module.hot) {
	module.hot.accept(function() {
		setTimeout(function() {
			location.reload();
		}, 300);
	});
}
