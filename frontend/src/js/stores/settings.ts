import { create } from 'xoid';

import Settings from 'js/types/settings';

import * as API from 'js/core/api';

type SettingsStore = {
	value: Settings | null;
};

const initialState: SettingsStore = {
	value: null,
};

const settings = create(initialState, (atom) => ({
	/**
	 * load loads the settings from the backend.
	 */
	load() {
		return API.exec<Settings>(API.GET_SETTINGS).then((res) => {
			atom.update((state) => {
				return {
					...state,
					value: res,
				};
			});
		});
	},
}));

// Save settings to backend when they change.
settings.subscribe((state, prev) => {
	// Don't save if we're initializing.
	if (prev.value == null && state.value != null) {
		return;
	}

	API.exec<Settings>(API.SAVE_SETTINGS, state)
		.then((res) => {
			console.log('Settings saved.');
		})
		.catch((err) => {
			console.error(err);
		});
});

export default settings;
