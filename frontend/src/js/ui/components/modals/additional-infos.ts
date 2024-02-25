import m from 'mithril';

// @ts-ignore
import { shell } from 'src/js/electron';

import Input from 'js/ui/spectre/input';
import Modal from 'js/ui/spectre/modal';
import TextArea from 'js/ui/spectre/text-area';

import Flex from 'js/ui/components/layout/flex';

import { popPortal, pushPortal } from 'js/ui/portal';

type AdditionalInfosProps = {
	type: 'generator' | 'template';
	id: string;
	config?: any;
};

const AditionalInfos = (): m.Component<AdditionalInfosProps> => {
	const routes = (attrs: AdditionalInfosProps) => {
		switch (attrs.type) {
			case 'generator':
				return [
					m(Input, { value: `http://127.0.0.1:7123/api/printGenerator` }),
					m('div', 'Example POST body'),
					m(TextArea, {
						value: JSON.stringify([attrs.id, { some_config_value: 'test' }]),
						rows: 2,
					}),
				];
			case 'template':
				return [
					m('div.b.mt2', 'Print Template with custom Entry'),
					m(Input, { value: `http://127.0.0.1:7123/api/printTemplate` }),
					m('div', 'Example POST body'),
					m(TextArea, {
						value: JSON.stringify([attrs.id, { id: 'some_entry_id', name: 'some_entry_name', data: {} }, { some_config_value: 'test' }]),
						rows: 2,
					}),
					m('div.b.mt2', 'Print Template with existing Entry'),
					m(Input, { value: `http://127.0.0.1:7123/api/printTemplateEntry` }),
					m('div', 'Example POST body'),
					m(TextArea, {
						value: JSON.stringify([attrs.id, 'some_entry_id', { some_config_value: 'test' }]),
						rows: 2,
					}),
				];
		}
	};

	return {
		view: ({ attrs }) =>
			m(
				Modal,
				{ title: 'Additional Infos', onClose: popPortal },
				m(Flex, { direction: 'column', gap: 2 }, [
					m('div.f5.b', 'Identifier'), //
					m('div', `This is the unique identifier of the ${attrs.type}. It can be used to access the ${attrs.type} via the API.`),
					m(Input, { value: attrs.id }),
					m('div.divider'),
					m('div.f5.b', 'Print Endpoint'),
					m('div', [
						`This is the endpoint to print the ${attrs.type}. Use a POST request containing the arguments as JSON array. You can find more infos `,
						m(
							'a',
							{
								href: '#',
								onclick: (e) => {
									e.preventDefault();
									shell.openExternal('https://sales-and-dungeons.app/docs/advanced/api/');
								},
							},
							'here',
						),
						'.',
					]),
					routes(attrs),
					attrs.config
						? m(Flex, { direction: 'column', gap: 2 }, [
								m('div.divider'),
								m('div.f5.b', 'Config'),
								m('div', `This is the current config you selected in the ${attrs.type}.`),
								m(TextArea, { value: JSON.stringify(attrs.config, null, '\t'), rows: 4 }),
						  ])
						: null,
				]),
			),
	};
};

export function openAdditionalInfosModal(type: 'generator' | 'template', id: string, config?: any) {
	pushPortal<AdditionalInfosProps>(AditionalInfos, { attributes: { type, id, config } });
}
