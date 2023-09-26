import m from 'mithril';

import Checkbox from 'js/ui/spectre/checkbox';

import Config, { ConfigProps } from 'js/ui/components/config/config';

export default {
	name: 'Checkbox',
	default: () => false,
	view: (): m.Component<ConfigProps> => {
		return {
			view: ({ attrs }) => {
				return m(Checkbox, {
					checked: attrs.value,
					onChange: (checked: boolean) => attrs.onChange(checked),
				});
			},
		};
	},
} as Config;
