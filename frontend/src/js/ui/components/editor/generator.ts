import m from 'mithril';
import * as monaco from 'monaco-editor';

import { fillConfigValues } from 'js/types/config';
import Generator, { sanitizeConfig, seed } from 'js/types/generator';
import { runAICodeEditorAction } from 'js/core/ai-editor';
import { createOnMessage } from 'js/core/generator-ipc';
import { createNunjucksCompletionProvider } from 'js/core/monaco/completion-nunjucks';
import { settings } from 'js/core/store';

import Button from 'js/ui/shoelace/button';
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
	printTemplateEditor?: monaco.editor.IStandaloneCodeEditor;
	aiEditorLoading: boolean;
};

export default (): m.Component<GeneratorEditorProps> => {
	let state: GeneratorEditorState = {
		loading: false,
		selectedMenu: 'basic-info',
		config: {},
		errors: [],
		printTemplateEditor: undefined,
		aiEditorLoading: false,
	};

	const runGeneratorAIAction = (attrs: GeneratorEditorProps, mode: 'generate' | 'edit') => {
		const editor = state.printTemplateEditor;
		if (!editor) return;
		const dataSources = (attrs.generator.dataSources ?? []).join(', ');
		const configPreview = JSON.stringify(attrs.generator.config ?? [], null, 2);
		const configSummary = configPreview.length > 5000 ? `${configPreview.slice(0, 5000)}\n... (truncated)` : configPreview;

		const system = `
You are an expert HTML and Nunjucks template assistant for Sales & Dungeons.
Return code only.
Do not use markdown fences.
Do not explain the output.
Keep the response valid for direct insertion into a generator print template.

Output constraints:
- The final print is on a black-and-white thermal receipt printer.
- The printable width is limited to about ${settings.value.printerWidth}px.
- Use a narrow, single-column receipt-style layout.
- Avoid gradients, shadows, transparency effects, or color-dependent styling.
- Prefer strong contrast with simple borders/spacing for structure.
- Keep typography legible on small paper; avoid tiny text.
- Use at least around 22px as a baseline minimum font size for key text, otherwise thermal print output is often too small.
- Avoid relying on backgrounds or decorative effects that do not print well.
- If dynamic content with randomness is needed, prefer JavaScript output generation using \`.innerHTML\` or \`document.write()\`.
- For randomness, always use \`random()\` and never use \`Math.random()\` because \`random()\` is seeded.

Nunjucks context:
- Generator config values are available as \`config\`.
- Linked data sources are available as \`sources\`.
- App settings are available as \`settings\`.
- Uploaded generator images are available as \`images\` (example: \`images["logo"]\`).
- Use normal Nunjucks syntax like \`{{ config.seed }}\`, \`{% if ... %}\`, and \`{% for item in ... %}\`.

Current generator config definition:
${configSummary}
Linked data sources: ${dataSources || 'none'}
		`.trim();

		runAICodeEditorAction({
			editor,
			mode,
			editSource: 'ai-generator-editor',
			systemPrompt: system,
			descriptionEdit: 'Describe exactly how the selected HTML/Nunjucks should be changed',
			descriptionGenerate: 'Describe what HTML/Nunjucks should be generated and inserted at the cursor',
			placeholderEdit: 'Example: Make this section more compact and reduce horizontal spacing.',
			placeholderGenerate: 'Example: Create a compact random loot block for a receipt printer.',
			buildUserPrompt: (prompt, selectedText, editorValue) =>
				mode === 'edit'
					? `
Task:
${prompt}

Selected code to replace:
${selectedText}
					`.trim()
					: `
Task:
${prompt}

Current generator print template:
${editorValue}
					`.trim(),
			setLoading: (loading) => {
				state.aiEditorLoading = loading;
				m.redraw();
			},
		});
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
									m(Flex, { className: '.h-100', direction: 'column' }, [
										m(Monaco, {
											language: 'html',
											value: attrs.generator.printTemplate,
											className: '.flex-grow-1',
											onEditor: (editor) => {
												state.printTemplateEditor = editor;
											},
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
										!settings.value.aiEnabled
											? null
											: m(Flex, { gap: 2, className: '.pa2.bg-white.bt.b--black-10' }, [
													m(
														Button,
														{
															size: 'sm',
															intend: 'primary',
															loading: state.aiEditorLoading,
															onClick: () => runGeneratorAIAction(attrs, 'generate'),
														},
														'Generate with AI',
													),
													m(
														Button,
														{
															size: 'sm',
															intend: 'primary',
															loading: state.aiEditorLoading,
															onClick: () => runGeneratorAIAction(attrs, 'edit'),
														},
														'Edit Selection with AI',
													),
												]),
									]),
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
