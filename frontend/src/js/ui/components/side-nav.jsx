import { map } from 'lodash-es';

import { shell } from '/js/electron';

import { Logo } from './index';

import store from '/js/core/store';

let pages = {
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
	help: {
		name: 'Help',
		icon: 'help',
		url: 'help',
		newPage: true,
		width: 1000,
		height: 700,
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

export default () => {
	let menu = (active) =>
		map(pages, (v, k) => (
			<div
				onclick={() => {
					if (v.newPage) {
						window.open('http://127.0.0.1:7123/#!/' + (v.url ?? k), 'targetWindow', `width=${v.width},height=${v.height}`);
					} else {
						m.route.set('/' + (v.url ?? k));
					}
				}}
				className={`mh3 mb2 br2 ph2 pv1 hover-bg-primary hover-white pointer z-999 flex items-center justify-between mb1 f7 ${
					active === k ? 'white bg-primary' : 'bg-white-05 white-60'
				}`}
			>
				<div>{v.name}</div>
				<i className={`ion ion-md-${v.icon}`} />
			</div>
		));

	let update = () => {
		if (
			!store.data.newVersion ||
			store.data.newVersion.localVersion.gitCommitHash === '' ||
			store.data.newVersion.latestVersion.commit.sha === store.data.newVersion.localVersion.gitCommitHash
		) {
			return null;
		}

		let tag = store.data.newVersion.latestVersion.name.split(' ')[0];

		return (
			<div
				className='tc mh3 br2 ph2 pv1 hover-bg-primary hover-white light-red pointer f7'
				onclick={() => shell.openExternal('https://github.com/BigJk/snd/releases')}
			>
				{tag} Available
			</div>
		);
	};

	return {
		view(vnode) {
			return (
				<div className='side-nav grid-bg relative flex flex-column flex-shrink-0'>
					<div className='absolute bottom-0 left-0 w-100 tc mb3 z-999'>{update()}</div>
					<div className='side-nav--shadow w-100 h-100 absolute bottom-0 left-0 z-0' />
					<div className='ph2 pv3 header white flex-shrink-0'>
						<div className='flex-centered'>
							<Logo />
						</div>
					</div>
					<div className='flex-grow-1 overflow-auto z-5'>{menu(vnode.attrs.active)}</div>
				</div>
			);
		},
	};
};
