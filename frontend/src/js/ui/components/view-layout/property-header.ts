import m from 'mithril';

import Icon from 'js/ui/components/atomic/icon';
import Flex from 'js/ui/components/layout/flex';

type HeaderProps = {
	className?: string;
	icon?: string;
	title: string;
	description?: string;
};

export default (): m.Component<HeaderProps> => {
	return {
		view({ attrs }) {
			let element = [m(`div.f4.pt3.lh-copy`, attrs.title), attrs.description ? m('div.f7.text-muted.mb3', attrs.description) : null];
			if (attrs.icon) {
				return m(Flex, { items: 'center', className: attrs.className }, [
					m(Icon, { icon: attrs.icon, size: 3, className: '.mr3' }),
					m('div', element),
				]);
			}

			return m(`div${attrs.className}`, element);
		},
	};
};
