import m from 'mithril';

import Input from 'js/ui/spectre/input';
import MiniHeader from 'js/ui/components/atomic/mini-header';
import Config, { ConfigProps } from 'js/ui/components/config/config';

export default {
	name: 'Number',
	default: () => 1,
	view: (): m.Component<ConfigProps> => ({
		view: ({ attrs }) => [
			!attrs.inEdit ? null : m(MiniHeader, 'Default'),
			m(Input, {
				value: (attrs.value ?? 0).toString(),
				onChange: (value: string) => attrs.onChange(parseInt(value)),
				useBlur: true,
			}),
		],
	}),
} as Config;
