import m from 'mithril';
import { map } from 'lodash-es';

import Logo from 'js/ui/components/atomic/logo';
import Tooltip from 'js/ui/components/atomic/tooltip';
import Spotlight from 'js/ui/components/portal/spotlight';

import * as Portal from 'js/ui/portal';

const pages = {
	dashboard: {
		name: 'Dashboard',
		icon: 'home',
		url: '',
	},
	templates: {
		name: 'Templates',
		icon: 'list-box',
		url: 'template',
	},
	generators: {
		name: 'Generators',
		icon: 'switch',
		url: 'generator',
	},
	'data-sources': {
		name: 'Data Sources',
		icon: 'analytics',
		url: 'data-source',
	},
	'session-grid': {
		name: 'Session Grid',
		icon: 'apps',
		url: 'session-grid',
	},
	workshop: {
		name: 'Workshop',
		icon: 'cart',
		url: 'workshop',
	},
	devices: {
		name: 'Devices',
		icon: 'outlet',
		url: 'devices',
	},
	settings: {
		name: 'Settings',
		icon: 'settings',
		url: 'settings',
	},
};

type SideNavProps = {
	active: string;
	className?: string;
};

/**
 * SideNav component: renders the main side navigation of the app.
 */
export default (): m.Component<SideNavProps> => {
	const onClickHandler = (v: any, k: string) => {
		if (k === 'spotlight') {
			Portal.setPortal(Spotlight, {
				className: '.mt5',
				items: 'start',
			});
			return;
		}

		if (v.newPage) {
			window.open('http://127.0.0.1:7123/#!/' + (v.url ?? k), 'targetWindow', `width=${v.width},height=${v.height}`);
		} else {
			m.route.set('/' + (v.url ?? k));
		}
	};

	const item = (v: any, k: string, active: string) =>
		m(
			Tooltip,
			{ content: v.name, placement: 'right' },
			m(
				'div.mb2.br2.hover-bg-primary.hover-white.pointer.z-1.f7.flex.items-center.justify-center' +
					(active === k ? '.white.bg-primary' : '.bg-white-05.white-60'),
				{
					onclick: () => onClickHandler(v, k),
					style: {
						width: '38px',
						height: '38px',
					},
				},
				m('i.f5.ion.ion-md-' + v.icon),
			),
		);

	const menu = (active: string) => map(pages, (v: any, k) => item(v, k, active));

	return {
		view(vnode) {
			return m('div.pl2.pv2.pr0.relative', [
				m('div.absolute.bg-white.bb.b--black-10.w-100.top-0.left-0', { style: { height: '70px', zIndex: -100 } }),
				m('div.grid-bg.br2.h-100.relative' + vnode.attrs.className, { style: { width: '70px' } }, [
					m('div.flex.flex-column.items-center.pt3', [m(Logo, { scale: 0.75 }), m('div.mb3'), ...menu(vnode.attrs.active)]),
					m(
						'div.flex.justify-center.items-center.pb1.w-100.absolute.bottom-0.left-0',
						item({ name: 'Spotlight (Ctrl+O)', icon: 'search' }, 'spotlight', vnode.attrs.active),
					),
				]),
			]);
		},
	};
};
