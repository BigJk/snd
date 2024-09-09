import m from 'mithril';

import Generator, { sanitizeConfig } from 'js/types/generator';
import * as API from 'js/core/api';
import { settings } from 'js/core/store';
import { render } from 'js/core/templating';

type ExternPrintProps = {
	id: string;
	json: string;
	gen: string;
	config: string;
};

type ExternPrintState = {
	id: string;
	json: any;
	gen: string | null;
};

export default (): m.Component<ExternPrintProps> => {
	const state: ExternPrintState = {
		id: '',
		json: null,
		gen: null,
	};

	return {
		oninit({ attrs }) {
			state.id = attrs.id;
			state.gen = attrs.gen;

			API.exec<Generator>(API.GET_GENERATOR, state.id)
				.then((gen) => {
					render(gen.printTemplate, {
						sources: gen.dataSources,
						images: gen.images,
						config: sanitizeConfig(gen, JSON.parse(atob(attrs.config))),
						settings: settings.value,
					})
						.then((res) => {
							state.gen = res;
						})
						.catch((err) => {
							state.gen = 'Generator Error: ' + err;
						})
						.finally(m.redraw);
				})
				.catch((err) => {
					state.gen = 'Generator Error: ' + err;
					m.redraw();
				});
		},
		view({ attrs }) {
			if (!state.gen) {
				return m('div');
			}
			return m('div', { id: 'render-done' }, m.trust(state.gen));
		},
	};
};
