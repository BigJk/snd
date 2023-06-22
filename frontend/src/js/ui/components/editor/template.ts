import m from 'mithril';

import Template from 'js/types/template';

import { createNunjucksCompletionProvider } from 'js/core/monaco/completion-nunjucks';
import { settings } from 'js/core/store';

import BasicInfo from 'js/ui/components/editor/basic-info';
import Images from 'js/ui/components/editor/images';
import Monaco from 'js/ui/components/monaco';
import SideMenuPager from 'js/ui/components/view-layout/side-menu-pager';

type TemplateEditorProps = {
	template: Template;
	onChange: (updated: Template) => void;
};

export default (): m.Component<TemplateEditorProps> => {
	return {
		view({ attrs }) {
			return m(SideMenuPager, {
				items: [
					{
						title: 'Basic Info',
						icon: 'clipboard',
						render: () => m(BasicInfo, { info: attrs.template, onChange: (updated) => attrs.onChange({ ...attrs.template, ...updated }) }),
					}, //
					{
						title: 'Images',
						icon: 'images',
						render: () => m(Images, { images: attrs.template.images, onChange: (updated) => attrs.onChange({ ...attrs.template, images: updated }) }),
					},
					{ title: 'Data Sources', icon: 'analytics', render: () => null },
					{ title: 'Global Config', icon: 'cog', render: () => null },
					{
						title: 'Data Skeleton',
						icon: 'body',
						render: () =>
							m(Monaco, {
								key: 'data-skeleton',
								language: 'json',
								value: JSON.stringify(attrs.template.skeletonData, null, 2),
								className: '.flex-grow-1',
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
			});
		},
	};
};
