import m from 'mithril';

import Flex from 'js/ui/components/flex';
import type { SideMenuItem } from 'js/ui/components/side-menu';
import SideMenu from 'js/ui/components/side-menu';

type SideMenuPagerItem = {
	title: string;
	icon: string;
	render: () => m.Children;
};

type SideMenuPagerProps = {
	items: SideMenuPagerItem[];
};

type SideMenuPagerState = {
	active: string;
};

export default (): m.Component<SideMenuPagerProps> => {
	let state: SideMenuPagerState = {
		active: '',
	};

	const getRender = (attrs: SideMenuPagerProps) => {
		let index = attrs.items.findIndex((item) => item.title === state.active);
		if (index === -1) return null;
		return attrs.items[index].render();
	};

	return {
		oncreate({ attrs }) {
			state.active = attrs.items[0].title;
		},
		view({ attrs }) {
			return m(Flex, { className: '.overflow-auto.h-100' }, [
				m(
					'div.br.b--black-10.flex-shrink-0.pa2.bg-white',
					{ style: { width: '200px' } },
					m(SideMenu, {
						className: '.w-100',
						items: attrs.items.map((item): SideMenuItem => {
							return {
								id: item.title,
								title: item.title,
								icon: item.icon,
								active: item.title === state.active,
								onClick: (id?: string) => {
									if (id) state.active = id;
								},
							};
						}),
					})
				),
				getRender(attrs),
			]);
		},
	};
};
