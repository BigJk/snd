import { flatten } from 'lodash-es';

import Fuse from 'fuse.js';
import { create } from 'xoid';

import BasicInfo, { buildId } from 'js/types/basic-info';
import DataSource from 'js/types/data-source';
import Generator from 'js/types/generator';
import Printer from 'js/types/printer';
import PublicList from 'js/types/public-list';
import Settings, { createEmptySettings } from 'js/types/settings';
import Template from 'js/types/template';
import * as Version from 'js/types/version';
import * as API from 'js/core/api';
import { Operations, SpotlightOperation } from 'js/core/spotlight-operations';

export type FuseSearch = {
	type: 'template' | 'generator' | 'source' | 'operation';
	id?: string;
	template?: Template;
	generator?: Generator;
	source?: DataSource;
	operation?: SpotlightOperation;
};

const FuseKeys = flatten<string[]>(
	['template', 'generator', 'source', 'operation'].map((key) => [`${key}.name`, `${key}.description`, `${key}.author`, `${key}.slug`]),
);

const toFuseSearch = (
	type: 'template' | 'generator' | 'source' | 'operation',
	item: Template | Generator | DataSource | SpotlightOperation,
): FuseSearch => {
	let id = '';
	switch (type) {
		case 'template':
		case 'generator':
		case 'source':
			id = buildId(type, item as BasicInfo);
	}

	return {
		type,
		id,
		[type]: item,
	};
};

type Store = {
	settings: Settings;
	templates: Template[];
	generators: Generator[];
	sources: DataSource[];
	printer: Record<string, Printer>;
	printerTypes: Record<string, string>;
	publicLists: PublicList[];
	version: {
		current: Version.LocalVersion | null;
		latest: Version.NewVersion | null;
	};
	fuzzySearch: Fuse<FuseSearch> | null;
	ai: {
		token: string;
	};
};

const initialState: Store = {
	settings: createEmptySettings(),
	templates: [],
	generators: [],
	sources: [],
	printer: {},
	printerTypes: {},
	publicLists: [],
	version: {
		current: null,
		latest: null,
	},
	fuzzySearch: null,
	ai: {
		token: '',
	},
};

const store = create(initialState, (atom) => ({
	/**
	 * LoadAll loads all the data from the backend.
	 */
	loadAll(noSettings: boolean = false) {
		return Promise.all([
			...(noSettings ? [] : [this.loadSettings()]),
			this.loadTemplates(),
			this.loadGenerators(),
			this.loadSources(),
			this.loadPrinter(),
			this.loadPrinterTypes(),
			this.loadPublicList(),
			this.loadVersion(),
		]);
	},

	/**
	 * LoadSettings loads the settings from the backend.
	 */
	loadSettings() {
		return API.exec<Settings>(API.GET_SETTINGS).then((res) => {
			atom.update((state) => ({
				...state,
				settings: res,
			}));
		});
	},

	/**
	 * SaveSettings saves the settings to the backend.
	 */
	saveSettings() {
		return API.exec<Settings>(API.SAVE_SETTINGS, atom.value.settings);
	},

	/**
	 * LoadGenerators loads the generators from the backend.
	 */
	loadGenerators() {
		return API.exec<Generator[]>(API.GET_GENERATORS).then((res) => {
			atom.update((state) => ({
				...state,
				generators: res ?? [],
			}));

			this.updateFuzzySearch();
		});
	},

	/**
	 * LoadSources loads the sources from the backend.
	 */
	loadSources() {
		return API.exec<DataSource[]>(API.GET_SOURCES).then((res) => {
			atom.update((state) => ({
				...state,
				sources: res ?? [],
			}));

			this.updateFuzzySearch();
		});
	},

	/**
	 * LoadPrinter loads the printer from the backend.
	 */
	loadPrinter() {
		return API.exec<Record<string, Printer>>(API.GET_AVAILABLE_PRINTER).then((res) => {
			atom.update((state) => ({
				...state,
				printer: res ?? {},
			}));
		});
	},

	/**
	 * LoadPrinterTypes loads the printer types with description from the backend.
	 */
	loadPrinterTypes() {
		return API.exec<Record<string, string>>(API.GET_PRINTER).then((res) => {
			atom.update((state) => ({
				...state,
				printerTypes: res ?? {},
			}));
		});
	},

	/**
	 * LoadPublicList loads the packages from the backend.
	 */
	loadPublicList() {
		return API.exec<PublicList[]>(API.GET_PUBLIC_LIST).then((res) => {
			atom.update((state) => ({
				...state,
				packages: res ?? [],
			}));
		});
	},

	/**
	 * LoadTemplates loads the templates from the backend.
	 */
	loadTemplates() {
		return API.exec<Template[]>(API.GET_TEMPLATES).then((res) => {
			atom.update((state) => ({
				...state,
				templates: res ?? [],
			}));

			this.updateFuzzySearch();
		});
	},

	/**
	 * LoadVersion loads the version from the backend.
	 */
	loadVersion() {
		return Promise.allSettled([API.exec<Version.LocalVersion>(API.GET_VERSION), API.exec<Version.NewVersion>(API.NEW_VERSION)]).then((res) => {
			atom.update((state) => ({
				...state,
				version: {
					current: res[0].status === 'fulfilled' ? res[0].value : null,
					latest: res[1].status === 'fulfilled' ? res[1].value : null,
				},
			}));
		});
	},

	updateFuzzySearch() {
		atom.update((state) => ({
			...state,
			fuzzySearch: new Fuse<FuseSearch>(
				[
					...(state.templates ?? []).map((template) => toFuseSearch('template', template)),
					...(state.generators ?? []).map((generator) => toFuseSearch('generator', generator)),
					...(state.sources ?? []).map((source) => toFuseSearch('source', source)),
					...Operations.map((operation) => toFuseSearch('operation', operation)),
				],
				{
					keys: FuseKeys,
					minMatchCharLength: 2,
					threshold: 0.4,
				},
			),
		}));
	},

	setRandomAIToken() {
		atom.update((state) => ({
			...state,
			ai: {
				...state.ai,
				token: Math.ceil(Math.random() * 1000000000).toString(),
			},
		}));
	},

	setAIToken(token: string) {
		atom.update((state) => ({
			...state,
			ai: {
				...state.ai,
				token,
			},
		}));
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
export const printerTypes = store.focus('printerTypes');
export const packages = store.focus('publicLists');
export const ai = store.focus('ai');
