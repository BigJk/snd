import m from 'mithril';

import Template from 'js/types/template';

import { createNunjucksCompletionProvider } from 'js/core/monaco/completion-nunjucks';
import { settings } from 'js/core/store';
import { render } from 'js/core/templating';

import BasicInfo from 'js/ui/components/editor/basic-info';
import Images from 'js/ui/components/editor/images';
import Monaco from 'js/ui/components/monaco';
import PrintPreviewHover from 'js/ui/components/print-preview-hover';
import SideMenuPager from 'js/ui/components/view-layout/side-menu-pager';

type TemplateEditorProps = {
	template: Template;
	onChange: (updated: Template) => void;
};

type TemplateEditorState = {
	lastRendered: string;
	selectedMenu: string;
};

export default (): m.Component<TemplateEditorProps> => {
	let state: TemplateEditorState = {
		lastRendered: '',
		selectedMenu: 'basic-info',
	};

	return {
		oninit({ attrs }) {
			render(attrs.template.printTemplate, {
				it: attrs.template.skeletonData,
				settings: settings.value,
				images: attrs.template.images,
			}).then((html) => {
				state.lastRendered = html;
				m.redraw();
			});
		},
		view({ attrs }) {
			return [
				m(SideMenuPager, {
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
				m(PrintPreviewHover, {
					hide: !(state.selectedMenu === 'print-template' || state.selectedMenu === 'list-template' || state.selectedMenu === 'data-skeleton'),
					width: 350,
					content: state.lastRendered,
					origin: 'bottom-right',
					initialX: 25,
					initialY: 25,
				}),
			];
		},
	};
};
