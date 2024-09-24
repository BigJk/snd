import 'ionicons/dist/css/ionicons-core.css';
import 'ionicons/dist/css/ionicons.css';
import 'tachyons/css/tachyons.css';
import 'tippy.js/dist/tippy.css';
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/shoelace.js';
import 'css/style.scss';

import m from 'mithril';

import store, { settings } from 'js/core/store';

import Spotlight from 'js/ui/components/portal/spotlight';

import DataSourceAll from 'js/ui/views/data-source/all';
import DataSourceSingle from 'js/ui/views/data-source/single';
import Devices from 'js/ui/views/devices';
import ExternPrintGenerator from 'js/ui/views/extern-print/generator';
import ExternPrintTemplate from 'js/ui/views/extern-print/template';
import GeneratorAll from 'js/ui/views/generator/all';
import GeneratorCreate from 'js/ui/views/generator/create';
import GeneratorEdit from 'js/ui/views/generator/edit';
import GeneratorSingle from 'js/ui/views/generator/single';
import Home from 'js/ui/views/home';
import SessionGrid from 'js/ui/views/session-grid';
import Settings from 'js/ui/views/settings';
import TemplateAll from 'js/ui/views/template/all';
import TemplateCreate from 'js/ui/views/template/create';
import TemplateCreateEntity from 'js/ui/views/template/create-entity';
import TemplateEdit from 'js/ui/views/template/edit';
import TemplateSingle from 'js/ui/views/template/single';
import WorkshopAll from 'js/ui/views/workshop/all';
import WorkshopRepo from 'js/ui/views/workshop/repo';
import WorkshopSingle from 'js/ui/views/workshop/single';

import * as Portal from 'js/ui/portal';
import * as Toast from 'js/ui/toast';

// Load all the data from the backend and then start the router.
store.actions.loadAll().then(() => {
	store.actions.setRandomAIToken();
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
		'/template/create/:id': TemplateCreate,
		'/template/:id': TemplateSingle,
		'/template/:id/edit': TemplateEdit,
		'/template/:id/create': TemplateCreateEntity,
		'/template/:id/edit/:eid': TemplateCreateEntity,
		'/generator': GeneratorAll,
		'/generator/create': GeneratorCreate,
		'/generator/create/:id': GeneratorCreate,
		'/generator/:id': GeneratorSingle,
		'/generator/:id/edit': GeneratorEdit,
		'/session-grid': SessionGrid,
		'/data-source': DataSourceAll,
		'/data-source/:id': DataSourceSingle,
		'/workshop': WorkshopAll,
		'/workshop/:id': WorkshopSingle,
		'/workshop/:id/:repo': WorkshopRepo,
		'/extern-print/template/:id/:json/:config': ExternPrintTemplate,
		'/extern-print/generator/:id/:config': ExternPrintGenerator,
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
			Portal.popPortal();
		}
	});
});
