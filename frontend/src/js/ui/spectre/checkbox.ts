import m from 'mithril';

type CheckboxProps = {
	className?: string;
	checked: boolean;
	onChange?: (checked: boolean) => void;
};

export default (): m.Component<CheckboxProps> => ({
	view({ attrs, children }) {
		return m(
			'sl-switch[size=small]' + (attrs.className ?? ''),
			{
				style: { marginBottom: '2px' },
				checked: attrs.checked,
				'onsl-change': (event: Event) => {
					if (!attrs.onChange) return;
					attrs.onChange((event.target as HTMLInputElement).checked);
				},
			},
			children,
		);
	},
});
