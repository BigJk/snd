import m from 'mithril';
import { debounce } from 'lodash-es';

import Entry from 'js/types/entry';
import Template from 'js/types/template';
import { buildId } from 'src/js/types/basic-info';
import { fillConfigValues } from 'src/js/types/config';
import * as API from 'js/core/api';
import { createNunjucksCompletionProvider } from 'js/core/monaco/completion-nunjucks';
import { settings } from 'js/core/store';
import { addEntryMeta, render } from 'js/core/templating';

import Button from 'js/ui/spectre/button';
import Label from 'js/ui/spectre/label';

import Icon from 'js/ui/components/atomic/icon';
import ConfigCreator from 'js/ui/components/config/creator';
import Editor from 'js/ui/components/config/editor';
import BasicInfo from 'js/ui/components/editor/basic-info';
import Images from 'js/ui/components/editor/images';
import EntrySelect from 'js/ui/components/entry-select';
import Flex from 'js/ui/components/layout/flex';
import Monaco from 'js/ui/components/monaco';
import PrintPreviewTemplate, { PrintPreviewError } from 'js/ui/components/print-preview-template';
import SourceSelect from 'js/ui/components/source-select';
import EditorHeader from 'js/ui/components/view-layout/property-header';
import SideMenuPager from 'js/ui/components/view-layout/side-menu-pager';

import { dialogWarning, error } from 'js/ui/toast';

type TemplateEditorProps = {
	template: Template;
	onChange: (updated: Template) => void;
	onJSONError?: (error: any | null) => void;
	editMode?: boolean;
};

type TemplateEditorState = {
	loading: boolean;
	selectedMenu: string;
	config: Record<string, any>;
	entriesKey: string;
	entries: Entry[];
	listPreview: string;
	jsonSkeleton: string;
	errorsPrint: PrintPreviewError[];
	errorsList: PrintPreviewError[];
};

export default (): m.Component<TemplateEditorProps> => {
	let state: TemplateEditorState = {
		loading: false,
		selectedMenu: 'basic-info',
		config: {},
		entriesKey: '',
		entries: [],
		listPreview: '',
		jsonSkeleton: '{}',
		errorsPrint: [],
		errorsList: [],
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

	const renderListPreview = debounce((val: string, attrs: TemplateEditorProps) => {
		render(
			val,
			{
				it: addEntryMeta(null, attrs.template.skeletonData),
				sources: attrs.template.dataSources,
				config: state.config,
				settings: settings.value,
				images: {},
				aiEnabled: false,
			},
			false,
			true,
		)
			.then((html) => (state.listPreview = html))
			.catch((err) => {
				console.error(err);
				state.errorsList = [err];
			})
			.finally(m.redraw);
	}, 1000);

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
			renderListPreview(attrs.template.listTemplate, attrs);
			state.jsonSkeleton = JSON.stringify(attrs.template.skeletonData, null, 2);
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
							{
								id: 'global-config',
								title: 'Global Config',
								icon: 'cog',
								centerContainer: true,
								render: () => [
									m(EditorHeader, { title: 'Global Config', description: 'Setup global config parameters for your template' }),
									m(ConfigCreator, {
										configs: attrs.template.config ?? [],
										onChange: (updated) => attrs.onChange({ ...attrs.template, config: updated }),
									}),
								],
							},
							//
							// Test Config
							//
							{
								id: 'test-config',
								title: 'Test Config',
								icon: 'cog',
								centerContainer: true,
								render: () => [
									m(EditorHeader, { title: 'Test Config', description: 'Setup a temporary config for testing the template' }),
									m(Editor, {
										current: fillConfigValues(state.config, attrs.template?.config ?? []),
										definition: [...(attrs.template ? attrs.template.config ?? [] : [])],
										onChange: (updated) => {
											state.config = updated;
											m.redraw();
										},
									}),
								],
							},
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
											m(
												Button,
												{
													onClick: () =>
														dialogWarning('Are you sure? This will override the current skeleton!').then(() => autoGenerateSkeleton(attrs)),
												},
												'Auto Generate',
											),
										]),
										m(Monaco, {
											key: 'data-skeleton-monaco',
											language: 'json',
											value: state.jsonSkeleton,
											className: '.flex-grow-1',
											wordWrap: 'on',
											onChange: (value) => {
												state.jsonSkeleton = value;
												try {
													attrs.onChange({ ...attrs.template, skeletonData: JSON.parse(value) });
													if (attrs.onJSONError) attrs.onJSONError(null);
												} catch (e) {
													if (attrs.onJSONError) attrs.onJSONError(e);
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
										errors: state.errorsPrint,
										completion: createNunjucksCompletionProvider({
											it: addEntryMeta(null, attrs.template.skeletonData),
											images: attrs.template.images,
											settings: settings.value,
											sources: attrs.template.dataSources,
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
								// TODO: fix this hack. The '-delete' invalidates the class that is used in the component. This only works
								// because of the concatinated class names.
								className: '-delete.overflow-hidden',
								render: () =>
									m(Flex, { className: '.h-100', direction: 'column' }, [
										m(
											'div.flex-grow-1.overflow-hidden',
											m(Monaco, {
												key: 'list-template',
												language: 'html',
												value: attrs.template.listTemplate,
												className: '.h-100',
												errors: state.errorsList,
												completion: createNunjucksCompletionProvider({
													it: attrs.template.skeletonData,
													images: attrs.template.images,
													settings: settings.value,
													sources: attrs.template.dataSources,
												}),
												onChange: (value) => {
													attrs.onChange({ ...attrs.template, listTemplate: value });
													renderListPreview(value, attrs);
												},
											}),
										),
										m('div.pa3.flex-shrink-0.bg-white.bt.b--black-10.overflow-hidden', [
											m('div.mb3.text-muted', 'Preview'),
											m('div.h3.ph3.pv1.ba.br2.b--black-10.bg-paper.overflow-hidden', m.trust(state.listPreview)),
										]),
									]),
							},
						],
					}),
					m(PrintPreviewTemplate, {
						className: '.flex-shrink-0.bl.b--black-10.bg-paper',
						width: 350,
						template: attrs.template,
						it: attrs.template.skeletonData,
						config: state.config,
						onError: (errors: PrintPreviewError[]) => (state.errorsPrint = errors),
					}),
				]),
			];
		},
	};
};
