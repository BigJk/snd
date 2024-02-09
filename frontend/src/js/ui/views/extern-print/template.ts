import m from 'mithril';

import Template from 'js/types/template';
import * as API from 'js/core/api';
import { settings } from 'js/core/store';
import { render } from 'js/core/templating';

type ExternPrintProps = {
	id: string;
	json: string;
	tmpl: string;
	config: string;
};

type ExternPrintState = {
	id: string;
	json: any;
	tmpl: string | null;
};

export default (): m.Component<ExternPrintProps> => {
	const state: ExternPrintState = {
		id: '',
		json: null,
		tmpl: null,
	};

	return {
		oninit({ attrs }) {
			state.id = attrs.id;
			state.json = JSON.parse(atob(attrs.json));
			state.tmpl = attrs.tmpl;

			API.exec<Template>(API.GET_TEMPLATE, state.id)
				.then((tmpl) => {
					render(tmpl.printTemplate, { it: state.json, images: tmpl.images, config: JSON.parse(atob(attrs.config)), settings: settings.value })
						.then((res) => {
							state.tmpl = res;
						})
						.catch((err) => {
							state.tmpl = 'Template Error: ' + err;
						})
						.finally(m.redraw);
				})
				.catch((err) => {
					state.tmpl = 'Template Error: ' + err;
					m.redraw();
				});
		},
		view({ attrs }) {
			if (!state.tmpl) {
				return m('div');
			}
			return m('div', { id: 'render-done' }, m.trust(state.tmpl));
		},
	};
};
