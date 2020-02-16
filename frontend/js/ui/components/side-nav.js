import m from 'mithril';

import map from 'lodash-es/map';

let pages = {
	home: {
		name: 'Templates & Entries',
		icon: 'list-box',
		url: ''
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
	return {
		view(vnode) {
			return (
				<div className="w60 flex-shrink-0 bg-black-10 br b--black-10 flex flex-column items-center">
					{map(pages, (v, k) => {
						return (
							<div className="w-100 h2 flex-centered mt2">
								<div
									className="w-70 h-100 br1 flex-centered bg-black-05 hover-bg-black-10 pointer tooltip tooltip-right"
									data-tooltip={v.name}
									onclick={() => {
										m.route.set('/' + (v.url ?? k));
									}}
								>
									<i className={'ion f5 ' + (k === vnode.attrs.page ? 'green' : 'black-60') + ' ion-md-' + v.icon} />
								</div>
							</div>
						);
					})}
				</div>
			);
		}
	};
};
