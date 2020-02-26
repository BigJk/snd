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
					className={`w-100 ph3 pv1 hover-bg-primary hover-white pointer z-999 flex items-center justify-between mb1 ${active === k ? 'white bg-primary' : 'white-60'}`}
				>
					<div>
						<i className={`ion ion-md-${v.icon} mr2`} />
						{v.name}
					</div>
					<i className="ion ion-md-arrow-dropright" />
				</div>
			);
		});
	};

	return {
		view(vnode) {
			return (
				<div className="side-nav relative flex flex-column flex-shrink-0">
					<div className="side-nav--shadow w-100 h-100 absolute bottom-0 left-0 z-0" />
					<div className="ph3 pv3 header white flex-shrink-0">
						<div className="flex-centered">
							<div className="flex items-center z-999">
								<img src={dungeonSvg} className="z-1" alt="" height={40} />
								<img src={buySvg} className="z-0" alt="" height={32} style={{ margin: '-15px 0 0 -20px', transform: 'rotate(25deg)' }} />
							</div>
							<span className="f5 lh-solid i z-999">
								<span className="pl1 f6">Sales &</span>
								<br />
								Dungeons
							</span>
						</div>
					</div>
					<div className="flex-grow-1 overflow-auto z-999">{menu(vnode.attrs.active)}</div>
				</div>
			);
		}
	};
};
