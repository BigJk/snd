import m from 'mithril';
import { cloneDeep, map } from 'lodash-es';

import BasicInfo, { buildId } from 'js/types/basic-info';
import * as API from 'js/core/api';

import DividerVert from 'js/ui/shoelace/divider-vert';
import IconButton from 'js/ui/shoelace/icon-button';

import HorizontalProperty from 'js/ui/components/horizontal-property';
import Flex from 'js/ui/components/layout/flex';
import { openAdditionalInfosModal } from 'js/ui/components/modals/additional-infos';
import { openFileModal } from 'js/ui/components/modals/file-browser';
import ImportExport from 'js/ui/components/modals/imexport/import-export';
import { openPromptModal } from 'js/ui/components/modals/prompt';
import { openDevTools } from 'js/ui/components/print-preview';

import { setPortal } from 'js/ui/portal';
import { dialogWarning, error, success } from 'js/ui/toast';

export type SavedConfigsState = {
	savedConfigs: Record<string, any>;
};

/**
 * Loads saved configs for an entity from persistent storage.
 */
export const loadSavedConfigs = (id: string, state: SavedConfigsState) => {
	API.exec<string>(API.GET_KEY, `${id}_saved_configs`)
		.then((configs) => {
			state.savedConfigs = JSON.parse(configs);
		})
		.catch(console.error);
};

/**
 * Persists saved configs for an entity to storage.
 */
export const persistSavedConfigs = <T extends BasicInfo>(kind: 'template' | 'generator', entity: T, state: SavedConfigsState) =>
	API.exec<void>(API.SET_KEY, `${buildId(kind, entity)}_saved_configs`, JSON.stringify(state.savedConfigs));

/**
 * Opens a prompt to save the current config under a name, then persists.
 */
export const saveConfigAction = <T extends BasicInfo>(
	kind: 'template' | 'generator',
	getEntity: () => T | null,
	getConfig: () => any,
	state: SavedConfigsState,
) => {
	openPromptModal({
		title: 'Save Config',
		label: 'Name',
		description: 'Enter a name for the config',
		onSuccess: (name) => {
			const entity = getEntity();
			if (!entity) return;

			const persist = () => persistSavedConfigs(kind, entity, state)?.catch(error);

			if (state.savedConfigs[name]) {
				dialogWarning('This config already exists. Do you want to overwrite it?').then(() => {
					state.savedConfigs[name] = cloneDeep(getConfig());
					persist();
					success('Overwrote config');
				});
				return;
			}

			state.savedConfigs[name] = cloneDeep(getConfig());
			persist();
			success('Saved config');
		},
	});
};

/**
 * Deletes a named saved config and persists.
 */
export const deleteSavedConfigAction = <T extends BasicInfo>(
	kind: 'template' | 'generator',
	getEntity: () => T | null,
	name: string,
	state: SavedConfigsState,
) => {
	dialogWarning('Are you sure you want to delete this config?').then(() => {
		const entity = getEntity();
		if (!entity) return;
		delete state.savedConfigs[name];
		persistSavedConfigs(kind, entity, state)?.catch(error);
	});
};

/**
 * Loads a named saved config into the current config state.
 */
export const loadSavedConfigAction = (name: string, state: SavedConfigsState, setConfig: (c: any) => void) => {
	setConfig(cloneDeep(state.savedConfigs[name]));
};

/**
 * Renders the Information tab content (description + copyright notice).
 */
export const renderInformationTab = (entity: { description?: string; copyrightNotice?: string } | null) =>
	m('div.ph3.pv2.lh-copy', [
		m('div.f5.mb2.b', 'Description'),
		m('div', { style: { whiteSpace: 'break-spaces' } }, entity?.description ?? ''),
		...(entity?.copyrightNotice
			? [m('div.f5.mb2.b.mt3', 'Copyright Notice'), m('div', { style: { whiteSpace: 'break-spaces' } }, entity.copyrightNotice)]
			: []),
	]);

type SavedTabOptions = {
	state: SavedConfigsState;
	onDelete: (key: string) => void;
	onLoad: (key: string) => void;
	/** Extra action buttons rendered after the Load button for each config row */
	extraActions?: (key: string) => m.Vnode<any, any>[];
	buttonBar: () => m.Vnode<any, any>;
};

/**
 * Renders the Saved configs tab content.
 */
export const renderSavedTab = (opts: SavedTabOptions) =>
	m(Flex, { className: '.h-100', direction: 'column' }, [
		m('div.ph3.pv2.lh-copy.h-100.overflow-auto', [
			m('div.f5.b', 'Saved Configs'),
			Object.keys(opts.state.savedConfigs).length
				? m(Flex, { direction: 'column' }, [
						...map(opts.state.savedConfigs, (_config, key) =>
							m(
								HorizontalProperty,
								{ label: key, description: '', bottomBorder: true, centered: true },
								m(Flex, { justify: 'end' }, [
									m(IconButton, { icon: 'trash', intend: 'error', onClick: () => opts.onDelete(key) }),
									m(DividerVert),
									m(IconButton, { icon: 'cloud-upload', className: '.mr2', intend: 'primary', onClick: () => opts.onLoad(key) }, 'Load'),
									...(opts.extraActions?.(key) ?? []),
								]),
							),
						),
					])
				: m('div.pv2.text-muted', 'No saved configs yet...'),
		]),
		opts.buttonBar(),
	]);

/**
 * Renders a shared top-bar save-config button strip.
 */
export const renderSaveConfigBar = (onSave: () => void) =>
	m(Flex, { className: '.bt.b--black-10.pv2.ph3', justify: 'between', items: 'center', gap: 2 }, [
		m(Flex, { gap: 2 }, [m(IconButton, { icon: 'save', intend: 'primary', onClick: onSave }, 'Save Config')]),
	]);

/**
 * Triggers a print action.
 */
export const printAction = (getLastRendered: () => string) => {
	API.exec<void>(API.PRINT, getLastRendered())
		.then(() => success('Printed entry'))
		.catch(error);
};

/**
 * Opens a folder picker and saves a screenshot.
 */
export const screenshotAction = (getLastRendered: () => string, filename: string) => {
	openFileModal('Select a save folder', [], true).then((folder) => {
		API.exec<void>(API.SCREENSHOT, getLastRendered(), `${folder}/${filename}.png`)
			.then(() => success('Saved screenshot'))
			.catch(error);
	});
};

/**
 * Opens the export modal for an entity.
 */
export const showExportAction = <T extends BasicInfo>(kind: 'template' | 'generator', entity: T, exportEndpoint: string, title: string) => {
	setPortal(ImportExport, {
		attributes: {
			endpoint: exportEndpoint,
			title,
			loadingMessage: 'Exporting... Please wait',
			verb: 'Export',
			id: buildId(kind, entity),
		},
	});
};

/**
 * Opens the additional info modal for an entity.
 */
export const showAdditionalInfoAction = <T extends BasicInfo>(kind: 'template' | 'generator', entity: T, config: any) => {
	openAdditionalInfosModal(kind, buildId(kind, entity), config);
};

/**
 * Renders the shared right-side toolbar buttons (Export, Additional Info, Dev Tools, Duplicate, Delete).
 */
export const renderEntityToolbar = <T extends BasicInfo>(opts: {
	kind: 'template' | 'generator';
	entity: T;
	config: any;
	exportEndpoint: string;
	exportTitle: string;
	duplicateRoute: string;
	onDelete: () => void;
}) =>
	[
		m(
			'span',
			{ onclick: () => showExportAction(opts.kind, opts.entity, opts.exportEndpoint, opts.exportTitle) },
			m(IconButton, { icon: 'download', size: 'sm', intend: 'primary', className: '.mr2' }),
		),
		m(
			'span',
			{ onclick: () => showAdditionalInfoAction(opts.kind, opts.entity, opts.config) },
			m(IconButton, { icon: 'information-circle-outline', size: 'sm', intend: 'primary', className: '.mr2' }),
		),
		m(IconButton, {
			intend: 'primary',
			icon: 'bug',
			size: 'sm',
			className: '.mr2',
			onClick: () => openDevTools(document.body),
		}),
		m(IconButton, {
			icon: 'copy',
			size: 'sm',
			intend: 'primary',
			className: '.mr2',
			onClick: () => m.route.set(opts.duplicateRoute),
		}),
		m(IconButton, { icon: 'trash', size: 'sm', intend: 'error', onClick: opts.onDelete }),
	] as m.Vnode[];
