import 'tachyons/css/tachyons.css';

import 'ionicons/dist/css/ionicons-core.css';
import 'ionicons/dist/css/ionicons.css';

import '../css/style.scss';

// Pre-Load Settings

import api from 'core/api';
import store from 'core/store';

api.getSettings().then(settings => {
	store.set('settings', settings);
});

api.getPrinter().then(printer => {
	store.set('printer', printer);
});

api.getVersion().then(version => {
	store.set('version', version);
});

store.sub(['reload_templates'], () => {
	api.getTemplates().then(templates => {
		store.set('templates', templates ?? []);
	});
});

store.pub('reload_templates');

// Routing

import m from 'mithril';

import Settings from './ui/views/settings/index';

import Templates from './ui/views/templates/index';
import TemplatesNew from './ui/views/templates/new';
import TemplatesEdit from './ui/views/templates/edit';

import Template from './ui/views/templates/template/index';
import TemplateEdit from './ui/views/templates/template/edit';
import TemplateNew from './ui/views/templates/template/new';

import Scripts from './ui/views/scripts/index';
import ScriptsNew from './ui/views/scripts/new';
import ScriptsEdit from './ui/views/scripts/edit';

import USB from './ui/views/usb/index';

m.route(document.getElementById('app'), '/', {
	'/': Templates,
	'/templates': Templates,
	'/templates/new': TemplatesNew,
	'/templates/:id': Template,
	'/templates/:id/edit': TemplatesEdit,
	'/templates/:id/edit/:eid': TemplateEdit,
	'/templates/:id/new': TemplateNew,
	'/scripts': Scripts,
	'/scripts/new': ScriptsNew,
	'/scripts/:id': ScriptsEdit,
	'/settings': Settings,
	'/usb': USB
});

if (module.hot) {
	module.hot.accept(function() {
		setTimeout(function() {
			location.reload();
		}, 300);
	});
}
