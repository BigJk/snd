import m from 'mithril';
import { cloneDeep, debounce, map } from 'lodash-es';

import { buildId } from 'js/types/basic-info';
import Entry from 'js/types/entry';
import Template, { sanitizeConfig } from 'js/types/template';
import * as AI from 'js/core/ai';
import * as API from 'js/core/api';
import store, { settings } from 'js/core/store';
import { render } from 'js/core/templating';

import Button from 'js/ui/shoelace/button';
import Divider from 'js/ui/shoelace/divider';
import DividerVert from 'js/ui/shoelace/divider-vert';
import IconButton from 'js/ui/shoelace/icon-button';
import Input from 'js/ui/shoelace/input';
import Loader from 'js/ui/shoelace/loader';
import TextArea from 'js/ui/shoelace/text-area';

import Tooltip from 'js/ui/components/atomic/tooltip';
import Editor from 'js/ui/components/config/editor';
import EntryListItem from 'js/ui/components/entry-list-item';
import HorizontalProperty from 'js/ui/components/horizontal-property';
import Flex from 'js/ui/components/layout/flex';
import { openAdditionalInfosModal } from 'js/ui/components/modals/additional-infos';
import { openFileModal } from 'js/ui/components/modals/file-browser';
import ImportExport from 'js/ui/components/modals/imexport/import-export';
import { openPromptModal } from 'js/ui/components/modals/prompt';
import { openDevTools } from 'js/ui/components/print-preview';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';
import PaginatedContent from 'js/ui/components/view-layout/paginated-content';
import SidebarPrintPage from 'js/ui/components/view-layout/sidebar-print-page';

import { setPortal } from 'js/ui/portal';
import { dialogWarning, error, success } from 'js/ui/toast';

const PER_PAGE = 10;

type SingleTemplateProps = {
	id: string;
};

type SingleTemplateState = {
	template: Template | null;
	entries: Entry[];
	selectedEntry: Entry | null;
	renderCache: Record<string, string>;
	config: any;
	page: number;
	search: string;
	aiPrompt: string;
	aiLanguage: string;
	aiLoading: boolean;
	lastRendered: string;
	savedConfigs: Record<string, any>;
};

export default (): m.Component<SingleTemplateProps> => {
	let state: SingleTemplateState = {
		template: null,
		entries: [],
		selectedEntry: null,
		renderCache: {},
		config: {},
		page: 0,
		search: '',
		aiPrompt: '',
		aiLanguage: '',
		aiLoading: false,
		lastRendered: '',
		savedConfigs: {},
	};

	const fetchEntries = () => {
		if (!state.template) return;
		API.exec<Entry[]>(API.GET_ENTRIES_WITH_SOURCES, buildId('template', state.template)).then((entries) => {
			state.entries = entries;
		});
	};

	/**
	 * Generates print templates for the given entries and caches them.
	 */
	const ensureRenderCache = debounce((entries: Entry[]) => {
		Promise.all(
			entries.map((e) =>
				render(
					state.template?.listTemplate!,
					{
						it: e.data,
						sources: state.template?.dataSources!,
						config: state.config,
						settings: settings.value,
						images: {}, // Don't need images for list template
					},
					false,
				),
			),
		).then((rendered) => {
			let needsUpdate = false;
			rendered.forEach((r, i) => {
				if (state.renderCache[entries[i].id] === r) return;
				state.renderCache[entries[i].id] = r;
				needsUpdate = true;
			});
			if (needsUpdate) m.redraw();
		});
	}, 500);

	const filteredEntries = () =>
		state.entries.filter((e) => {
			if (state.search === '') return true;
			return e.name.toLowerCase().includes(state.search.toLowerCase());
		});

	/**
	 * Generates a new AI entry.
	 */
	const generateAIEntry = () => {
		if (!state.template) return;
		if (state.aiPrompt === '') return;
		state.aiLoading = true;

		AI.generateEntry(state.aiPrompt, state.template, state.entries)
			.then((entry) => {
				if (entry.hasError) {
					error('AI generation failed. Please try again or test another model.');
					return;
				}

				state.selectedEntry = entry.value;
			})
			.catch(error)
			.finally(() => {
				state.aiLoading = false;
			});
	};

	/**
	 * Generates a new AI translation.
	 */
	const generateAITranslation = () => {
		if (!state.template) return;
		if (!state.selectedEntry) return;
		if (state.aiLanguage === '') return;
		state.aiLoading = true;

		AI.translateEntry(state.aiLanguage, state.selectedEntry).then((entry) => {
			state.aiLoading = false;

			if (entry.hasError) {
				error('AI translation failed. Please try again or test another model.');
				return;
			}

			state.selectedEntry = entry.value;
		});
	};

	const screenshot = () => {
		if (!state.template) return;
		openFileModal('Select a save folder', [], true).then((folder) => {
			API.exec<void>(API.SCREENSHOT, state.lastRendered, `${folder}/${state.selectedEntry?.name}.png`)
				.then(() => success('Saved screenshot'))
				.catch(error);
		});
	};

	const print = () => {
		if (!state.template) return;
		API.exec<void>(API.PRINT, state.lastRendered)
			.then(() => success('Printed entry'))
			.catch(error);
	};

	const showExport = () => {
		if (!state.template) return;

		setPortal(ImportExport, {
			attributes: {
				endpoint: API.EXPORT_TEMPLATE,
				title: 'Export Template',
				loadingMessage: 'Exporting... Please wait',
				verb: 'Export',
				id: buildId('template', state.template),
			},
		});
	};

	const showAdditionalInfo = () => {
		if (!state.template) return;
		openAdditionalInfosModal('template', buildId('template', state.template), state.config);
	};

	const deleteTemplate = () => {
		if (!state.template) return;

		dialogWarning('Are you sure you want to delete this template?').then(() => {
			if (!state.template) return;
			API.exec<void>(API.DELETE_TEMPLATE, buildId('template', state.template))
				.then(() => {
					success('Deleted template');
					store.actions.loadTemplates().catch(error);
					m.route.set('/template');
				})
				.catch(error);
		});
	};

	const saveConfigs = () => {
		if (!state.template) {
			return;
		}
		return API.exec<void>(API.SET_KEY, `${buildId('template', state.template)}_saved_configs`, JSON.stringify(state.savedConfigs));
	};

	const saveConfig = () => {
		openPromptModal({
			title: 'Save Config',
			label: 'Name',
			description: 'Enter a name for the config',
			onSuccess: (name) => {
				if (!state.template) return;

				if (state.savedConfigs[name]) {
					dialogWarning('This config already exists. Do you want to overwrite it?').then(() => {
						state.savedConfigs[name] = cloneDeep(state.config);
						saveConfigs()?.catch(error);
						success('Overwrote config');
					});
					return;
				}

				state.savedConfigs[name] = cloneDeep(state.config);
				saveConfigs()?.catch(error);
				success('Saved config');
			},
		});
	};

	const deleteSavedConfig = (name: string) => {
		dialogWarning('Are you sure you want to delete this config?').then(() => {
			if (!state.template) return;
			delete state.savedConfigs[name];
			saveConfigs()?.catch(error);
		});
	};

	const loadSavedConfig = (name: string) => {
		if (!state.template) return;
		state.config = cloneDeep(state.savedConfigs[name]);
	};

	const buttonBar = () =>
		m(Flex, { className: '.bt.b--black-10.pv2.ph3', justify: 'between', items: 'center', gap: 2 }, [
			m(Flex, { gap: 2 }, [m(IconButton, { icon: 'save', intend: 'primary', onClick: saveConfig }, 'Save Config')]),
		]);

	const entryElement = (entry: Entry) => {
		const selected = state.selectedEntry && entry.id === state.selectedEntry.id;
		return m(EntryListItem, {
			entry,
			selected,
			onClick: () => (state.selectedEntry = entry),
			bottom: m(
				`div${state.renderCache[entry.id] ? '.mt2' : ''}`,
				state.renderCache[entry.id] !== undefined ? m.trust(state.renderCache[entry.id]) : m('div.dib.pl2.mt2', m(Loader)),
			),
			right: selected
				? m('div', [
						m(
							Tooltip,
							{ content: 'Screenshot' },
							m(IconButton, { intend: 'primary', size: 'sm', className: '.mr2', icon: 'camera', onClick: screenshot }),
						), //
						m(Tooltip, { content: 'Print' }, m(IconButton, { className: '.mr2', intend: 'primary', size: 'sm', icon: 'print', onClick: print })),
						m(
							Tooltip,
							{ content: 'Edit Entry' },
							m(IconButton, {
								intend: 'primary',
								size: 'sm',
								icon: 'create',
								className: '.mr2',
								disabled: entry.source?.startsWith('ds:'),
								onClick: () => m.route.set(`/template/${buildId('template', state.template!)}/edit/${btoa(entry.id)}`),
							}),
						),
						m(
							Tooltip,
							{ content: 'Delete' },
							m(IconButton, {
								disabled: entry.source?.startsWith('ds:'),
								intend: 'error',
								size: 'sm',
								icon: 'trash',
								onClick: () => {
									API.exec<void>(API.DELETE_ENTRY, buildId('template', state.template!), entry.id)
										.then(() => {
											fetchEntries();
											success('Entry deleted');
										})
										.catch(error);
								},
							}),
						),
					])
				: null,
		});
	};

	return {
		oninit({ attrs }) {
			API.exec<Template>(API.GET_TEMPLATE, attrs.id).then((template) => {
				state.template = template;
				state.config = sanitizeConfig(template, {});

				fetchEntries();
			});
			API.exec<string>(API.GET_KEY, `${attrs.id}_saved_configs`)
				.then((configs) => {
					state.savedConfigs = JSON.parse(configs);
				})
				.catch(console.error);
		},
		view({ attrs }) {
			return m(
				Base,
				{
					title: m(Breadcrumbs, {
						items: [{ link: '/template', label: 'Templates' }, { label: state.template ? state.template.name : m(Loader, { className: '.mh2' }) }],
					}),
					active: 'templates',
					classNameContainer: '.pa3',
					rightElement: m(Flex, { items: 'center' }, [
						m(
							IconButton,
							{ icon: 'add', size: 'sm', className: '.mr2', intend: 'success', onClick: () => m.route.set(`/template/${attrs.id}/create`) },
							'New Entry',
						),
						m(IconButton, { icon: 'create', size: 'sm', intend: 'primary', onClick: () => m.route.set(`/template/${attrs.id}/edit`) }, 'Edit'),
						m(DividerVert),
						m(
							Tooltip,
							{ content: 'Export' },
							m(IconButton, { icon: 'download', size: 'sm', intend: 'primary', className: '.mr2', onClick: showExport }),
						),
						m(
							Tooltip,
							{ content: 'Additional Information' },
							m(IconButton, { icon: 'information-circle-outline', size: 'sm', intend: 'primary', className: '.mr2', onClick: showAdditionalInfo }),
						),
						m(
							Tooltip,
							{ content: 'Open Dev Tools' },
							m(IconButton, {
								intend: 'primary',
								icon: 'bug',
								size: 'sm',
								className: '.mr2',
								onClick: () => {
									openDevTools(document.body);
								},
							}),
						),
						m(
							Tooltip,
							{ content: 'Duplicate' },
							m(IconButton, {
								icon: 'copy',
								size: 'sm',
								intend: 'primary',
								className: '.mr2',
								onClick: () => m.route.set(`/template/create/${buildId('template', state.template!)}`),
							}),
						),
						m(Tooltip, { content: 'Delete' }, m(IconButton, { icon: 'trash', size: 'sm', intend: 'error', onClick: deleteTemplate })),
					]),
				},
				state.template
					? // @ts-ignore
						m(SidebarPrintPage, {
							template: state.template,
							it: state.selectedEntry?.data,
							entry: state.selectedEntry,
							config: state.config,
							onRendered: (html) => (state.lastRendered = html),
							tabs: [
								{ icon: 'filing', label: 'Entries' },
								...(settings.value.aiEnabled ? [{ icon: 'planet', label: 'AI Tools' }] : []),
								{ icon: 'clipboard', label: 'Information' },
								...(state.template?.config && state.template?.config.length > 0
									? [
											{ icon: 'options', label: 'Config' },
											{ icon: 'save', label: 'Saved' },
										]
									: []),
								// { icon: 'search', label: 'Advanced Filter' },
							],
							content: {
								Entries: () =>
									m(
										PaginatedContent<Entry>,
										{
											items: filteredEntries(),
											perPage: PER_PAGE,
											renderItem: entryElement,
											pageOpened: (page, items) => ensureRenderCache(items),
										},
										m('div.w5', m(Input, { placeholder: 'Search...', value: state.search, onChange: (val) => (state.search = val) })),
									),
								'AI Tools': () =>
									m(
										'div.ph3.pv2',
										m(Flex, { direction: 'column', gap: 2 }, [
											m('div.f5.b', 'AI Entry'),
											m(
												'div.f7.text-muted.mb2.lh-copy',
												'Enter a prompt for the AI to generate a entry. Sometimes it needs a few tries to generate valid data and in some cases it is not possible to generate data as the AI might flag the input as inappropriate.',
											),
											m(TextArea, {
												rows: 10,
												placeholder: 'I want a entry for...',
												value: state.aiPrompt,
												onChange: (val) => (state.aiPrompt = val),
											}),
											m(Flex, { justify: 'between', className: '.mt2' }, [
												m(Button, { onClick: generateAIEntry, loading: state.aiLoading, intend: 'primary' }, 'Generate'), //
												m(
													Flex,
													{ items: 'center' },
													state.selectedEntry?.id.indexOf('ai#') === 0 && !state.aiLoading
														? [
																m(IconButton, { className: '.mr2', intend: 'primary', size: 'sm', icon: 'print', onClick: print }),
																m('div.mr2', 'or'),
																m(Input, {
																	placeholder: 'Name',
																	value: state.selectedEntry?.name,
																	onChange: (val) => {
																		if (!state.selectedEntry) return;
																		state.selectedEntry.name = val;
																	},
																}),
																m(
																	Button,
																	{
																		onClick: () => {
																			if (!state.template || !state.selectedEntry) return;
																			API.exec<void>(API.SAVE_ENTRY, buildId('template', state.template), state.selectedEntry)
																				.then(() => {
																					success('Saved entry');
																					fetchEntries();
																				})
																				.catch(error);
																		},
																		intend: 'success',
																		className: '.ml2',
																	},
																	'Save',
																),
															]
														: null,
												),
											]),
											m(Divider),
											m('div.f5.b', 'AI Translation'),
											m('div.f7.text-muted.mb2.lh-copy', 'Enter a language to which the selected entry should be converted to.'),
											m(TextArea, {
												rows: 1,
												placeholder: 'language...',
												value: state.aiLanguage,
												onChange: (val) => (state.aiLanguage = val),
											}),
											m(Flex, { justify: 'between', className: '.mt2' }, [
												m(Button, { onClick: generateAITranslation, loading: state.aiLoading, intend: 'primary' }, 'Translate'), //
												m(
													Flex,
													state.selectedEntry?.id.indexOf('ai_translate#') === 0 && !state.aiLoading
														? [
																m(Input, {
																	placeholder: 'Name',
																	value: state.selectedEntry?.name,
																	onChange: (val) => {
																		if (!state.selectedEntry) return;
																		state.selectedEntry.name = val;
																	},
																}),
																m(
																	Button,
																	{
																		onClick: () => {
																			if (!state.template || !state.selectedEntry) return;
																			API.exec<void>(API.SAVE_ENTRY, buildId('template', state.template), state.selectedEntry)
																				.then(() => {
																					success('Saved entry');
																					fetchEntries();
																				})
																				.catch(error);
																		},
																		intend: 'success',
																		className: '.ml2',
																	},
																	'Save',
																),
															]
														: null,
												),
											]),
										]),
									),
								Information: () =>
									m('div.ph3.pv2.lh-copy', [
										m('div.f5.mb2.b', 'Description'),
										m('div', { style: { whiteSpace: 'break-spaces' } }, state.template?.description ?? ''),
										...(state.template?.copyrightNotice
											? [
													m('div.f5.mb2.b.mt3', 'Copyright Notice'),
													m('div', { style: { whiteSpace: 'break-spaces' } }, state.template.copyrightNotice),
												]
											: []),
									]),
								Config: () =>
									m(Flex, { className: '.h-100', direction: 'column' }, [
										m(Editor, {
											className: '.flex-grow-1.overflow-auto.h-100',
											current: state.config,
											definition: state.template!.config,
											onChange: (config) => {
												state.config = config;
												m.redraw();
											},
										}),
										buttonBar(),
									]),
								Saved: () =>
									m(Flex, { className: '.h-100', direction: 'column' }, [
										m('div.ph3.pv2.lh-copy.h-100.overflow-auto', [
											m('div.f5.b', 'Saved Configs'),
											Object.keys(state.savedConfigs).length
												? m(Flex, { direction: 'column' }, [
														...map(state.savedConfigs, (config, key) =>
															m(
																HorizontalProperty,
																{
																	label: key,
																	description: '',
																	bottomBorder: true,
																	centered: true,
																},
																m(
																	Flex,
																	{
																		justify: 'end',
																	},
																	[
																		m(IconButton, { icon: 'trash', intend: 'error', onClick: () => deleteSavedConfig(key) }),
																		m(DividerVert),
																		m(
																			IconButton,
																			{ icon: 'cloud-upload', className: '.mr2', intend: 'primary', onClick: () => loadSavedConfig(key) },
																			'Load',
																		),
																	],
																),
															),
														),
													])
												: m('div.pv2.text-muted', 'No saved configs yet...'),
										]),
										buttonBar(),
									]),
								//'Advanced Filter': () => m('div.pa3', 'Coming back soon...'),
							},
						})
					: null,
			);
		},
	};
};
