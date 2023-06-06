import 'css/dropdown.scss';
import 'css/style.scss';
import 'ionicons/dist/css/ionicons-core.css';
import 'ionicons/dist/css/ionicons.css';
import 'tachyons/css/tachyons.css';
import 'tippy.js/dist/tippy.css';

import m from 'mithril';

import store from 'js/core/store';

import Devices from 'js/ui/views/devices';
import Home from 'js/ui/views/home';

// Load all the data from the backend and then start the router.
store.actions.loadAll().then(() => {
	console.log(store.value);

	m.route(document.getElementById('app') ?? document.body, '/', {
		'/': Home,
		'/devices': Devices,
	});
});
