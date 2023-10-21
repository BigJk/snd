import m from 'mithril';
import { ConfigValue } from 'js/types/config';
import Input from 'js/ui/spectre/input';
import Icon from 'js/ui/components/atomic/icon';
import Flex from 'js/ui/components/layout/flex';
import Spoiler from 'js/ui/components/view-layout/spoiler';

type ConfigCreatorProps = {
	configs: ConfigValue[];
	onChange: (value: ConfigValue[]) => void;
};

export default (): m.Component<ConfigCreatorProps> => ({
	view({ attrs }) {
		return attrs.configs.map((c, i) =>
			m(
				Spoiler,
				{
					title: m(Flex, { items: 'center' }, [
						m(Icon, { icon: 'switch', size: 4, className: '.mr2.ml1' }),
						m('div.lh-copy', [m('div.ttu.b', c.name), m('div.f8.text-muted', `${c.type} - ${c.description}`)]),
					]),
					className: '.mb2',
				},
				m(Flex, { gap: 2 }, [
					m(Flex, { direction: 'column', gap: 2 }, [
						m(Input, {
							value: c.key,
							onChange: (value) => {
								c.key = value;
								attrs.onChange(attrs.configs);
							},
						}),
						m(Input, {
							value: c.name,
							onChange: (value) => {
								c.name = value;
								attrs.onChange(attrs.configs);
							},
						}),
						m(Input, {
							value: c.description,
							onChange: (value) => {
								c.description = value;
								attrs.onChange(attrs.configs);
							},
						}),
					]), //
					m('div.pa2.bg--black-05'),
				]),
			),
		);
	},
});
