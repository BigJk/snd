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

type TemplateEditorProps = {
	template: Template;
	onChange: (updated: Template) => void;
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
							{
								id: 'basic-info',
								title: 'Basic Info',
								icon: 'clipboard',
								render: () => m(BasicInfo, { info: attrs.template, onChange: (updated) => attrs.onChange({ ...attrs.template, ...updated }) }),
							}, //
							{
								id: 'images',
								title: 'Images',
								icon: 'images',
								render: () =>
									m(Images, { images: attrs.template.images, onChange: (updated) => attrs.onChange({ ...attrs.template, images: updated }) }),
							},
							{ id: 'data-sources', title: 'Data Sources', icon: 'analytics', render: () => null },
							{ id: 'global-config', title: 'Global Config', icon: 'cog', render: () => null },
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
												// monaco will show the error
											}
										},
									}),
							},
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
