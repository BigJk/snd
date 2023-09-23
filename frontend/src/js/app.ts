import 'css/style.scss';
import 'ionicons/dist/css/ionicons-core.css';
import 'ionicons/dist/css/ionicons.css';
import 'tachyons/css/tachyons.css';
import 'tippy.js/dist/tippy.css';

import m from 'mithril';

import store, { settings } from 'js/core/store';

import Spotlight from 'js/ui/components/portal/spotlight';

import Devices from 'js/ui/views/devices';
import GeneratorAll from 'js/ui/views/generator/all';
import GeneratorSingle from 'js/ui/views/generator/single';
import Home from 'js/ui/views/home';
import Settings from 'js/ui/views/settings';
import TemplateAll from 'js/ui/views/template/all';
import TemplateCreate from 'js/ui/views/template/create';
import TemplateEdit from 'js/ui/views/template/edit';
import TemplateSingle from 'js/ui/views/template/single';

import * as Portal from 'js/ui/portal';
import * as Toast from 'js/ui/toast';

// Load all the data from the backend and then start the router.
store.actions.loadAll().then(() => {
	console.log('Store initialized:', store.value);

	// Save settings when they change.
	settings.subscribe((state) => {
		if (!state) return;

		store.actions
			.saveSettings()
			.then(() => Toast.success('Settings saved successfully.'))
			.catch((e) => {
				Toast.error(e);
				console.error('Failed to save settings:', e);
			});
	});

	m.route(document.getElementById('app') ?? document.body, '/', {
		'/': Home,
		'/devices': Devices,
		'/settings': Settings,
		'/template': TemplateAll,
		'/template/create': TemplateCreate,
		'/template/:id': TemplateSingle,
		'/template/:id/edit': TemplateEdit,
		'/generator': GeneratorAll,
		'/generator/:id': GeneratorSingle,
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
