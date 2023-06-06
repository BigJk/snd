import m from 'mithril';

type SideMenuItemProps = {
	id?: string;
	title: string;
	icon: string;
	active: boolean;
	onClick?: (id?: string) => void;
};

type SideMenuProps = {
	className?: string;
	items: SideMenuItemProps[];
};

/**
 * SideMenu component: renders a side menu with clickable items.
 */
export default (): m.Component<SideMenuProps> => {
	const menuItem = (item: SideMenuItemProps) => {
		return m(`div.ph3.pv1.br2.mb1.flex.items-center.pointer.bg-animate${item.active ? '.bg-black-05.hover-bg-black-10' : '.hover-bg-black-05'}`, [
			m('div.w2', m(`i.ion.ion-md-${item.icon}.f6.col-primary`)),
			m(`.f7`, { onclick: () => (item.onClick ? item.onClick(item.id) : null) }, item.title),
		]);
	};

	return {
		view({ attrs }) {
			return m(
				'div.dib',
				attrs.items.map((item) => {
					return menuItem(item);
				})
			);
		},
	};
};
