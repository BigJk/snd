import m from 'mithril';

/**
 * exec fetches data from the backend.
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

// Entries functions
export const GET_ENTRIES = 'getEntries';
export const SAVE_ENTRY = 'saveEntry';
export const DELETE_ENTRY = 'deleteEntry';
export const DELETE_ENTRIES = 'deleteEntries';
export const COUNT_ENTRIES = 'countEntries';
export const GET_ENTRIES_WITH_SOURCES = 'getEntriesWithSources';
export const COPY_ENTRIES = 'copyEntries';

// Template
export const GET_TEMPLATES = 'getTemplates';
export const GET_TEMPLATE = 'getTemplate';
export const SAVE_TEMPLATE = 'saveTemplate';
export const DELETE_TEMPLATE = 'deleteTemplate';

// Misc function
export const FETCH_IMAGE = 'fetchImage';
