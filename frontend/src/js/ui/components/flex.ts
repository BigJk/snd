import m from 'mithril';

type FlexProps = {
	classNames?: string;
	direction?: 'row' | 'column';
	align?: 'start' | 'center' | 'end';
	justify?: 'start' | 'center' | 'end';
	wrap?: 'wrap' | 'nowrap';
	inline?: boolean;
};

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

			if (attrs.align !== undefined) {
				flexClasses += `.items-${attrs.align}`;
			}

			if (attrs.justify !== undefined) {
				flexClasses += `.justify-${attrs.justify}`;
			}

			if (attrs.wrap !== undefined) {
				flexClasses += `.flex-${attrs.wrap}`;
			}

			return m(`div.relative${flexClasses}${attrs.classNames ?? ''}`, children);
		},
	};
};
