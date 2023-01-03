import '/css/dropdown.scss';
import '/css/style.scss';
import 'highlight.js/styles/default.css';
import 'ionicons/dist/css/ionicons-core.css';
import 'ionicons/dist/css/ionicons.css';
import 'tachyons/css/tachyons.css';
import 'tippy.js/dist/tippy.css';

import m from 'mithril';

import { setSpellcheckerLanguages } from '/js/electron';

import api from '/js/core/api';
import store from '/js/core/store';

import DataSources from '/js/ui/views/data-sources';
import DataSource from '/js/ui/views/data-sources/data-source';
import Devices from '/js/ui/views/devices';
import ExternPrintGenerator from '/js/ui/views/extern-print/generator';
import ExternPrintTemplate from '/js/ui/views/extern-print/template';
import GeneratorsEdit from '/js/ui/views/generators/edit';
import Generator from '/js/ui/views/generators/generator';
import Generators from '/js/ui/views/generators/index';
import GeneratorsNew from '/js/ui/views/generators/new';
import Help from '/js/ui/views/help';
import Settings from '/js/ui/views/settings';
import Templates from '/js/ui/views/templates';
import TemplatesEdit from '/js/ui/views/templates/edit';
import TemplatesNew from '/js/ui/views/templates/new';
import Template from '/js/ui/views/templates/template';
import TemplateEdit from '/js/ui/views/templates/template/edit';
import TemplateNew from '/js/ui/views/templates/template/new';
import Workshop from '/js/ui/views/workshop';
import WorkshopRepo from '/js/ui/views/workshop/repo';

// Mithril Fragment workaround

m.Fragment = { view: (vnode) => vnode.children };

// Hot-Reload

if (import.meta.hot) {
	import.meta.hot.accept((newModule) => {
		if (newModule) {
			window.location.reload();
		}
	});
}

// Pre-Load Settings

api.getPrinter().then((printer) => {
	store.set('printer', printer);
});

api.getVersion().then((version) => {
	store.set('version', version);
});

store.sub(['reload_templates'], () => {
	api.getTemplates().then((templates) => {
		store.set('templates', templates ?? []);
	});
});

store.sub(['reload_generators'], () => {
	api.getGenerators().then((generators) => {
		store.set('generators', generators ?? []);
	});
});

store.sub(['reload_sources'], () => {
	api.getSources().then((sources) => {
		store.set('sources', sources ?? []);
	});
});

store.sub(['reload_settings'], () => {
	api.getSettings().then((settings) => {
		store.set('settings', settings);
		setSpellcheckerLanguages(settings.spellcheckerLanguages);
	});
});

store.sub(['reload_public_packages'], () => {
	api.getPublicPackages().then((packages) => {
		store.set('publicPackages', packages ?? []);
	});
});

store.sub(['reload_new_version'], () => {
	api
		.newVersion()
		.then((newVersion) => {
			store.set('newVersion', newVersion);
		})
		.catch((err) => {
			console.log(err);
			store.set('newVersion', false);
		});
});

store.pub('reload_settings');
store.pub('reload_templates');
store.pub('reload_generators');
store.pub('reload_sources');
store.pub('reload_public_packages');
store.pub('reload_new_version');

// Wait for settings to populate and then mount

let wait = setInterval(() => {
	if (Object.keys(store.data).some((p) => store.data[p] === null)) {
		return;
	}

	m.route(document.getElementById('app'), '/', {
		'/': Templates,
		'/templates': Templates,
		'/templates/new': TemplatesNew,
		'/templates/dupe/:id': TemplatesNew,
		'/templates/:id': Template,
		'/templates/:id/edit': TemplatesEdit,
		'/templates/:id/edit/:eid': TemplateEdit,
		'/templates/:id/new': TemplateNew,
		'/generators': Generators,
		'/generators/new': GeneratorsNew,
		'/generators/dupe/:id': GeneratorsNew,
		'/generators/:id/edit': GeneratorsEdit,
		'/generators/:id': Generator,
		'/workshop': Workshop,
		'/workshop/:id': WorkshopRepo,
		'/help': Help,
		'/data-sources': DataSources,
		'/data-sources/:id': DataSource,
		'/settings': Settings,
		'/devices': Devices,
		'/extern-print/template/:id/:json': ExternPrintTemplate,
		'/extern-print/generator/:id/:json': ExternPrintGenerator,
	});

	clearInterval(wait);
}, 100);
