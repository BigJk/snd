import m from 'mithril';
import Modal from 'js/ui/spectre/modal';
import { clearPortal, setPortal } from 'js/ui/portal';
import Flex from 'js/ui/components/layout/flex';
import Input from 'js/ui/spectre/input';
import Button from 'js/ui/spectre/button';
import FormGroup from 'js/ui/spectre/form-group';
import HorizontalProperty from 'js/ui/components/horizontal-property';

type CreateSourceEntryProps = {
	onCreate: (id: string, name: string) => void;
	onClose: () => void;
};

type CreateSourceEntryResponse = {
	id: string;
	name: string;
};

const CreateSourceEntry = (): m.Component<CreateSourceEntryProps> => {
	let id = '';
	let name = '';

	return {
		view({ attrs }) {
			return m(
				Modal,
				{
					title: 'Create Data Source Entry',
					icon: 'add',
					onClose: () => {
						clearPortal();
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
						m(Input, { value: id, placeholder: 'test/some-name', onChange: (val: string) => (id = val) }),
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
						m(Button, { intend: 'success', onClick: () => attrs.onCreate(id, name), disabled: name.length === 0 || id.length === 0 }, 'Create'),
					),
				]),
			);
		},
	};
};

export default (): Promise<CreateSourceEntryResponse> => {
	return new Promise((resolve, reject) => {
		setPortal<CreateSourceEntryProps>(CreateSourceEntry, {
			attributes: {
				onCreate: (id, name) => {
					clearPortal();
					resolve({ id, name });
				},
				onClose: () => {
					reject();
				},
			},
		});
	});
};
