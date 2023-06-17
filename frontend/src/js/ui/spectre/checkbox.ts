import m from 'mithril';

type CheckboxProps = {
	checked: boolean;
	onChange?: (checked: boolean) => void;
};

export default (): m.Component<CheckboxProps> => {
	return {
		view({ attrs }) {
			return m('label.form-switch', [
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
	};
};
