import m from 'mithril';

import Button from 'js/ui/shoelace/button';
import Input from 'js/ui/shoelace/input';
import Modal from 'js/ui/shoelace/modal';

import HorizontalProperty from 'js/ui/components/horizontal-property';

import { popPortal, pushPortal } from 'js/ui/portal';

type PromptProps = {
	title: string;
	label: string;
	description: string;
	buttonText?: string;
	onSuccess: (answer: string) => void;
};

const promptModal = (props: PromptProps) => (): m.Component => {
	let state = '';

	return {
		view: () =>
			m(
				Modal,
				{ title: props.title, onClose: () => popPortal() },
				m('div', [
					m(
						HorizontalProperty,
						{
							label: props.label,
							description: props.description,
							bottomBorder: false,
							centered: true,
						},
						m(Input, { value: state, placeholder: '', onChange: (val: string) => (state = val) }),
					),
					m(
						Button,
						{
							intend: 'success',
							className: '.mt2',
							onClick: () => {
								props.onSuccess(state);
								popPortal();
							},
						},
						props.buttonText || 'Submit',
					),
				]),
			),
	};
};

export function openPromptModal(props: PromptProps) {
	pushPortal(promptModal(props));
}
