import m from 'mithril';

import Button from 'js/ui/spectre/button';
import Input from 'js/ui/spectre/input';

import Icon from 'js/ui/components/atomic/icon';
import Config, { ConfigProps } from 'js/ui/components/config/config';
import Flex from 'js/ui/components/layout/flex';

export default {
	name: 'Seed',
	default: () => false,
	view: (): m.Component<ConfigProps> => ({
		view: ({ attrs }) =>
			m(Flex, { className: '.flex-gap-2' }, [
				m(Input, {
					className: '.w-100',
					value: attrs.value as string,
					onChange: (value: string) => attrs.onChange(value),
				}),
				m(
					Button,
					{
						onClick: () => {
							attrs.onChange(Math.ceil(Math.random() * 999999999).toString());
						},
					},
					m(Icon, {
						icon: 'refresh',
					}),
				),
			]),
	}),
} as Config;
