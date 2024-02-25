import m from 'mithril';

import { ConfigValue } from 'js/types/config';

import Button from 'js/ui/shoelace/button';
import DividerVert from 'js/ui/shoelace/divider-vert';
import IconButton from 'js/ui/shoelace/icon-button';
import Input from 'js/ui/shoelace/input';
import Select from 'js/ui/shoelace/select';

import Icon from 'js/ui/components/atomic/icon';
import MiniHeader from 'js/ui/components/atomic/mini-header';
import types from 'js/ui/components/config/types';
import Flex from 'js/ui/components/layout/flex';
import Spoiler from 'js/ui/components/view-layout/spoiler';

type ConfigValueID = ConfigValue & { _id?: string };

type ConfigCreatorProps = {
	configs: ConfigValueID[];
	onChange: (value: ConfigValue[]) => void;
};

export default (): m.Component<ConfigCreatorProps> => ({
	view({ attrs }) {
		// If we key the configs by it's key value we get problems when the key changes.
		// So we generate a random id and use that as the key.
		attrs.configs.forEach((c) => {
			if (c._id) {
				return;
			}
			c._id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		});

		return m('div', [
			attrs.configs.map((c, i) =>
				m(
					Spoiler,
					{
						key: c._id,
						title: m(Flex, { items: 'center' }, [
							m(Icon, { icon: 'switch', size: 4, className: '.mr2.ml1' }),
							m('div.lh-copy', [m('div.ttu.b', c.name), m('div.f8.text-muted', `${c.type} - ${c.description}`)]),
						]),
						className: '.mb2',
					},
					[
						m(Flex, { gap: 1 }, [
							m(Flex, { direction: 'column', gap: 2, className: '.pa2' }, [
								m(MiniHeader, { noMargin: true }, 'Type'),
								m(Select, {
									selected: c.type,
									keys: Object.keys(types).filter((t) => !t.includes('Path')),
									onInput: (e) => {
										attrs.configs[i].type = e.value;
										attrs.configs[i].default = types[e.value].default();
										attrs.onChange(attrs.configs);
									},
								}),
								m(MiniHeader, { noMargin: true }, 'Key'),
								m(Input, {
									value: c.key,
									onChange: (value) => {
										c.key = value;
										attrs.onChange(attrs.configs);
									},
								}),
								m(MiniHeader, { noMargin: true }, 'Name'),
								m(Input, {
									value: c.name,
									onChange: (value) => {
										c.name = value;
										attrs.onChange(attrs.configs);
									},
								}),
								m(MiniHeader, { noMargin: true }, 'Description'),
								m(Input, {
									value: c.description,
									onChange: (value) => {
										c.description = value;
										attrs.onChange(attrs.configs);
									},
								}),
							]), //
							m(DividerVert, { noSpacing: true }),
							m(
								'div.pa2.bg--black-05',
								m(types[c.type].view, {
									value: c.default,
									inEdit: true,
									onChange: (value: any) => {
										attrs.configs[i].default = value;
										attrs.onChange(attrs.configs);
									},
								}),
							),
						]),
						m(Flex, { gap: 1, justify: 'between', className: '.pa2.bt.b--black-10' }, [
							m(Flex, { gap: 1 }, [
								m(IconButton, {
									icon: 'arrow-up',
									onClick: () => {
										attrs.configs.splice(i - 1, 0, attrs.configs.splice(i, 1)[0]);
										attrs.onChange(attrs.configs);
									},
								}),
								m(IconButton, {
									icon: 'arrow-down',
									onClick: () => {
										attrs.configs.splice(i + 1, 0, attrs.configs.splice(i, 1)[0]);
										attrs.onChange(attrs.configs);
									},
								}),
							]),
							m(
								Button,
								{
									intend: 'error',
									onClick: () => {
										attrs.configs.splice(i, 1);
										attrs.onChange(attrs.configs);
									},
								},
								'Delete',
							),
						]),
					],
				),
			),
			m(
				Flex,
				{ justify: 'end', className: '.mt2' },
				m(
					IconButton,
					{
						intend: 'primary',
						icon: 'add',
						onClick: () => {
							attrs.configs.push({
								key: `name_${Math.floor(Math.random() * 5000)}`,
								name: 'Some Name',
								description: 'Some description',
								type: 'Text',
								default: 'Hello World',
							});
							attrs.onChange(attrs.configs);
						},
					},
					'Add Config',
				),
			),
		]);
	},
});
