import m from 'mithril';

import Template from 'js/types/template';

import { createNunjucksCompletionProvider } from 'js/core/monaco/completion-nunjucks';
import { settings } from 'js/core/store';

import BasicInfo from 'js/ui/components/editor/basic-info';
import Images from 'js/ui/components/editor/images';
import Flex from 'js/ui/components/layout/flex';
import Monaco from 'js/ui/components/monaco';
import PrintPreviewTemplate from 'js/ui/components/print-preview-template';
import SideMenuPager from 'js/ui/components/view-layout/side-menu-pager';
import SourceSelect from 'js/ui/components/source-select';
import Label from 'js/ui/spectre/label';
import Icon from 'js/ui/components/atomic/icon';
import EditorHeader from 'js/ui/components/view-layout/property-header';

type TemplateEditorProps = {
	template: Template;
	onChange: (updated: Template) => void;
	editMode?: boolean;
};

type TemplateEditorState = {
	loading: boolean;
	selectedMenu: string;
	config: Record<string, any>;
};

export default (): m.Component<TemplateEditorProps> => {
	let state: TemplateEditorState = {
		loading: false,
		selectedMenu: 'basic-info',
		config: {}, // TODO: add config page
	};

	return {
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
									m(Monaco, {
										key: 'data-skeleton',
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
