import 'css/style.scss';
import 'ionicons/dist/css/ionicons-core.css';
import 'ionicons/dist/css/ionicons.css';
import 'tachyons/css/tachyons.css';

import m from 'mithril';

import store from 'js/core/store';

import Home from 'js/ui/views/home';

// Load all the data from the backend and then start the router.
store.actions.loadAll().then(() => {
	m.route(document.body, '/', {
		'/': Home,
	});
});
