import m from 'mithril';

import Input from 'js/ui/spectre/input';

import Config, { ConfigProps } from 'js/ui/components/config/config';

export default {
	name: 'Number',
	default: () => false,
	view: (): m.Component<ConfigProps> => {
		return {
			view: ({ attrs }) => {
				return m(Input, {
					value: attrs.value.toString(),
					onChange: (value: string) => attrs.onChange(parseInt(value)),
					useBlur: true,
				});
			},
		};
	},
} as Config;
