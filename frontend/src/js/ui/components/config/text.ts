import m from 'mithril';

import Input from 'js/ui/spectre/input';

import Config, { ConfigProps } from 'js/ui/components/config/config';

export default {
	name: 'Text',
	default: () => false,
	view: (): m.Component<ConfigProps> => ({
		view: ({ attrs }) =>
			m(Input, {
				value: attrs.value as string,
				onChange: (value: string) => attrs.onChange(value),
			}),
	}),
} as Config;
