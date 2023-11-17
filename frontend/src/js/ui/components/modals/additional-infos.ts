import m from 'mithril';

import { popPortal, pushPortal } from 'js/ui/portal';
import Modal from 'js/ui/spectre/modal';
import Input from 'js/ui/spectre/input';
import Flex from 'js/ui/components/layout/flex';
import TextArea from 'js/ui/spectre/text-area';

type AdditionalInfosProps = {
	type: 'generator' | 'template';
	id: string;
	config?: any;
};

const AditionalInfos = (): m.Component<AdditionalInfosProps> => ({
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
				m(
					'div',
					`This is the endpoint to print the ${attrs.type}. Use a POST request containing the ${
						attrs.type === 'template' ? 'entity data' : 'config'
					} as JSON.`,
				),
				m(Input, { value: `http://127.0.0.1:7123/api/extern/print/${attrs.id}` }),
				attrs.config
					? m(Flex, { direction: 'column', gap: 2 }, [
							m('div.divider'),
							m('div.f5.b', 'Config'),
							m('div', 'This is the current config you selected in the generator.'),
							m(TextArea, { value: JSON.stringify(attrs.config, null, '\t'), rows: 10 }),
					  ])
					: null,
			]),
		),
});

export function openAdditionalInfosModal(type: 'generator' | 'template', id: string, config?: any) {
	pushPortal<AdditionalInfosProps>(AditionalInfos, { attributes: { type, id, config } });
}
