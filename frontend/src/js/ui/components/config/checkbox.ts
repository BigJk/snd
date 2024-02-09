import m from 'mithril';

import Checkbox from 'js/ui/spectre/checkbox';

import MiniHeader from 'js/ui/components/atomic/mini-header';
import Config, { ConfigProps } from 'js/ui/components/config/config';

export default {
	name: 'Checkbox',
	default: () => false,
	view: (): m.Component<ConfigProps> => ({
		view: ({ attrs }) => [
			!attrs.inEdit ? null : m(MiniHeader, 'Default'),
			m(Checkbox, {
				checked: attrs.value,
				onChange: (checked: boolean) => attrs.onChange(checked),
			}),
		],
	}),
} as Config;
