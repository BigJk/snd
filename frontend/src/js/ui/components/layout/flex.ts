import m from 'mithril';

import { filterChildren } from 'js/ui/util';

type FlexProps = {
	className?: string;
	style?: Record<any, any>;
	direction?: 'row' | 'column';
	items?: 'start' | 'center' | 'end';
	justify?: 'start' | 'center' | 'end' | 'between';
	wrap?: 'wrap' | 'nowrap';
	inline?: boolean;
	gap?: number;
} & m.Attributes;

/**
 * Flex component: renders a flex container.
 */
export default (): m.Component<FlexProps> => ({
	view({ attrs, children, key }) {
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

		if (attrs.gap !== undefined) {
			flexClasses += `.flex-gap-${attrs.gap}`;
		}

		return m(`div.relative${flexClasses}${attrs.className ?? ''}`, { ...attrs, key: key, style: { ...attrs.style } }, filterChildren(children));
	},
});
