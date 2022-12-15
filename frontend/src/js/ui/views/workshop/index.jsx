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
							<i className='ion ion-md-refresh' onclick={() => store.pub('reload_public_packages')} />
						</div>
					</Header>
					<div className='ph3 pb3'>
						<div className='pr3'>
							<div className='toast toast-primary w-50 lh-copy'>
								<h6>
									<i className='ion ion-md-warning mr1' /> Attention
								</h6>
								The Workshop features community created content. The Sales & Dungeons Team is not responsible for the content contained in the
								packages. Importing content from here is done on your own risk. If you do find anything inappropriate in one of the packages please
								inform the Staff on the official Discord.
							</div>
						</div>
					</div>
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
							/>
						))}
					</div>
				</Base>
			);
		},
	};
}
