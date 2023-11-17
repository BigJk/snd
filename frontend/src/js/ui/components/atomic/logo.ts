import m from 'mithril';

// @ts-ignore
import buySvg from 'src/img/buy.svg';
// @ts-ignore
import dungeonSvg from 'src/img/dungeon.svg';

type LogoProps = {
	className?: string;
	scale?: number;
};

/**
 * Logo component: renders the logo of the app.
 */
export default (): m.Component<LogoProps> => ({
	view(vnode) {
		return m('div.flex.items-center.z-5' + (vnode.attrs.className ?? ''), { style: { zoom: vnode.attrs.scale ?? 1.0 } }, [
			m('img.z-1', { src: dungeonSvg, alt: '', height: 40 }),
			m('img.z-0', { src: buySvg, alt: '', height: 32, style: { margin: '-15px 0 0 -20px', transform: 'rotate(25deg)' } }),
		]);
	},
});
