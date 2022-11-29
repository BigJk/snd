import { clone, pickBy } from 'lodash-es';

import { error, success } from '../../toast';

import api from '/js/core/api';
import { render } from '/js/core/generator';
import Store from '/js/core/store';
import store from '/js/core/store';

import { GeneratorConfig, Header, Input, Preview, Switch, Tooltip } from '/js/ui/components';
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
		configs: {},
		rendered: {},
		settings: {},
	};

	let sanitizeConfig = (g) => {
		let id = `gen:${g.author}+${g.slug}`;

		if (state.configs[id] === undefined) {
			state.configs[id] = {
				seed: 'TEST_SEED',
			};
		}

		g.config.forEach((conf) => {
			if (state.configs[id][conf.key] === undefined) {
				state.configs[id][conf.key] = conf.default;
			}
		});

		state.configs[id] = pickBy(state.configs[id], (val, key) => {
			return g.config.some((conf) => {
				return conf.key === key || key === 'seed';
			});
		});
	};

	let rerender = (g) => {
		let id = `gen:${g.author}+${g.slug}`;

		return render(g, null, state.configs[id])
			.then((res) => {
				state.rendered[id] = res;
			})
			.catch(error);
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
					<div className='pa3 flex flex-wrap'>
						{Store.data.generators.map((g, i) => {
							let id = `gen:${g.author}+${g.slug}`;

							sanitizeConfig(g);

							if (state.rendered[id] === undefined) {
								rerender(g).then(m.redraw);
							}

							if (state.settings[id] === undefined) {
								state.settings[id] = {
									reroll: false,
									amount: 1,
								};
							}

							return (
								<div className='w-100 flex mb3'>
									<div className='flex-grow-1 mr3 ba b--black-10 bg-white'>
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
											<div className='ba br2 b--black-05 mb2 overflow-auto ph3 pv2' style='height: 400px;'>
												<GeneratorConfig
													config={g.config}
													value={state.configs[id]}
													onchange={(key, val) => {
														state.configs[id][key] = val;
														rerender(g).then(m.redraw);
													}}
												></GeneratorConfig>
											</div>
											<div className='flex'>
												<div
													className='flex-grow-1 btn btn-success mr2'
													onclick={() => {
														for (let j = 0; j < state.settings[id].amount; j++) {
															let config = clone(state.configs[id]);

															if (j > 0) {
																config.seed += '_' + j;
															}

															render(g, null, config)
																.then((res) => {
																	api.print(res)
																		.then(() => success('Printing send'))
																		.catch(error);
																})
																.catch(error);
														}

														if (state.settings[id].reroll) {
															state.configs[id]['seed'] = Math.ceil(Math.random() * 1000000000);
															rerender(g).then(m.redraw);
														}
													}}
												>
													<i className='ion ion-md-print mr1' /> Print
												</div>
												<div
													className='btn btn-primary'
													onclick={() => m.route.set(`/generators/gen:${g.author}+${g.slug}/edit`)}
												>
													<i className='ion ion-md-settings mr1' /> Edit
												</div>
											</div>
											<div className='flex'>
												<Input
													label='Amount to Generate'
													value={state.settings[id].amount}
													oninput={binder.inputNumber(state.settings[id], 'amount')}
												></Input>
												<div className='mr3'></div>
												<Switch
													label='Reroll on Print'
													value={state.settings[id].reroll}
													oninput={binder.checkbox(state.settings[id], 'reroll')}
												></Switch>
											</div>
										</div>
									</div>
									<div className='flex-shrink-0'>
										<Preview
											className='br1 ba b--black-10 bg-black-05 w-100 h-100'
											stylesheets={store.data.settings.stylesheets}
											width={350}
											scale={350 / store.data.settings.printerWidth}
											content={state.rendered[id]}
										/>
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
