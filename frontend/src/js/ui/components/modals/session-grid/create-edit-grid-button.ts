import m from 'mithril';

import { buildId } from 'js/types/basic-info';
import {
	GridElement,
	GridGeneratorElement,
	GridPrinterCommandElement,
	GridTemplateElement,
	isGridGeneratorElement,
	isGridPrinterCommandElement,
	isGridTemplateElement,
} from 'js/types/session-grid';
import { safePromise } from 'js/core/safe';
import { getGridGeneratorConfigChoices, getGridTemplateChoices, getGridTemplateConfigChoices } from 'js/core/session-grid';
import { generators, templates } from 'js/core/store';

import Button from 'js/ui/shoelace/button';
import Checkbox from 'js/ui/shoelace/checkbox';
import ColorPicker from 'js/ui/shoelace/color-picker';
import Input from 'js/ui/shoelace/input';
import Modal from 'js/ui/shoelace/modal';
import Select from 'js/ui/shoelace/select';

import HorizontalProperty from 'js/ui/components/horizontal-property';
import Grid from 'js/ui/components/layout/grid';
import GridButton from 'js/ui/components/session-grid/grid-button';

import { popPortal, pushPortal } from 'js/ui/portal';

type CreateEditGridButtonProps = {
	element?: GridElement;
	onSuccess: (element: GridElement) => void;
};

type CreateEditGridButtonState = {
	isNew: boolean;
	type?: 'template' | 'generator' | 'printer-command';
	element?: GridElement;
	choiceSearch: string;
	choicesTemplate: {
		id: string;
		name: string;
		source?: string;
	}[];
	choicesTemplateConfig: string[];
	choicesGenerator: string[];
};

const createEditGridButton = (props: CreateEditGridButtonProps) => (): m.Component => {
	let state: CreateEditGridButtonState = {
		isNew: !props.element,
		type: (() => {
			if (!props.element) {
				return undefined;
			}

			if (isGridTemplateElement(props.element)) {
				return 'template';
			}
			if (isGridGeneratorElement(props.element)) {
				return 'generator';
			}
			if (isGridPrinterCommandElement(props.element)) {
				return 'printer-command';
			}

			return undefined;
		})(),
		element: props.element,
		choiceSearch: '',
		choicesTemplate: [],
		choicesTemplateConfig: [],
		choicesGenerator: [],
	};

	const fetchChoices = async () => {
		if (isGridTemplateElement(state.element)) {
			state.choicesTemplate = await getGridTemplateChoices(state.element, state.choiceSearch);
			const res = await safePromise(getGridTemplateConfigChoices(state.element));
			if (!res.hasError) {
				state.choicesTemplateConfig = res.value;
			} else {
				state.choicesTemplateConfig = [];
			}
		}

		if (isGridGeneratorElement(state.element)) {
			const res = await safePromise(getGridGeneratorConfigChoices(state.element));
			if (!res.hasError) {
				state.choicesGenerator = res.value;
			} else {
				state.choicesGenerator = [];
			}
		}
	};

	const typeSelector = () =>
		m(Select, {
			keys: ['template', 'generator', 'printer-command'],
			names: ['Template', 'Generator', 'Printer Command'],
			selected: state.type,
			onInput: (e) => {
				state.type = e.target.value as 'template' | 'generator' | 'printer-command';
				switch (state.type) {
					case 'template':
						state.element = {
							templateId: '',
						};
						break;
					case 'generator':
						state.element = {
							generatorId: '',
						};
						break;
					case 'printer-command':
						state.element = {
							command: 'cut',
						};
						break;
				}
			},
		});

	const editor = () => {
		const base: any = [
			m(
				HorizontalProperty,
				{
					label: 'Button Name',
					description: 'Leave empty to use the default name',
					bottomBorder: true,
					centered: true,
				},
				m(Input, { value: state.element?.name, placeholder: '', onChange: (val: string) => (state.element!.name = val) }),
			),
			m(
				HorizontalProperty,
				{
					label: 'Button Color',
					description: 'Leave empty to use the default',
					bottomBorder: true,
					centered: true,
				},
				m(ColorPicker, {
					value: state.element?.color,
					onChange: (val: string) => (state.element!.color = val),
				}),
			),
		];

		switch (state.type) {
			case 'template':
				if (!isGridTemplateElement(state.element)) {
					break;
				}
				base.push(
					...[
						m(
							HorizontalProperty,
							{
								label: 'Template',
								description: 'Select a template to use for this button',
								bottomBorder: true,
								centered: true,
							},
							m(Select, {
								keys: templates.value.map((t) => buildId('template', t)),
								names: templates.value.map((t) => t.name),
								selected: state.element.templateId,
								onInput: (e) => {
									if (!isGridTemplateElement(state.element)) {
										return;
									}
									state.element!.templateId = e.target.value;
									state.element!.entryId = undefined;
									state.element!.configName = undefined;
									fetchChoices();
								},
							}),
						),
						m(
							HorizontalProperty,
							{
								label: 'Entry',
								description: 'Pick an entry to use for this button. Can be left empty.',
								bottomBorder: true,
								centered: true,
							},
							m(Select, {
								keys: state.choicesTemplate.map((t) => t.id),
								names: state.choicesTemplate.map((t) => t.name),
								selected: state.element.entryId,
								clearable: true,
								onInput: (e) => {
									if (!isGridTemplateElement(state.element)) {
										return;
									}
									state.element!.entryId = e.target.value;
									state.element!.dataSourceId = state.choicesTemplate.find((t) => t.id === e.target.value)?.source;
								},
							}),
						),
						state.choicesTemplateConfig.length > 0
							? m(
									HorizontalProperty,
									{
										label: 'Config',
										description: 'Pick a config to use for this button. Can be left empty.',
										bottomBorder: true,
										centered: true,
									},
									m(Select, {
										keys: state.choicesTemplateConfig,
										selected: state.element.configName,
										clearable: true,
										onInput: (e) => {
											if (!isGridTemplateElement(state.element)) {
												return;
											}
											state.element!.configName = e.target.value;
										},
									}),
								)
							: null,
					],
				);
				break;
			case 'generator':
				if (!isGridGeneratorElement(state.element)) {
					break;
				}
				base.push(
					...[
						m(
							HorizontalProperty,
							{
								label: 'Generator',
								description: 'Select a generator to use for this button',
								bottomBorder: true,
								centered: true,
							},
							m(Select, {
								keys: generators.value.map((g) => buildId('generator', g)),
								names: generators.value.map((g) => g.name),
								selected: state.element.generatorId,
								onInput: (e) => {
									if (!isGridGeneratorElement(state.element)) {
										return;
									}
									state.element!.generatorId = e.target.value;
									state.element!.configName = undefined;
									fetchChoices();
								},
							}),
						),
						state.choicesGenerator.length > 0
							? m(
									HorizontalProperty,
									{
										label: 'Config',
										description: 'Pick an config to use for this button. Can be left empty.',
										bottomBorder: true,
										centered: true,
									},
									m(Select, {
										keys: state.choicesGenerator,
										selected: state.element.configName,
										clearable: true,
										onInput: (e) => {
											if (!isGridGeneratorElement(state.element)) {
												return;
											}
											state.element!.configName = e.target.value;
										},
									}),
								)
							: null,
						m(
							HorizontalProperty,
							{
								label: 'AI Enabled',
								description: 'Whether to enable AI for this button',
								bottomBorder: true,
								centered: true,
							},
							m(Checkbox, {
								checked: state.element.aiEnabled,
								onChange: (val: boolean) => {
									if (!isGridGeneratorElement(state.element)) {
										return;
									}
									state.element!.aiEnabled = val;
								},
							}),
						),
					],
				);
				break;
			case 'printer-command':
				if (!isGridPrinterCommandElement(state.element)) {
					break;
				}
				base.push(
					m(
						HorizontalProperty,
						{
							label: 'Command',
							description: 'Select the printer command to execute',
							bottomBorder: true,
							centered: true,
						},
						m(Select, {
							keys: ['cut', 'drawer1', 'drawer2'],
							names: ['Cut Paper', 'Open Cash Drawer 1', 'Open Cash Drawer 2'],
							selected: state.element.command,
							onInput: (e) => {
								if (!isGridPrinterCommandElement(state.element)) {
									return;
								}
								state.element!.command = e.target.value as 'cut' | 'drawer1' | 'drawer2';
							},
						}),
					),
				);
				break;
		}

		return m('div', [
			...base,
			m(
				Button,
				{
					intend: 'success',
					className: '.mt2',
					disabled:
						!(state.element as GridTemplateElement)?.templateId &&
						!(state.element as GridGeneratorElement)?.generatorId &&
						!(state.element as GridPrinterCommandElement)?.command,
					onClick: () => {
						if (state.element) {
							props.onSuccess(state.element);
						}
						popPortal();
					},
				},
				'Submit',
			),
		]);
	};

	return {
		view: () =>
			m(
				Modal,
				{
					width: !state.type ? '500px' : '800px',
					title: props.element ? 'Edit Button' : 'Create Button',
					onClose: () => popPortal(),
					className: !state.type ? '' : '.pt0',
				},
				m(
					'div',
					!state.type
						? typeSelector()
						: m(Grid, { columns: '570px 230px' }, [editor(), m('div.pt2', state.element ? m(GridButton, { element: state.element }) : null)]),
				),
			),
	};
};

export function createEditGridButtonModal(props: CreateEditGridButtonProps) {
	pushPortal(createEditGridButton(props));
}
