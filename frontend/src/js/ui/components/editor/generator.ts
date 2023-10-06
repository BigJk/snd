import m from 'mithril';

import { fillConfigValues } from 'js/types/config';
import Generator, { sanitizeConfig } from 'js/types/generator';

import { createNunjucksCompletionProvider } from 'js/core/monaco/completion-nunjucks';
import { settings } from 'js/core/store';

import Editor from 'js/ui/components/config/editor';
import BasicInfo from 'js/ui/components/editor/basic-info';
import Images from 'js/ui/components/editor/images';
import Flex from 'js/ui/components/layout/flex';
import Monaco from 'js/ui/components/monaco';
import PrintPreviewTemplate from 'js/ui/components/print-preview-template';
import SideMenuPager from 'js/ui/components/view-layout/side-menu-pager';

type GeneratorEditorProps = {
	generator: Generator;
	onChange: (updated: Generator) => void;
};

type GeneratorEditorState = {
	loading: boolean;
	selectedMenu: string;
	config: Record<string, any>;
};

export default (): m.Component<GeneratorEditorProps> => {
	let state: GeneratorEditorState = {
		loading: false,
		selectedMenu: 'basic-info',
		config: {}, // TODO: add config page
	};

	return {
		oninit({ attrs }) {
			state.config = fillConfigValues({}, attrs.generator.config);
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
							{
								id: 'basic-info',
								title: 'Basic Info',
								icon: 'clipboard',
								render: () => m(BasicInfo, { info: attrs.generator, onChange: (updated) => attrs.onChange({ ...attrs.generator, ...updated }) }),
							}, //
							{
								id: 'images',
								title: 'Images',
								icon: 'images',
								render: () =>
									m(Images, { images: attrs.generator.images, onChange: (updated) => attrs.onChange({ ...attrs.generator, images: updated }) }),
							},
							{ id: 'data-sources', title: 'Data Sources', icon: 'analytics', render: () => null },
							{ id: 'config', title: 'Config', icon: 'cog', render: () => null },
							{
								id: 'test-config',
								title: 'Test Config',
								icon: 'cog',
								render: () =>
									m(Editor, {
										current: state.config,
										definition: [
											{
												key: 'seed',
												name: 'Seed',
												description: 'The seed used to generate the template',
												type: 'Seed',
												default: 'TEST_SEED',
											},
											...(attrs.generator ? attrs.generator.config : []),
										],
										onChange: (updated) => {
											console.log(updated);
											state.config = updated;
											m.redraw();
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
										value: attrs.generator.printTemplate,
										className: '.flex-grow-1',
										completion: createNunjucksCompletionProvider({
											config: state.config,
											images: attrs.generator.images,
											settings: settings.value,
										}),
										onChange: (value) => {
											attrs.onChange({ ...attrs.generator, printTemplate: value });
											m.redraw();
										},
									}),
							},
						],
					}),
					m(PrintPreviewTemplate, {
						className: '.flex-shrink-0.bl.b--black-10.bg-paper',
						width: 350,
						generator: attrs.generator,
						config: sanitizeConfig(attrs.generator, state.config),
					}),
				]),
			];
		},
	};
};