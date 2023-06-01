import { create } from 'xoid';

import Template from 'js/types/settings';

import * as API from 'js/core/api';

type TemplatesStore = {
	templates: Template[] | null;
};

const initialState: TemplatesStore = {
	templates: null,
};

const settings = create(initialState, (atom) => ({
	/**
	 * load loads the settings from the backend.
	 */
	load() {
		return API.exec<Template[]>(API.GET_TEMPLATES).then((res) => {
			atom.update((state) => {
				return {
					...state,
					templates: res,
				};
			});
		});
	},
}));

export default settings;
