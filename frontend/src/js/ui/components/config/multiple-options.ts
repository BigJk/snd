import m from 'mithril';

import Checkbox from 'js/ui/spectre/checkbox';
import Input from 'js/ui/spectre/input';
import Label from 'js/ui/spectre/label';
import Select, { OnInputEvent } from 'js/ui/spectre/select';

import Icon from 'js/ui/components/atomic/icon';
import Config, { ConfigProps } from 'js/ui/components/config/config';

export default {
	name: 'Multiple Options',
	default: () => ({
		choices: ['Option A', 'Option B'],
		allowDuplicate: false,
		selected: ['Option A'],
	}),
	view: (): m.Component<ConfigProps> => {
		return {
			view: ({ attrs }) => {
				const value = attrs.value as {
					choices: string[];
					allowDuplicate: boolean;
					selected: string[];
				};

				return m('div', [
					...(attrs.inEdit
						? [
								m(Input, {
									value: value.choices.join(','),
									onChange: (choices: string) => attrs.onChange({ ...value, choices: choices.split(',') }),
								}),
								m(Checkbox, {
									checked: value.allowDuplicate,
									onChange: (allowDuplicate: boolean) => attrs.onChange({ ...value, allowDuplicate }),
								}),
						  ]
						: []), //
					// @ts-ignore
					m(Select, {
						selected: value.selected,
						keys: value.choices,
						onInput: (e: OnInputEvent) =>
							attrs.onChange({
								...value,
								selected: value.allowDuplicate ? [...value.selected, e.target.value] : [...new Set([...value.selected, e.target.value])],
							}),
					}),
					...value.selected.map((v, i) => {
						return m(
							Label,
							{
								intent: 'primary',
							},
							[
								m('span', v),
								m(Icon, {
									icon: 'close',
									onClick: () => {
										attrs.onChange({
											...value,
											selected: value.selected.filter((_, j) => j !== i),
										});
									},
								}),
							]
						);
					}),
				]);
			},
		};
	},
} as Config;
