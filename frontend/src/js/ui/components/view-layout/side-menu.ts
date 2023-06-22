import m from 'mithril';

export type SideMenuItem = {
	id: string;
	title: string;
	icon: string;
	active?: boolean;
	onClick?: (id?: string) => void;
};

export type SideMenuProps = {
	className?: string;
	items: SideMenuItem[];
};

/**
 * SideMenu component: renders a side menu with clickable items.
 */
export default (): m.Component<SideMenuProps> => {
	const menuItem = (item: SideMenuItem) => {
		return m(
			`div.ph2.pv1.br2.mb1.flex.items-center.pointer.bg-animate${item.active ? '.bg-black-05.hover-bg-black-10' : '.hover-bg-black-05'}`,
			{
				onclick: () => {
					if (!item.onClick) return;

					item.onClick(item.id);
					m.redraw();
				},
			},
			[
				m('div.w1.mr1', { key: item.id }, m(`i.ion.ion-md-${item.icon}.f7.col-primary`, { key: item.id })), //
				m(`.f8`, { key: item.id }, item.title),
			]
		);
	};

	return {
		view({ attrs, key }) {
			return m(
				`div${attrs.className ?? ''}`,
				{ key: key },
				attrs.items.map((item) => {
					return menuItem(item);
				})
			);
		},
	};
};
