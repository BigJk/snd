import m from 'mithril';
import Modal from 'js/ui/spectre/modal';
import { popPortal, pushPortal } from 'js/ui/portal';
import Flex from 'js/ui/components/layout/flex';
import Input from 'js/ui/spectre/input';
import Button from 'js/ui/spectre/button';
import HorizontalProperty from 'js/ui/components/horizontal-property';

type CreateEditEntrySourceEntryProps = {
	id?: string;
	name?: string;
	onCreate: (id: string, name: string) => void;
	onClose: () => void;
};

type CreateEditEntrySourceEntryResponse = {
	id: string;
	name: string;
};

const CreateEditEntry = (): m.Component<CreateEditEntrySourceEntryProps> => {
	let id = '';
	let name = '';

	return {
		oninit: ({ attrs }) => {
			id = attrs.id ?? '';
			name = attrs.name ?? '';
		},
		view({ attrs }) {
			return m(
				Modal,
				{
					title: attrs.id ? 'Edit Data Source Entry' : 'Create Data Source Entry',
					icon: attrs.id ? 'create' : 'add',
					onClose: () => {
						popPortal();
						attrs.onClose();
					},
				},
				m(Flex, { direction: 'column', gap: 2 }, [
					m(
						HorizontalProperty,
						{
							label: 'ID',
							description: 'The unique ID of the entry.',
							bottomBorder: true,
							centered: true,
						},
						m(Input, { value: attrs.id ? attrs.id : id, placeholder: 'test/some-name', disabled: !!attrs.id, onChange: (val: string) => (id = val) }),
					),
					m(
						HorizontalProperty,
						{
							label: 'Name',
							description: 'The human readable name of the entry.',
							bottomBorder: true,
							centered: true,
						},
						m(Input, { value: name, placeholder: 'Evil Monster', onChange: (val: string) => (name = val) }),
					),
					m(
						'div',
						m(
							Button,
							{ intend: 'success', onClick: () => attrs.onCreate(id, name), disabled: name.length === 0 || id.length === 0 },
							attrs.id ? 'Save' : 'Create',
						),
					),
				]),
			);
		},
	};
};

export default (id?: string, name?: string): Promise<CreateEditEntrySourceEntryResponse> =>
	new Promise((resolve, reject) => {
		pushPortal<CreateEditEntrySourceEntryProps>(CreateEditEntry, {
			attributes: {
				id,
				name,
				onCreate: (id, name) => {
					popPortal();
					resolve({ id, name });
				},
				onClose: () => {
					reject();
				},
			},
		});
	});
