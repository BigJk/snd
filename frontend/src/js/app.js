import 'tachyons/css/tachyons.css';

import 'ionicons/dist/css/ionicons-core.css';
import 'ionicons/dist/css/ionicons.css';

import '/css/style.scss';

// Mithril Fragment workaround

import m from 'mithril';
m.Fragment = { view: (vnode) => vnode.children };

// Pre-Load Settings

import api from '/js/core/api';
import store from '/js/core/store';

api.getSettings().then((settings) => {
	store.set('settings', settings);
});

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

store.pub('reload_templates');

// Routing

import Settings from '/js/ui/views/settings';

import Templates from '/js/ui/views/templates';
import TemplatesNew from '/js/ui/views/templates/new';
import TemplatesEdit from '/js/ui/views/templates/edit';

import Template from '/js/ui/views/templates/template';
import TemplateEdit from '/js/ui/views/templates/template/edit';
import TemplateNew from '/js/ui/views/templates/template/new';

import Scripts from '/js/ui/views/scripts';
import ScriptsNew from '/js/ui/views/scripts/new';
import ScriptsEdit from '/js/ui/views/scripts/edit';

import Devices from '/js/ui/views/devices';

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
	'/devices': Devices,
});

if (module.hot) {
	module.hot.accept(function () {
		setTimeout(function () {
			location.reload();
		}, 300);
	});
}
