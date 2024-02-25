import m from 'mithril';

type TextAreaProps = {
	className?: string;
	label?: string;
	value: string;
	placeholder?: string;
	rows?: number;
	onChange?: (value: string) => void;
};

export default (): m.Component<TextAreaProps> => ({
	view({ attrs }) {
		return m(`sl-textarea[size=small][label="${attrs.label ?? ''}"]${attrs.className ?? ''}`, {
			value: attrs.value,
			placeholder: attrs.placeholder,
			rows: attrs.rows ?? 3,
			'onsl-input': (event: Event) => {
				if (attrs.onChange) {
					attrs.onChange((event.target as HTMLInputElement).value);
				}
			},
		});
	},
});
