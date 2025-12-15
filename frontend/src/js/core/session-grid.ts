import { buildId } from 'js/types/basic-info';
import Entry from 'js/types/entry';
import Generator, { sanitizeConfig } from 'js/types/generator';
import {
	GridElement,
	GridGeneratorElement,
	GridLinearExecution,
	GridTemplateElement,
	isGridGeneratorElement,
	isGridLinearExecution,
	isGridPrinterCommandElement,
	isGridTemplateElement,
} from 'js/types/session-grid';
import Template from 'js/types/template';
import * as API from 'js/core/api';
import { settings } from 'js/core/store';
import { render } from 'js/core/templating';

const TEMPLATE_ENTRIES_CACHE_TIMEOUT = 10000;

/**
 * Gets the name of a grid element. If the element has a name, it will be returned immediately. Otherwise, the name will be fetched from the API.
 * @param element The grid element to get the name of
 * @returns A promise that resolves to the name of the grid element
 */
export function getGridElementName(element: GridElement): Promise<string> {
	return new Promise((resolve, reject) => {
		if (element.name) {
			resolve(element.name);
			return;
		}

		if (isGridTemplateElement(element)) {
			API.exec<Template>(API.GET_TEMPLATE, element.templateId)
				.then((res) => {
					resolve(res.name);
				})
				.catch(reject);
		} else if (isGridGeneratorElement(element)) {
			API.exec<Generator>(API.GET_GENERATOR, element.generatorId)
				.then((res) => {
					resolve(res.name);
				})
				.catch(reject);
		} else if (isGridPrinterCommandElement(element)) {
			const commandNames: Record<string, string> = {
				cut: 'Cut Paper',
				drawer1: 'Open Drawer 1',
				drawer2: 'Open Drawer 2',
			};
			resolve(commandNames[element.command] || 'Printer Command');
		}
	});
}

/**
 * Cache for the entries of a grid template element
 */
const entriesCache: { [key: string]: { timestamp: number; entries: Entry[] } } = {};

/**
 * Get the choices for a grid template element.
 * @param element The grid template element to get the choices for
 * @param search An optional search string to filter the choices by
 * @returns A promise that resolves to the choices for the grid template element
 */
export async function getGridTemplateChoices(
	element: GridTemplateElement,
	search?: string,
): Promise<{ id: string; name: string; source?: string }[]> {
	if (element.templateId.length === 0) {
		return [];
	}

	if (entriesCache[element.templateId] && Date.now() - entriesCache[element.templateId].timestamp < TEMPLATE_ENTRIES_CACHE_TIMEOUT) {
		return Promise.resolve(
			entriesCache[element.templateId].entries
				.map((entry) => ({
					name: entry.name,
					id: entry.id,
					source: entry.source,
				}))
				.filter((e) => !search || e.name.toLowerCase().includes(search.toLowerCase())),
		);
	}

	return API.exec<Entry[]>(API.GET_ENTRIES_WITH_SOURCES, element.templateId).then((res) => {
		entriesCache[element.templateId] = {
			timestamp: Date.now(),
			entries: res,
		};
		return res
			.map((entry) => ({
				name: entry.name,
				id: entry.id,
				source: entry.source,
			}))
			.filter((e) => !search || e.name.toLowerCase().includes(search.toLowerCase()));
	});
}

/**
 * Get the choices for a grid template element.
 * @param element The grid template element to get the choices for
 * @returns A promise that resolves to the choices for the grid template element
 */
export async function getGridTemplateConfigChoices(element: GridTemplateElement): Promise<string[]> {
	if (element.templateId.length === 0) {
		return [];
	}

	return API.exec<string>(API.GET_KEY, `${element.templateId}_saved_configs`).then((configs) => Object.keys(JSON.parse(configs)));
}

/**
 * Get the choices for a grid generator element.
 * @param element The grid generator element to get the choices for
 * @returns A promise that resolves to the choices for the grid generator element
 */
export async function getGridGeneratorConfigChoices(element: GridGeneratorElement): Promise<string[]> {
	if (element.generatorId.length === 0) {
		return [];
	}

	return API.exec<string>(API.GET_KEY, `${element.generatorId}_saved_configs`).then((configs) => Object.keys(JSON.parse(configs)));
}

/**
 * Execute a grid element
 * @param element The grid element to execute
 */
export async function executeElement(element: GridElement | GridLinearExecution) {
	if (isGridTemplateElement(element)) {
		if (!element.entryId) {
			const choices = await getGridTemplateChoices(element);
			if (choices.length === 0) {
				return;
			}

			const choice = Math.floor(Math.random() * choices.length);
			element.entryId = choices[choice].id;
			element.dataSourceId = choices[choice].source;
		}

		const template = await API.exec<Template>(API.GET_TEMPLATE, element.templateId);
		const entry = await API.exec<Entry>(API.GET_ENTRY, element.dataSourceId ?? buildId('template', template), element.entryId);

		let config = {};
		if (element.configName && element.configName.length > 0) {
			const savedConfigs = await API.exec<string>(API.GET_KEY, `${element.templateId}_saved_configs`);
			if (savedConfigs) {
				const configs = JSON.parse(savedConfigs);
				if (configs[element.configName]) {
					Object.assign(config, configs[element.configName]);
				}
			}
		}

		const res = await render(template.printTemplate, {
			it: entry.data,
			config: config,
			sources: template.dataSources,
			images: template.images,
			settings: settings.value,
		});
		await API.exec(API.PRINT, res);
	}

	if (isGridGeneratorElement(element)) {
		const config = {};
		if (element.configName && element.configName.length > 0) {
			const savedConfigs = await API.exec<string>(API.GET_KEY, `${element.generatorId}_saved_configs`);
			if (savedConfigs) {
				const configs = JSON.parse(savedConfigs);
				if (configs[element.configName]) {
					Object.assign(config, configs[element.configName]);
					delete (config as Record<string, any>)['seed'];
				}
			}
		}

		const generator = await API.exec<Generator>(API.GET_GENERATOR, element.generatorId);
		const finalConfig = sanitizeConfig(generator, config);
		const res = await render(generator.printTemplate, {
			config: finalConfig,
			sources: generator.dataSources,
			images: generator.images,
			settings: settings.value,
			aiEnabled: element.aiEnabled,
			aiToken: finalConfig.seed,
		});
		await API.exec(API.PRINT, res);
	}

	if (isGridPrinterCommandElement(element)) {
		const commandMap: Record<string, string> = {
			cut: API.CUT_PAPER,
			drawer1: API.OPEN_CASH_DRAWER_1,
			drawer2: API.OPEN_CASH_DRAWER_2,
		};

		const apiCommand = commandMap[element.command];
		if (apiCommand) {
			await API.exec(apiCommand);
		}
	}

	if (isGridLinearExecution(element)) {
		throw new Error('Not implemented');
	}
}
