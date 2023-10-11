import m from 'mithril';

import { debounce } from 'lodash-es';

import { buildId } from 'js/types/basic-info';
import Entry from 'js/types/entry';
import Template, { sanitizeConfig } from 'js/types/template';

import * as API from 'js/core/api';
import { AI_GENERATE } from 'js/core/api';
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

	function extractJSON(str: string) {
		const first = str.indexOf('{');
		const last = str.lastIndexOf('}');
		return JSON.parse(str.substring(first, last + 1));
	}

	/**
	 * Generates a new AI entry.
	 */
	const generateAIEntry = () => {
		state.aiLoading = true;

		let system = `
	You output JSON.
	You are a helper to generate data in a Software.
	You are in a software for Pen & Paper / TTRPGs.
	You should generate JSON for a template called "${state.template?.name}".
	
	A few example JSON for this template is:
	
	${JSON.stringify(state.template?.skeletonData, null, 2)}`;

		// Add a few random examples.
		const otherExamples = new Array(3)
			.fill(0)
			.map(() => {
				if (state.entries.length === 0) return '';
				return JSON.stringify(state.entries[Math.floor(Math.random() * state.entries.length)].data, null, 2);
			})
			.filter((e) => e !== '');

		otherExamples.forEach((e) => {
			if (settings.value.aiContextWindow > 0 && system.length + e.length + 2 > settings.value.aiContextWindow) return;
			system += `
			
			${e}`;
		});

		API.exec<string>(AI_GENERATE, system, state.aiPrompt, Math.floor(Math.random() * 50000).toString())
			.then((data) => {
				try {
					let resp = {};
					if (data[0] === '{') resp = JSON.parse(data);
					else resp = extractJSON(data);

					state.selectedEntry = {
						id: `ai#${Math.floor(Math.random() * 50000)}`,
						name: 'AI Generated',
						data: resp,
					};
				} catch (e) {
					error("AI response wasn't valid template. Please try again or try another model.");
					console.error(e);
				} finally {
					state.aiLoading = false;
				}
			})
			.catch(error)
			.finally(() => (state.aiLoading = false));
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
								{ icon: 'planet', label: 'AI Entry' },
								...(settings.value.aiEnabled ? [{ icon: 'clipboard', label: 'Information' }] : []),
								...(state.template?.config && state.template?.config.length > 0 ? [{ icon: 'options', label: 'Config' }] : []),
								{ icon: 'search', label: 'Advanced Filter' },
							],
							content: {
								Entries: () => {
									m(
										PaginatedContent<Entry>,
										{
											items: filteredEntries(),
											perPage: PER_PAGE,
											renderItem: entryElement,
											pageOpened: (page, items) => ensureRenderCache(items),
										},
										m('div.w5', m(Input, { placeholder: 'Search...', value: state.search, onChange: (val) => (state.search = val) })),
									);
								},
								'AI Entry': () =>
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
											m(Flex, { justify: 'between' }, [
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
