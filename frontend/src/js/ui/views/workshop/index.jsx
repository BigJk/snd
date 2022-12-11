import store from '/js/core/store';

import { Base, Header, PreviewBox } from '/js/ui/components';

export default function () {
	return {
		oninit(vnode) {
			store.pub('reload_public_packages');
		},
		view(vnode) {
			return (
				<Base active='workshop'>
					<Header title='Workshop' subtitle='Browse and download community made content.'>
						<div className='btn btn-primary'>
							<i className='ion ion-md-refresh' onclick={() => store.pub('reload_public_packages')}></i>
						</div>
					</Header>
					<div className='ph3 flex flex-wrap'>
						{store.data.publicPackages.map((p, i) => (
							<PreviewBox
								className={`w-50 ${(i & 1) === 0 ? 'pr2' : ''}`}
								value={p}
								bottomRight={
									<div className='btn' onclick={() => m.route.set(`/workshop/${i}`)}>
										Browse
									</div>
								}
							></PreviewBox>
						))}
					</div>
				</Base>
			);
		},
	};
}
