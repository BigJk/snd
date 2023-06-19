import m from 'mithril';

type InputProps = {
	className?: string;
	value: string;
	placeholder?: string;
	type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
	onChange?: (value: string) => void;
	useBlur?: boolean;
};

export default (): m.Component<InputProps> => {
	return {
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
				'input.form-input',
				{
					value: attrs.value,
					placeholder: attrs.placeholder,
					type: attrs.type ?? 'text',
					...handler,
				},
				[]
			);
		},
	};
};
