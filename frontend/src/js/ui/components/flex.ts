import m from 'mithril';

type FlexProps = {
	className?: string;
	style?: Record<any, any>;
	direction?: 'row' | 'column';
	items?: 'start' | 'center' | 'end';
	justify?: 'start' | 'center' | 'end' | 'between';
	wrap?: 'wrap' | 'nowrap';
	inline?: boolean;
};

/**
 * Flex component: renders a flex container.
 */
export default (): m.Component<FlexProps> => {
	return {
		view({ attrs, children }) {
			let flexClasses: string = '.flex';

			if (attrs.inline !== undefined && attrs.inline) {
				flexClasses = '.inline-flex';
			}

			if (attrs.direction !== undefined) {
				flexClasses += `.flex-${attrs.direction}`;
			}

			if (attrs.items !== undefined) {
				flexClasses += `.items-${attrs.items}`;
			}

			if (attrs.justify !== undefined) {
				flexClasses += `.justify-${attrs.justify}`;
			}

			if (attrs.wrap !== undefined) {
				flexClasses += `.flex-${attrs.wrap}`;
			}

			return m(`div.relative${flexClasses}${attrs.className ?? ''}`, { style: attrs.style }, children);
		},
	};
};
