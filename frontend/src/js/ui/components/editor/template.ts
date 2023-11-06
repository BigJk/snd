import m from 'mithril';

import Template from 'js/types/template';
import Entry from 'js/types/entry';

import { buildId } from 'src/js/types/basic-info';
import { createNunjucksCompletionProvider } from 'js/core/monaco/completion-nunjucks';
import { settings } from 'js/core/store';
import * as API from 'js/core/api';
import { error } from 'js/ui/toast';

import BasicInfo from 'js/ui/components/editor/basic-info';
import Images from 'js/ui/components/editor/images';
import Flex from 'js/ui/components/layout/flex';
import Monaco from 'js/ui/components/monaco';
import PrintPreviewTemplate from 'js/ui/components/print-preview-template';
import SideMenuPager from 'js/ui/components/view-layout/side-menu-pager';
import SourceSelect from 'js/ui/components/source-select';
import Label from 'js/ui/spectre/label';
import Button from 'js/ui/spectre/button';
import Icon from 'js/ui/components/atomic/icon';
import EditorHeader from 'js/ui/components/view-layout/property-header';
import EntrySelect from 'js/ui/components/entry-select';

type TemplateEditorProps = {
	template: Template;
	onChange: (updated: Template) => void;
	editMode?: boolean;
};

type TemplateEditorState = {
	loading: boolean;
	selectedMenu: string;
	config: Record<string, any>;
	entriesKey: string;
	entries: Entry[];
};

export default (): m.Component<TemplateEditorProps> => {
	let state: TemplateEditorState = {
		loading: false,
		selectedMenu: 'basic-info',
		config: {},
		entriesKey: '',
		entries: [],
	};

	const fetchEntries = (attrs: TemplateEditorProps) => {
		const key = [attrs.template.slug ? buildId('template', attrs.template) : null, ...(attrs.template.dataSources ? attrs.template.dataSources : [])]
			.filter(Boolean)
			.join(',');

		if (key === state.entriesKey) {
			return;
		}

		let promises: Promise<Entry[]>[] = [];
		if (attrs.template.slug) {
			promises.push(API.exec<Entry[]>(API.GET_ENTRIES, buildId('template', attrs.template)));
		}

		if (attrs.template.dataSources) {
			promises = [...promises, ...attrs.template.dataSources.map((ds) => API.exec<Entry[]>(API.GET_ENTRIES, ds))];
		}

		Promise.all(promises)
			.then((res) => {
				state.entriesKey = key;
				state.entries = res.flat();
				m.redraw();
			})
			.catch(error);
	};

	const autoGenerateSkeleton = (attrs: TemplateEditorProps) => {
		const val = {};

		const mergeIn = (base: any, target: any) => {
			if (!target) {
				return;
			}

			Object.keys(target).forEach((k) => {
				const val = target[k];
				const type = typeof val;

				if (val === null || val === undefined) {
					return;
				}

				switch (type) {
					case 'string':
						if (!base[k] || (typeof base[k] === type && base[k].length < val.length)) {
							base[k] = val;
						}
						break;
					case 'number':
						if (!base[k] || (typeof base[k] === type && base[k] < val)) {
							base[k] = val;
						}
						break;
					case 'boolean':
						if (!base[k] || (typeof base[k] === type && base[k] < val)) {
							base[k] = val;
						}
					case 'object':
						if (Array.isArray(val)) {
							if (val.length > 0) {
								if (typeof val[0] !== 'object') {
									if (base[k].length < val.length) {
										base[k] = val;
									}
									break;
								}
							}

							if (!base[k]) {
								base[k] = [{}];
							}
							if (base[k].length === 1) {
								val.forEach((v) => mergeIn(base[k][0], v));
							}
						} else {
							if (!base[k]) {
								base[k] = {};
							}
							mergeIn(base[k], val);
						}
				}
			});
		};

		state.entries.filter((e) => e && e.data).forEach((e) => mergeIn(val, e.data));
		attrs.onChange({ ...attrs.template, skeletonData: val });
	};

	return {
		oninit({ attrs }) {
			fetchEntries(attrs);
		},
		onupdate({ attrs }) {
			fetchEntries(attrs);
		},
		view({ attrs }) {
			return [
				m(Flex, { className: '.h-100.w-100' }, [
					m(SideMenuPager, {
						className: '.flex-grow-1',
						onChange: (id) => {
							state.selectedMenu = id;
							m.redraw();
						},
						items: [
							//
							// Basic Info
							//
							{
								id: 'basic-info',
								title: 'Basic Info',
								icon: 'clipboard',
								centerContainer: true,
								render: () =>
									m(BasicInfo, {
										info: attrs.template,
										hide: [...(attrs.editMode ? ['author', 'slug'] : [])],
										onChange: (updated) => attrs.onChange({ ...attrs.template, ...updated }),
									}),
							},
							//
							// Images
							//
							{
								id: 'images',
								title: 'Images',
								icon: 'images',
								centerContainer: true,
								render: () =>
									m(
										'div.ph3',
										m(Images, { images: attrs.template.images, onChange: (updated) => attrs.onChange({ ...attrs.template, images: updated }) }),
									),
							},
							//
							// Data Sources
							//
							{
								id: 'data-sources',
								title: 'Data Sources',
								icon: 'analytics',
								centerContainer: true,
								render: () =>
									m('div.ph3', [
										m(EditorHeader, {
											title: 'Data Sources',
											description: 'Add and remove data sources. Entries of these data sources will be linked to this template.',
										}), //
										m(
											'div.mb3',
											m(SourceSelect, {
												sources: attrs.template.dataSources,
												onChange: (updated) => attrs.onChange({ ...attrs.template, dataSources: updated }),
											}),
										),
										m(
											Flex,
											{ gap: 2 },
											attrs.template.dataSources.map((s) =>
												m(
													Label,
													{ intent: 'primary' },
													m(Flex, { gap: 2 }, [
														s,
														m(Icon, {
															icon: 'close',
															onClick: () => attrs.onChange({ ...attrs.template, dataSources: attrs.template.dataSources.filter((ds) => ds !== s) }),
														}),
													]),
												),
											),
										),
									]),
							},
							//
							// Global Config
							//
							{ id: 'global-config', title: 'Global Config', icon: 'cog', centerContainer: true, render: () => null },
							//
							// Data Skeleton
							//
							{
								id: 'data-skeleton',
								title: 'Data Skeleton',
								icon: 'body',
								render: () =>
									m(Flex, { className: '.flex-grow-1.h-100', direction: 'column', key: 'data-skeleton' }, [
										m(Flex, { className: '.pa2.w-100.bg-white.bb.b--black-10', justify: 'between', key: 'data-skeleton-helper' }, [
											m(EntrySelect, {
												className: '.w5',
												entries: state.entries,
												onChange: (e) => attrs.onChange({ ...attrs.template, skeletonData: e.data }),
											}),
											m(Button, { onClick: () => autoGenerateSkeleton(attrs) }, 'Auto Generate'),
										]),
										m(Monaco, {
											key: 'data-skeleton-monaco',
											language: 'json',
											value: JSON.stringify(attrs.template.skeletonData, null, 2),
											className: '.flex-grow-1',
											wordWrap: 'on',
											onChange: (value) => {
												try {
													attrs.onChange({ ...attrs.template, skeletonData: JSON.parse(value) });
												} catch (e) {
													// Monaco will show the error
												}
											},
										}),
									]),
							},
							//
							// Print Template
							//
							{
								id: 'print-template',
								title: 'Print Template',
								icon: 'code-working',
								render: () =>
									m(Monaco, {
										key: 'print-template',
										language: 'html',
										value: attrs.template.printTemplate,
										className: '.flex-grow-1',
										completion: createNunjucksCompletionProvider({
											it: attrs.template.skeletonData,
											images: attrs.template.images,
											settings: settings.value,
										}),
										onChange: (value) => attrs.onChange({ ...attrs.template, printTemplate: value }),
									}),
							},
							//
							// List Template
							//
							{
								id: 'list-template',
								title: 'List Template',
								icon: 'code-working',
								render: () =>
									m(Monaco, {
										key: 'list-template',
										language: 'html',
										value: attrs.template.listTemplate,
										className: '.flex-grow-1',
										completion: createNunjucksCompletionProvider({
											it: attrs.template.skeletonData,
											images: attrs.template.images,
											settings: settings.value,
										}),
										onChange: (value) => attrs.onChange({ ...attrs.template, listTemplate: value }),
									}),
							},
						],
					}),
					m(PrintPreviewTemplate, {
						className: '.flex-shrink-0.bl.b--black-10.bg-paper',
						width: 350,
						template: attrs.template,
						it: attrs.template.skeletonData,
					}),
				]),
			];
		},
	};
};
