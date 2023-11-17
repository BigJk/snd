import m from 'mithril';

type TextAreaProps = {
	className?: string;
	value: string;
	placeholder?: string;
	rows?: number;
	onChange?: (value: string) => void;
};

export default (): m.Component<TextAreaProps> => ({
	view({ attrs }) {
		return m(`textarea.form-input${attrs.className ?? ''}`, {
			value: attrs.value,
			placeholder: attrs.placeholder,
			rows: attrs.rows ?? 3,
			oninput: (event: Event) => {
				if (attrs.onChange) {
					attrs.onChange((event.target as HTMLInputElement).value);
				}
			},
		});
	},
});
