import m from 'mithril';

import Input from 'js/ui/shoelace/input';

import MiniHeader from 'js/ui/components/atomic/mini-header';
import Config, { ConfigProps } from 'js/ui/components/config/config';

export default {
	name: 'Text',
	default: () => 'Hello World',
	view: (): m.Component<ConfigProps> => ({
		view: ({ attrs }) => [
			!attrs.inEdit ? null : m(MiniHeader, 'Default'),
			m(Input, {
				value: attrs.value as string,
				onChange: (value: string) => attrs.onChange(value),
			}),
		],
	}),
} as Config;
