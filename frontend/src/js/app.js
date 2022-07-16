import 'tachyons/css/tachyons.css';
import 'tippy.js/dist/tippy.css';
import 'ionicons/dist/css/ionicons-core.css';
import 'ionicons/dist/css/ionicons.css';
import 'highlight.js/styles/default.css';

import '/css/style.scss';

// Mithril Fragment workaround

import m from 'mithril';
m.Fragment = { view: (vnode) => vnode.children };

// Pre-Load Settings

import api from '/js/core/api';
import store from '/js/core/store';
import { setSpellcheckerLanguages } from '/js/electron';

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

store.pub('reload_settings');
store.pub('reload_templates');
store.pub('reload_sources');

// Routing

import Settings from '/js/ui/views/settings';

import Templates from '/js/ui/views/templates';
import TemplatesNew from '/js/ui/views/templates/new';
import TemplatesEdit from '/js/ui/views/templates/edit';

import Template from '/js/ui/views/templates/template';
import TemplateEdit from '/js/ui/views/templates/template/edit';
import TemplateNew from '/js/ui/views/templates/template/new';

import Help from '/js/ui/views/help';

import DataSources from '/js/ui/views/data-sources';

import Devices from '/js/ui/views/devices';

import ExternPrint from '/js/ui/views/extern-print';

m.route(document.getElementById('app'), '/', {
	'/': Templates,
	'/templates': Templates,
	'/templates/new': TemplatesNew,
	'/templates/:id': Template,
	'/templates/:id/edit': TemplatesEdit,
	'/templates/:id/edit/:eid': TemplateEdit,
	'/templates/:id/new': TemplateNew,
	'/help': Help,
	'/data-sources': DataSources,
	'/settings': Settings,
	'/devices': Devices,
	'/extern-print/:id/:json': ExternPrint,
});
