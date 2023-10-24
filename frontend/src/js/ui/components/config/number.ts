import m from 'mithril';

import MiniHeader from 'js/ui/components/atomic/mini-header';
import Input from 'js/ui/spectre/input';

import Config, { ConfigProps } from 'js/ui/components/config/config';

export default {
	name: 'Number',
	default: () => 1,
	view: (): m.Component<ConfigProps> => ({
		view: ({ attrs }) => [
			!attrs.inEdit ? null : m(MiniHeader, 'Default'),
			m(Input, {
				value: attrs.value.toString(),
				onChange: (value: string) => attrs.onChange(parseInt(value)),
				useBlur: true,
			}),
		],
	}),
} as Config;
