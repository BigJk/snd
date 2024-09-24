import m from 'mithril';

/**
 * Exec fetches data from the backend.
 * @param type The function to call on the backend.
 * @param args The arguments to pass to the backend function.
 */
export function exec<T>(type: String, ...args: any[]): Promise<T> {
	return new Promise((resolve, reject) => {
		m.request({
			method: 'POST',
			url: '/api/' + type,
			body: args,
		})
			.then((res) => {
				resolve(res as T);
			})
			.catch(reject);
	});
}

// Settings functions
export const GET_SETTINGS = 'getSettings';
export const SAVE_SETTINGS = 'saveSettings';

// Version functions
export const GET_VERSION = 'getVersion';
export const NEW_VERSION = 'newVersion';

// Key Value functions
export const GET_KEY = 'getKey';
export const SET_KEY = 'setKey';

// Entries functions
export const GET_ENTRIES = 'getEntries';
export const SAVE_ENTRY = 'saveEntry';
export const DELETE_ENTRY = 'deleteEntry';
export const DELETE_ENTRIES = 'deleteEntries';
export const COUNT_ENTRIES = 'countEntries';
export const GET_ENTRIES_WITH_SOURCES = 'getEntriesWithSources';
export const COPY_ENTRIES = 'copyEntries';
export const GET_ENTRY = 'getEntry';

// Template
export const GET_TEMPLATES = 'getTemplates';
export const GET_TEMPLATE = 'getTemplate';
export const SAVE_TEMPLATE = 'saveTemplate';
export const DELETE_TEMPLATE = 'deleteTemplate';
export const GET_TEMPLATE_IMPORTS = 'importsTemplate';
export const GET_TEMPLATE_EXPORTS = 'exportsTemplate';
export const IMPORT_TEMPLATE = 'importsTemplate';
export const EXPORT_TEMPLATE = 'exportsTemplate';

// Generators
export const GET_GENERATORS = 'getGenerators';
export const GET_GENERATOR = 'getGenerator';
export const SAVE_GENERATOR = 'saveGenerator';
export const DELETE_GENERATOR = 'deleteGenerator';
export const GET_GENERATOR_IMPORTS = 'importsGenerator';
export const GET_GENERATOR_EXPORTS = 'exportsGenerator';
export const IMPORT_GENERATOR = 'importsGenerator';
export const EXPORT_GENERATOR = 'exportsGenerator';

// Data Sources
export const GET_SOURCES = 'getSources';
export const GET_SOURCE = 'getSource';
export const SAVE_SOURCE = 'saveSource';
export const DELETE_SOURCE = 'deleteSource';
export const GET_SOURCE_IMPORTS = 'importsSource';
export const GET_SOURCE_EXPORTS = 'exportsSource';
export const IMPORT_SOURCE = 'importsSource';
export const EXPORT_SOURCE = 'exportsSource';

// Packages
export const GET_PUBLIC_LIST = 'getPublicPackages';
export const GET_PACKAGES = 'getPackages';
export const GET_REPO = 'getRepo';
export const IMPORT_PACKAGE = 'importPackage';

// Printer
export const GET_AVAILABLE_PRINTER = 'getAvailablePrinter';
export const GET_PRINTER = 'getPrinter';

// Printing
export const PRINT = 'print';
export const SCREENSHOT = 'screenshot';

// Cloud Sync
export const SYNC_CLOUD_TO_LOCAL = 'syncCloudToLocal';
export const SYNC_LOCAL_TO_CLOUD = 'syncLocalToCloud';

// AI
export const AI_GENERATE = 'aiPrompt';
export const AI_MODELS = 'aiModels';
export const AI_PROVIDERS = 'aiProviders';
export const AI_INVALIDATE_CACHE = 'aiInvalidateCached';

// File Browser
export const GET_FILES = 'getFiles';
export const GET_DEFAULT_DIRECTORIES = 'getDefaultDirectories';

// Misc function
export const FETCH_IMAGE = 'fetchImage';
export const PREVIEW_CACHE = 'previewCache';
export const GET_LOCAL_URL = 'getLocalURL';
