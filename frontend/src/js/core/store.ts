import { create } from 'xoid';

import DataSource from 'js/types/data-source';
import Generator from 'js/types/generator';
import Printer from 'js/types/printer';
import PublicList from 'js/types/public-list';
import Settings from 'js/types/settings';
import Template from 'js/types/template';

import * as API from 'js/core/api';

type Store = {
	settings: Settings | null;
	templates: Template[] | null;
	generators: Generator[] | null;
	sources: DataSource[] | null;
	printer: Record<string, Printer>;
	publicLists: PublicList[] | null;
};

const initialState: Store = {
	settings: null,
	templates: null,
	generators: null,
	sources: null,
	printer: {},
	publicLists: null,
};

const store = create(initialState, (atom) => ({
	/**
	 * loadAll loads all the data from the backend.
	 */
	loadAll() {
		return Promise.all([
			this.loadSettings(),
			this.loadTemplates(),
			this.loadGenerators(),
			this.loadSources(),
			this.loadPrinter(),
			this.loadPublicList(),
		]);
	},

	/**
	 * loadSettings loads the settings from the backend.
	 */
	loadSettings() {
		return API.exec<Template[]>(API.GET_TEMPLATES).then((res) => {
			atom.update((state) => {
				return {
					...state,
					templates: res,
				};
			});
		});
	},

	/**
	 * saveSettings saves the settings to the backend.
	 */
	saveSettings() {
		return API.exec<Settings>(API.SAVE_SETTINGS, atom.value.settings);
	},

	/**
	 * loadGenerators loads the generators from the backend.
	 */
	loadGenerators() {
		return API.exec<Generator[]>(API.GET_GENERATORS).then((res) => {
			atom.update((state) => {
				return {
					...state,
					generators: res,
				};
			});
		});
	},

	/**
	 * loadSources loads the sources from the backend.
	 */
	loadSources() {
		return API.exec<DataSource[]>(API.GET_SOURCES).then((res) => {
			atom.update((state) => {
				return {
					...state,
					sources: res,
				};
			});
		});
	},

	/**
	 * loadPrinter loads the printer from the backend.
	 */
	loadPrinter() {
		return API.exec<Record<string, Printer>>(API.GET_AVAILABLE_PRINTER).then((res) => {
			atom.update((state) => {
				return {
					...state,
					printer: res,
				};
			});
		});
	},

	/**
	 * loadPublicList loads the packages from the backend.
	 */
	loadPublicList() {
		return API.exec<PublicList[]>(API.GET_PUBLIC_LIST).then((res) => {
			atom.update((state) => {
				return {
					...state,
					packages: res,
				};
			});
		});
	},

	/**
	 * loadTemplates loads the templates from the backend.
	 */
	loadTemplates() {
		return API.exec<Settings>(API.GET_SETTINGS).then((res) => {
			atom.update((state) => {
				return {
					...state,
					settings: res,
				};
			});
		});
	},
}));

// Export the global store.
export default store;

// Export the individual stores.
export const settings = store.focus('settings');
export const templates = store.focus('templates');
export const generators = store.focus('generators');
export const sources = store.focus('sources');
export const printer = store.focus('printer');
export const packages = store.focus('publicLists');
