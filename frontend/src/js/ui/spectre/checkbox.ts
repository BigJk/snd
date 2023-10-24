import m from 'mithril';

type CheckboxProps = {
	className?: string;
	checked: boolean;
	onChange?: (checked: boolean) => void;
};

export default (): m.Component<CheckboxProps> => ({
	view({ attrs }) {
		return m(`label.form-switch${attrs.className ?? ''}`, [
			m('input', {
				type: 'checkbox',
				checked: attrs.checked,
				onchange: (event: Event) => {
					if (!attrs.onChange) return;
					attrs.onChange((event.target as HTMLInputElement).checked);
				},
			}), //
			m('i.form-icon'),
		]);
	},
});
