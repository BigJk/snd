import m from 'mithril';

import map from 'lodash-es/map';

const dungeonSvg = require('../../../img/dungeon.svg');
const buySvg = require('../../../img/buy.svg');

let pages = {
	templates: {
		name: 'Templates',
		icon: 'list-box',
		url: 'templates'
	},
	scripts: {
		name: 'Scripts',
		icon: 'code-working'
	},
	devices: {
		name: 'Devices',
		icon: 'outlet'
	},
	settings: {
		name: 'Settings',
		icon: 'settings'
	}
};

export default () => {
	let menu = active => {
		return map(pages, (v, k) => {
			return (
				<div
					onclick={() => {
						m.route.set('/' + (v.url ?? k));
					}}
					className={`mh3 mb2 br2 ph2 pv1 hover-bg-primary hover-white pointer z-999 flex items-center justify-between mb1 f7 ${active === k ? 'white bg-primary' : 'bg-white-05 white-60'}`}
				>
					<div>{v.name}</div>
					<i className={`ion ion-md-${v.icon}`} />
				</div>
			);
		});
	};

	return {
		view(vnode) {
			return (
				<div className="side-nav relative flex flex-column flex-shrink-0">
					<div className="side-nav--shadow w-100 h-100 absolute bottom-0 left-0 z-0" />
					<div className="ph2 pv3 header white flex-shrink-0">
						<div className="flex-centered">
							<div className="flex items-center z-5">
								<img src={dungeonSvg} className="z-1" alt="" height={40} />
								<img src={buySvg} className="z-0" alt="" height={32} style={{ margin: '-15px 0 0 -20px', transform: 'rotate(25deg)' }} />
							</div>
						</div>
					</div>
					<div className="flex-grow-1 overflow-auto z-5">{menu(vnode.attrs.active)}</div>
				</div>
			);
		}
	};
};
