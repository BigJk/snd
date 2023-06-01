import m from 'mithril';

import { map } from 'lodash-es';

import Logo from 'js/ui/components/logo';
import Tooltip from 'js/ui/components/tooltip';

const pages = {
	dashboard: {
		name: 'Dashboard',
		icon: 'analytics',
		url: '',
	},
	templates: {
		name: 'Templates',
		icon: 'list-box',
		url: 'templates',
	},
	generators: {
		name: 'Generators',
		icon: 'switch',
		url: 'generators',
	},
	dataSources: {
		name: 'Data Sources',
		icon: 'analytics',
		url: 'data-sources',
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
	classNames?: string;
};

export default (): m.Component<SideNavProps> => {
	let onClickHandler = (v: any, k: string) => {
		if (v.newPage) {
			window.open('http://127.0.0.1:7123/#!/' + (v.url ?? k), 'targetWindow', `width=${v.width},height=${v.height}`);
		} else {
			m.route.set('/' + (v.url ?? k));
		}
	};

	let menu = (active: string) =>
		map(pages, (v: any, k) => {
			return m(
				Tooltip,
				{ content: v.name, placement: 'right' },
				m(
					'div.mb2.br2.hover-bg-primary.hover-white.pointer.z-999.f7.flex.items-center.justify-center' +
						(active === k ? '.white.bg-primary' : '.bg-white-05.white-60'),
					{
						onclick: () => onClickHandler(v, k),
						style: {
							width: '38px',
							height: '38px',
						},
					},
					m('i.f5.ion.ion-md-' + v.icon)
				)
			);
		});

	return {
		view(vnode) {
			return m(
				'div.grid-bg' + vnode.attrs.classNames,
				{ style: { width: '70px' } },
				m('div.flex.flex-column.items-center.pt3', [m(Logo, { scale: 0.75 }), m('div.mb3'), ...menu(vnode.attrs.active)])
			);
		},
	};
};
