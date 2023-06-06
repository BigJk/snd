import m from 'mithril';

type BoxProps = {
	classNames?: string;
	maxWidth?: number;
	width?: number;
};

/**
 * Box component: renders a box with a max width or width.
 */
export default (): m.Component<BoxProps> => {
	return {
		view({ attrs, children }) {
			let style: any = {};

			if (attrs.maxWidth !== undefined && attrs.maxWidth > 0) {
				style['max-width'] = `${attrs.maxWidth}px`;
			}

			if (attrs.width !== undefined && attrs.width > 0) {
				style['width'] = `${attrs.width}px`;
			}

			return m(`div.br3.dib.pa2.bg-black-05${attrs.classNames ?? ''}`, { style }, children);
		},
	};
};
