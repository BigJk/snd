import m from 'mithril';

import Input from 'js/ui/spectre/input';
import Select from 'js/ui/spectre/select';

import Config, { ConfigProps } from 'js/ui/components/config/config';

export default {
	name: 'Options',
	default: () => ({
		choices: ['Option A', 'Option B'],
		selected: 'Option A',
	}),
	view: (): m.Component<ConfigProps> => {
		return {
			view: ({ attrs }) => {
				// @ts-ignore
				const select = m(Select, {
					selected: attrs.value.selected,
					keys: attrs.value.choices,
					onInput: (e: any) => attrs.onChange({ ...attrs.value, selected: e.target.value }),
				});

				if (attrs.inEdit) {
					return m('div', [
						m(Input, {
							value: attrs.value.choices.join(','),
							onChange: (value: string) => attrs.onChange({ ...attrs.value, choices: value.split(',') }),
						}),
						select,
					]);
				}
				return select;
			},
		};
	},
} as Config;
