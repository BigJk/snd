import m from 'mithril';

type InputProps = {
	className?: string;
	value: string;
	placeholder?: string;
	type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
	onChange?: (value: string) => void;
};

export default (): m.Component<InputProps> => {
	return {
		view({ attrs }) {
			return m(
				'input.form-input',
				{
					value: attrs.value,
					placeholder: attrs.placeholder,
					type: attrs.type ?? 'text',
					oninput: (event: Event) => {
						if (attrs.onChange) attrs.onChange((event.target as HTMLInputElement).value);
					},
				},
				[]
			);
		},
	};
};
