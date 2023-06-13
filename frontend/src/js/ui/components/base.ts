import m from 'mithril';

import Flex from 'js/ui/components/flex';
import SideNav from 'js/ui/components/side-nav';

type BaseProps = {
	title?: m.Children;
	rightElement?: m.Children;
	hideHeader?: boolean;
	active: string;
	className?: string;
	classNameContainer?: string;
};

/**
 * Base component: renders a side nav and a main content area.
 */
export default (): m.Component<BaseProps> => {
	const header = (attrs: BaseProps) => {
		if ((!attrs.title && !attrs.rightElement) || attrs.hideHeader) {
			return null;
		}

		return m(Flex, { justify: 'between', items: 'center', className: '.bb.b--black-10.pa3.bg-white-80.flex-shrink-0' }, [
			attrs.title, //
			attrs.rightElement,
		]);
	};

	return {
		view({ attrs, children }) {
			return m('div.w-100.h-100.flex', [
				m(SideNav, { className: '.flex-shrink-0', active: attrs.active }),
				m(`div.flex-grow-1.flex.flex-column.overflow-auto${attrs.className ?? ''}`, [
					header(attrs),
					m(`div.overflow-auto${attrs.classNameContainer ?? ''}`, children),
				]),
			]);
		},
	};
};
