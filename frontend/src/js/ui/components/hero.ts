import m from 'mithril';

type HeroProps = {
	className?: string;
	title: m.Children;
	subtitle: m.Children;
	footer?: m.Children;
	icon?: m.Children;
};

/**
 * Hero component: renders a hero section with a title, subtitle, footer, and icon.
 */
export default (): m.Component<HeroProps> => ({
	view(vnode) {
		return m('div.ph4.pv4.grid-bg.br3.w-100.white.flex' + (vnode.attrs.className ?? ''), [
			m('div', [
				m('div.f5.mb3', vnode.attrs.title),
				m('div.white-70.lh-copy' + (vnode.attrs.footer ? '.mb3' : ''), vnode.attrs.subtitle),
				m('div.flex', vnode.attrs.footer),
			]),
			vnode.attrs.icon,
		]);
	},
});
