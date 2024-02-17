import m from 'mithril';

import { css } from 'goober';

type InputProps = {
	className?: string;
	value?: string;
	placeholder?: string;
	type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
	onChange?: (value: string) => void;
	onEnter?: (value: string) => void;
	useBlur?: boolean;
	minimal?: boolean;
	disabled?: boolean;
};

const minimalStyle = css`
	border: none;
	outline: none;
	padding: 0;
	&:focus {
		box-shadow: none;
	}
`;

export default (): m.Component<InputProps> => ({
	view({ attrs }) {
		const onChange = (event: Event) => {
			if (attrs.onChange) attrs.onChange((event.target as HTMLInputElement).value);
		};

		let handler = {};
		if (attrs.useBlur) {
			handler = {
				onblur: onChange,
			};
		} else {
			handler = {
				oninput: onChange,
			};
		}

		if (attrs.onEnter) {
			handler = {
				...handler,
				onkeydown: (event: KeyboardEvent) => {
					if (event.key === 'Enter') {
						if (attrs.onEnter) {
							attrs.onEnter((event.target as HTMLInputElement).value);
							m.redraw();
						}
					}

					// @ts-ignore
					event.redraw = false;
				},
			};
			console.log(handler);
		}

		return m(
			`input.form-input${attrs.className ?? ''}${attrs.minimal ? `.${minimalStyle}` : ''}`,
			{
				value: attrs.value ?? '',
				placeholder: attrs.placeholder,
				type: attrs.type ?? 'text',
				disabled: attrs.disabled,
				...handler,
			},
			[],
		);
	},
});
