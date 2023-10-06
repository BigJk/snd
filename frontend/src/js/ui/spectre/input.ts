import m from 'mithril';

import { css } from 'goober';

type InputProps = {
	className?: string;
	value?: string;
	placeholder?: string;
	type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
	onChange?: (value: string) => void;
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
