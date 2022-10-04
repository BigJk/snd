import Store from '/js/core/store';

import { Header, Input, Tooltip } from '/js/ui/components';
import Base from '/js/ui/components/base';

import binder from '/js/ui/binder';

export default () => {
	let state = {
		search: '',
		importing: {
			show: false,
			loading: false,
			url: '',
		},
	};

	return {
		view() {
			return (
				<Base active='generators'>
					<Header title='Generators' subtitle='Generators create unique content that you can use to spice up your session.' classes='pt2'>
						<div className='btn btn-success mr2' onclick={() => m.route.set('/generators/new')}>
							Create New
						</div>
						<Tooltip content='Import'>
							<div className='btn btn-primary' onclick={() => (state.importing.show = true)}>
								<i className='ion ion-md-log-in' />
							</div>
						</Tooltip>
						<div className='divider-vert' />
						<Input placeholder='Search...' value={state.search} oninput={binder.inputString(state, 'search')} />
					</Header>
					<div className='pa3'>
						{Store.data.generators.map((g, i) => {
							return (
								<div className={`w-50 ${(i & 1) === 0 ? 'pr2' : ''}`}>
									<div className='ba b--black-10 mb2 bg-white'>
										<div className='flex-grow-1 pv2 ph2 lh-solid flex flex-column justify-between'>
											<div>
												<div className='f5 mb2 flex justify-between lh-copy'>
													<div>
														{g.name}
														<div className='fw4 f7 black-50'>{g.description}</div>
													</div>

													<span className='f8 fw4 text-muted'>
														{g.author}/{g.slug}
													</span>
												</div>
												<div className='divider' />
											</div>
											<div className='ba br2 b--black-05 mb2 h5 overflow-auto'></div>
											<div className='flex'>
												<div className='flex-grow-1 btn btn-success mr2' onclick={null}>
													<i className='ion ion-md-print mr1' /> Generate
												</div>
												<div
													className='btn btn-primary'
													onclick={() => m.route.set(`/generators/gen:${g.author}+${g.slug}/edit`)}
												>
													<i className='ion ion-md-settings mr1' /> Edit
												</div>
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</Base>
			);
		},
	};
};
