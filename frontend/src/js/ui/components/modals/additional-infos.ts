import m from 'mithril';

// @ts-ignore
import { shell } from 'src/js/electron';

import Details from 'js/ui/shoelace/details';
import Divider from 'js/ui/shoelace/divider';
import Input from 'js/ui/shoelace/input';
import Modal from 'js/ui/shoelace/modal';
import TextArea from 'js/ui/shoelace/text-area';

import Flex from 'js/ui/components/layout/flex';

import { popPortal, pushPortal } from 'js/ui/portal';

type AdditionalInfoType = 'generator' | 'template' | 'source';

type AdditionalInfosProps = {
	type: AdditionalInfoType;
	id: string;
	config?: Record<string, unknown>;
};

const typeName = (type: AdditionalInfoType) => {
	switch (type) {
		case 'source':
			return 'data source';
		default:
			return type;
	}
};

const openApiDocs = (e: MouseEvent) => {
	e.preventDefault();
	shell.openExternal('https://sales-and-dungeons.app/docs/advanced/api/');
};

const routes = (type: Exclude<AdditionalInfoType, 'source'>, id: string) => {
	switch (type) {
		case 'generator':
			return m(Details, { summary: 'Print Generator with config', className: '.mt2' }, [
				m(Input, { value: `http://127.0.0.1:7123/api/printGenerator` }),
				m('div.mt2', 'Example POST body'),
				m(TextArea, {
					value: JSON.stringify([id, { some_config_value: 'test' }]),
					rows: 2,
				}),
			]);
		case 'template':
			return [
				m(Details, { summary: 'Print Template with custom Entry', className: '.mt2' }, [
					m(Input, { value: `http://127.0.0.1:7123/api/printTemplate` }),
					m('div.mv2', 'Example POST body'),
					m(TextArea, {
						value: JSON.stringify([id, { id: 'some_entry_id', name: 'some_entry_name', data: {} }, { some_config_value: 'test' }]),
						rows: 2,
					}),
				]),
				m(Details, { summary: 'Print Template with existing Entry', className: '.mt2' }, [
					m(Input, { value: `http://127.0.0.1:7123/api/printTemplateEntry` }),
					m('div.mt2', 'Example POST body'),
					m(TextArea, {
						value: JSON.stringify([id, 'some_entry_id', { some_config_value: 'test' }]),
						rows: 2,
					}),
				]),
			];
	}
};

const identifierDescription = (entityName: string) =>
	`This is the unique identifier of the ${entityName}. It can be used to access the ${entityName} via the API.`;

const AdditionalInfos = (): m.Component<AdditionalInfosProps> => ({
		view: ({ attrs }) => {
			const entityName = typeName(attrs.type);
			return m(
				Modal,
				{ title: 'Additional Information', onClose: popPortal, width: 1000 },
				m(Flex, { direction: 'column', gap: 2 }, [
					m('div.f5.b', 'Identifier'), //
					m('div', identifierDescription(entityName)),
					m(Input, { value: attrs.id }),
					attrs.type !== 'source'
						? [
								m(Divider),
								m(Flex, { gap: 3 }, [
									m(
										'div.w-50.flex-shrink-0',
										m('div.f5.b', 'Print Endpoint'),
										m('div', [
											`This is the endpoint to print the ${attrs.type}. Use a POST request containing the arguments as JSON array. You can find more infos `,
											m('a', { href: '#', onclick: openApiDocs }, 'here'),
											'.',
										]),
										routes(attrs.type, attrs.id),
									),
									attrs.config
										? m(Flex, { direction: 'column', gap: 2, className: '.w-50' }, [
												m('div.f5.b', 'Config'),
												m('div', `This is the current config you selected in the ${attrs.type}.`),
												m(TextArea, { value: JSON.stringify(attrs.config, null, '\t'), rows: 8 }),
											])
										: null,
								]),
							]
						: null,
				]),
			);
		},
	});

export function openAdditionalInfosModal(type: AdditionalInfoType, id: string, config?: Record<string, unknown>) {
	pushPortal<AdditionalInfosProps>(AdditionalInfos, { attributes: { type, id, config } });
}
