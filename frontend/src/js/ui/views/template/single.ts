import m from 'mithril';

import { debounce } from 'lodash-es';

import { buildId } from 'js/types/basic-info';
import Entry from 'js/types/entry';
import Template, { sanitizeConfig } from 'js/types/template';

import * as API from 'js/core/api';
import * as AI from 'js/core/ai';
import { settings } from 'js/core/store';
import { render } from 'js/core/templating';

import Button from 'js/ui/spectre/button';
import IconButton from 'js/ui/spectre/icon-button';
import Input from 'js/ui/spectre/input';
import Loader from 'js/ui/spectre/loader';
import TextArea from 'js/ui/spectre/text-area';

import Tooltip from 'js/ui/components/atomic/tooltip';
import Editor from 'js/ui/components/config/editor';
import Flex from 'js/ui/components/layout/flex';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';
import PaginatedContent from 'js/ui/components/view-layout/paginated-content';
import SidebarPrintPage from 'js/ui/components/view-layout/sidebar-print-page';

import { error, success } from 'js/ui/toast';
import EntryListItem from 'js/ui/components/entry-list-item';

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
						config: {},
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

		AI.generateEntry(state.aiPrompt, state.template, state.entries).then((entry) => {
			state.aiLoading = false;

			if (entry.hasError) {
				error('AI generation failed. Please try again or test another model.');
				return;
			}

			state.selectedEntry = entry.value;
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
						m(Tooltip, { content: 'Screenshot' }, m(IconButton, { intend: 'primary', size: 'sm', className: '.mr2', icon: 'camera' })), //
						m(Tooltip, { content: 'Print' }, m(IconButton, { intend: 'primary', size: 'sm', icon: 'print' })),
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
					rightElement: m('div.flex', [
						m(
							IconButton,
							{ icon: 'add', size: 'sm', intend: 'success', className: '.mr2', onClick: () => m.route.set(`/template/${attrs.id}/create`) },
							'New Entry',
						),
						m(IconButton, { icon: 'create', size: 'sm', intend: 'primary', onClick: () => m.route.set(`/template/${attrs.id}/edit`) }, 'Edit'),
					]),
				},
				state.template
					? // @ts-ignore
					  m(SidebarPrintPage, {
							template: state.template,
							it: state.selectedEntry?.data,
							tabs: [
								{ icon: 'filing', label: 'Entries' },
								{ icon: 'planet', label: 'AI Tools' },
								...(settings.value.aiEnabled ? [{ icon: 'clipboard', label: 'Information' }] : []),
								...(state.template?.config && state.template?.config.length > 0 ? [{ icon: 'options', label: 'Config' }] : []),
								{ icon: 'search', label: 'Advanced Filter' },
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
													state.selectedEntry?.id.indexOf('ai#') === 0 && !state.aiLoading
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
											m('div.divider'),
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
								Information: () => m('div.ph3.pv2.lh-copy', [m('div.f5.mb2.b', 'Description'), state.template?.description ?? '']),
								Config: () =>
									m(Editor, {
										current: state.config,
										definition: state.template!.config,
										onChange: (config) => {
											state.config = config;
											m.redraw();
										},
									}),
								'Advanced Filter': () => m('div', 'advanced-filter'),
							},
					  })
					: null,
			);
		},
	};
};
