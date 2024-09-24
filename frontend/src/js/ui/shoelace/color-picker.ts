import m from 'mithril';

import { buildProps } from './util';

export type ColorPickerProps = {
	className?: string;
	value?: string;
	default?: string;
	onChange?: (color: string) => void;
	swatchColors?: string[];
};

export default (): m.Component<ColorPickerProps> => ({
	view: ({ attrs, children }) =>
		m(
			`sl-color-picker${attrs.className ?? ''}${buildProps({
				defaultValue: attrs.default,
				value: attrs.value,
				swatches: attrs.swatchColors ? attrs.swatchColors.join(';') : undefined,
			})}`,
			{
				'onsl-change': (e: any) => {
					console.log(e);
					attrs.onChange?.(e.target.value);
				},
			},
			children,
		),
});
