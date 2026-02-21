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
	value?: string;
	placeholder?: string;
	multiline?: boolean;
	rows?: number;
	buttonText?: string;
	onSuccess: (answer: string) => void;
};

const promptModal = (props: PromptProps) => (): m.Component => {
	let state = props.value ?? '';

	return {
		view: () =>
			m(
				Modal,
				{ title: props.title, className: '.pt0', onClose: () => popPortal() },
				m('div', [
					m(
						HorizontalProperty,
						{
							label: props.label,
							description: props.description,
							bottomBorder: false,
							centered: !(props.multiline ?? false),
							fullSize: props.multiline ?? false,
						},
						m(Input, {
							value: state,
							placeholder: props.placeholder ?? '',
							textarea: props.multiline ?? false,
							rows: props.rows ?? 6,
							onChange: (val: string) => (state = val),
						}),
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
