import m from 'mithril';

import { fillConfigValues } from 'js/types/config';
import Generator, { sanitizeConfig, seed } from 'js/types/generator';
import { createOnMessage } from 'js/core/generator-ipc';
import { createNunjucksCompletionProvider } from 'js/core/monaco/completion-nunjucks';
import { settings } from 'js/core/store';

import Label from 'js/ui/shoelace/label';

import ConfigCreator from 'js/ui/components/config/creator';
import Editor from 'js/ui/components/config/editor';
import BasicInfo from 'js/ui/components/editor/basic-info';
import Images from 'js/ui/components/editor/images';
import Flex from 'js/ui/components/layout/flex';
import Monaco from 'js/ui/components/monaco';
import PrintPreviewTemplate, { PrintPreviewError } from 'js/ui/components/print-preview-template';
import SourceSelect from 'js/ui/components/source-select';
import EditorHeader from 'js/ui/components/view-layout/property-header';
import SideMenuPager from 'js/ui/components/view-layout/side-menu-pager';

type GeneratorEditorProps = {
	generator: Generator;
	onChange: (updated: Generator) => void;
	editMode: boolean;
	onRendered?: (html: string) => void;
};

type GeneratorEditorState = {
	loading: boolean;
	selectedMenu: string;
	config: Record<string, any>;
	errors: PrintPreviewError[];
};

export default (): m.Component<GeneratorEditorProps> => {
	let state: GeneratorEditorState = {
		loading: false,
		selectedMenu: 'basic-info',
		config: {},
		errors: [],
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
							//
							// Basic Info
							//
							{
								id: 'basic-info',
								title: 'Basic Info',
								icon: 'clipboard',
								centerContainer: true,
								padding: true,
								render: () =>
									m(BasicInfo, {
										info: attrs.generator,
										hide: [...(attrs.editMode ? ['author', 'slug'] : [])],
										onChange: (updated) => attrs.onChange({ ...attrs.generator, ...updated }),
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
								padding: true,
								render: () =>
									m(Images, { images: attrs.generator.images, onChange: (updated) => attrs.onChange({ ...attrs.generator, images: updated }) }),
							},
							//
							// Data Sources
							//
							{
								id: 'data-sources',
								title: 'Data Sources',
								icon: 'analytics',
								centerContainer: true,
								padding: true,
								render: () =>
									m('div', [
										m(EditorHeader, {
											title: 'Data Sources',
											description:
												'Add and remove static data sources that should not be configurable by the user. Available under the "sources" variable in the template.',
										}), //
										m(
											'div.mb3',
											m(SourceSelect, {
												sources: attrs.generator.dataSources,
												onChange: (updated) => attrs.onChange({ ...attrs.generator, dataSources: updated }),
											}),
										),
										m(
											Flex,
											{ gap: 2, wrap: 'wrap' },
											attrs.generator.dataSources.map((s) =>
												m(
													Label,
													{
														intend: 'primary',
														onRemove: () => attrs.onChange({ ...attrs.generator, dataSources: attrs.generator.dataSources.filter((ds) => ds !== s) }),
													},
													s,
												),
											),
										),
									]),
							},
							//
							// Config
							//
							{
								id: 'config',
								title: 'Config',
								icon: 'cog',
								centerContainer: true,
								padding: true,
								render: () => [
									m(EditorHeader, { title: 'Config', description: 'Setup config parameters for your generator' }),
									m(ConfigCreator, {
										configs: attrs.generator.config,
										onChange: (updated) => attrs.onChange({ ...attrs.generator, config: updated }),
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
								padding: true,
								render: () =>
									m(Editor, {
										current: state.config,
										definition: [
											{
												key: 'seed',
												name: 'Seed',
												description: 'The seed used to generate the template',
												type: 'Seed',
												default: seed(),
											},
											...(attrs.generator ? attrs.generator.config : []),
										],
										onChange: (updated) => {
											state.config = updated;
											m.redraw();
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
										value: attrs.generator.printTemplate,
										className: '.flex-grow-1',
										completion: createNunjucksCompletionProvider({
											config: state.config,
											images: attrs.generator.images,
											settings: settings.value,
											sources: attrs.generator.dataSources,
										}),
										errors: state.errors,
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
						onError: (errors) => (state.errors = errors),
						onRendered: (html) => {
							attrs.onRendered?.(html);
						},
						onMessage: createOnMessage(attrs.generator, state),
					}),
				]),
			];
		},
	};
};
