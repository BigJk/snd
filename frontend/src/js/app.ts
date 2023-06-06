import 'css/dropdown.scss';
import 'css/style.scss';
import 'ionicons/dist/css/ionicons-core.css';
import 'ionicons/dist/css/ionicons.css';
import 'tachyons/css/tachyons.css';
import 'tippy.js/dist/tippy.css';

import m from 'mithril';

import store from 'js/core/store';

import Spotlight from 'js/ui/components/spotlight';

import Devices from 'js/ui/views/devices';
import Home from 'js/ui/views/home';

// Init portal
import * as Portal from 'js/ui/portal';

// Load all the data from the backend and then start the router.
store.actions.loadAll().then(() => {
	console.log('Store initalized:', store.value);

	m.route(document.getElementById('app') ?? document.body, '/', {
		'/': Home,
		'/devices': Devices,
	});

	document.addEventListener('keydown', (e) => {
		// Create CMD+O / CTRL+O shortcut to open spotlight.
		if (e.key === 'o' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			Portal.setPortal(Spotlight, {
				className: '.mt5',
				items: 'start',
			});
		}

		// Create ESC shortcut to close spotlight.
		if (Portal.hasPortal() && e.key === 'Escape') {
			e.preventDefault();
			Portal.clearPortal();
		}
	});
});
