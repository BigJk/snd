import m from 'mithril';

import Checkbox from 'js/ui/shoelace/checkbox';
import Input from 'js/ui/shoelace/input';
import Label from 'js/ui/shoelace/label';
import Select, { OnInputEvent } from 'js/ui/shoelace/select';

import MiniHeader from 'js/ui/components/atomic/mini-header';
import Config, { ConfigProps } from 'js/ui/components/config/config';

export default {
	name: 'Multiple Options',
	default: () => ({
		choices: ['Option A', 'Option B'],
		allowDuplicate: false,
		selected: ['Option A'],
	}),
	view: (): m.Component<ConfigProps> => ({
		view: ({ attrs }) => {
			const value = attrs.value as {
				choices: string[];
				allowDuplicate: boolean;
				selected: string[];
			};

			return m('div', [
				...(attrs.inEdit
					? [
							m(MiniHeader, 'Options'),
							m(Input, {
								className: '.mb2',
								value: value.choices.join(','),
								onChange: (choices: string) => attrs.onChange({ ...value, choices: choices.split(',') }),
							}),
							m(MiniHeader, 'Allow Duplicate'),
							m(Checkbox, {
								className: '.mb2',
								checked: value.allowDuplicate,
								onChange: (allowDuplicate: boolean) => attrs.onChange({ ...value, allowDuplicate }),
							}),
						]
					: []), //
				// @ts-ignore
				!attrs.inEdit ? null : m(MiniHeader, 'Default'),
				m(Select, {
					className: '.mb2',
					selected: null,
					keys: value.choices,
					onInput: (e: OnInputEvent) =>
						attrs.onChange({
							...value,
							selected: value.allowDuplicate ? [...value.selected, e.target.value] : [...new Set([...value.selected, e.target.value])],
						}),
				}),
				...value.selected.map((v, i) =>
					m(
						Label,
						{
							className: '.mr2',
							intend: 'primary',
							onRemove: () => {
								attrs.onChange({
									...value,
									selected: value.selected.filter((_, j) => j !== i),
								});
							},
						},
						v,
					),
				),
			]);
		},
	}),
} as Config;
