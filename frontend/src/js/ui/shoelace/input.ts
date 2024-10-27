import m from 'mithril';

import { css } from 'goober';

type InputProps = {
	key?: string;
	className?: string;
	label?: string;
	value?: string;
	placeholder?: string;
	type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
	size?: 'small' | 'medium' | 'large';
	onChange?: (value: string) => void;
	onEnter?: (value: string) => void;
	useBlur?: boolean;
	minimal?: boolean;
	disabled?: boolean;
	clearable?: boolean;
	suffix?: m.Children;
};

const minimalStyle = css`
	&::part(base),
	&::part(input) {
		border: none !important;
		outline: none !important;
		box-shadow: none !important;
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
				'onsl-blur': onChange,
			};
		} else {
			handler = {
				'onsl-input': onChange,
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
		}

		return m(
			`sl-input${attrs.className ?? ''}[size=${attrs.size ?? 'small'}][label=${attrs.label ?? ''}]${attrs.clearable ? '[clearable]' : ''}${attrs.minimal ? '.' + minimalStyle : ''}`,
			{
				key: attrs.key,
				value: attrs.value ?? '',
				placeholder: attrs.placeholder,
				type: attrs.type ?? 'text',
				disabled: attrs.disabled,
				...handler,
			},
			[attrs.suffix ? m('slot', { slot: 'suffix' }, attrs.suffix) : null],
		);
	},
});
