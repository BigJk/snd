import m from 'mithril';

export type OnInputEvent = {
	target: {
		value: string;
	};
	value: string;
};

type SelectProps = {
	className?: string;
	keys: string[];
	names?: string[];
	selected: string | null;
	default?: string;
	noDefault?: boolean;
	width?: number;
	onInput: (e: OnInputEvent) => void;
};

export default (): m.Component<SelectProps> => ({
	view({ attrs }) {
		return m(
			`sl-select[size=small]${attrs.className ?? ''}`,
			{
				value: attrs.selected?.replaceAll(' ', '%_%') ?? '',
				defaultValue: attrs.default,
				'onsl-change': (e: any) => {
					const value = e.target.value.replaceAll('%_%', ' ');
					attrs.onInput({
						target: {
							value,
						},
						value,
					});
				},
			},
			attrs.keys.map((k, i) => m('sl-option', { value: k.replaceAll(' ', '%_%') }, attrs.names ? attrs.names[i] : k)),
		);
	},
});
