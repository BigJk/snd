import m from 'mithril';

type FlexItemProps = {
	classNames?: string;
	grow?: number;
	shrink?: number;
};

/**
 * FlexItem component: renders a flex item.
 */
export default (): m.Component<FlexItemProps> => {
	return {
		view({ attrs, children }) {
			let flexClasses: string = '';

			if (attrs.grow !== undefined) {
				flexClasses += `.flex-grow-${attrs.grow}`;
			}

			if (attrs.shrink !== undefined) {
				flexClasses += `.flex-shrink-${attrs.shrink}`;
			}

			return m(`div.flex-grow${flexClasses}${attrs.classNames ?? ''}`, children);
		},
	};
};
