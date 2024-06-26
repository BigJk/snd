import m from 'mithril';

import CenterContainer from 'js/ui/components/layout/center-container';
import Flex from 'js/ui/components/layout/flex';
import SideMenu, { type SideMenuItem } from 'js/ui/components/view-layout/side-menu';

import { filterChildren } from 'js/ui/util';

type SideMenuPagerItem = {
	id?: string;
	title: string;
	icon: string;
	centerContainer?: boolean;
	padding?: boolean;
	className?: string;
	render: () => m.Children;
};

type SideMenuPagerProps = {
	className?: string;
	items: SideMenuPagerItem[];
	onChange?: (id: string) => void;
};

type SideMenuPagerState = {
	active: string;
};

export default (): m.Component<SideMenuPagerProps> => {
	let state: SideMenuPagerState = {
		active: '',
	};

	const getClassName = (attrs: SideMenuPagerProps) => {
		let index = attrs.items.findIndex((item) => item.title === state.active || item.id === state.active);
		if (index === -1) return null;
		return attrs.items[index].className ?? '';
	};

	const applyPadding = (padding: boolean | undefined, content: m.Children) => (!!padding ? m('.ph3', content) : content);

	const getRender = (attrs: SideMenuPagerProps) => {
		let index = attrs.items.findIndex((item) => item.title === state.active || item.id === state.active);
		if (index === -1) return null;
		const content = attrs.items[index].render();
		return attrs.items[index].centerContainer
			? applyPadding(attrs.items[index].padding, m(CenterContainer, content))
			: applyPadding(attrs.items[index].padding, content);
	};

	return {
		oncreate({ attrs }) {
			state.active = attrs.items[0].title;
			m.redraw();
		},
		view({ attrs, key }) {
			return m(
				Flex,
				{ className: `.overflow-auto.h-100${attrs.className ?? ''}`, key: key },
				filterChildren([
					m(
						'div.br.b--black-10.flex-shrink-0.pa2.bg-white',
						{ style: { width: '200px' }, key: key },
						m(SideMenu, {
							key: key,
							className: '.w-100',
							items: attrs.items.filter(Boolean).map(
								(item): SideMenuItem => ({
									id: item.id ?? item.title,
									title: item.title,
									icon: item.icon,
									active: item.title === state.active || item.id === state.active,
									onClick: (id?: string) => {
										if (id) {
											state.active = id;

											if (attrs.onChange) {
												attrs.onChange(id);
											}
										}
									},
								}),
							),
						}),
					),
					//
					// We wrap with additional div to prevent problems with keyed components inside the render.
					m(`div.w-100.overflow-auto${getClassName(attrs)}`, getRender(attrs)),
				]),
			);
		},
	};
};
