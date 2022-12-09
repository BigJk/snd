import { camelCase, cloneDeep, flattenDeep, get, map, some, startCase } from 'lodash-es';

import { Form, Input, Select, Switch } from './index';

import binder from '/js/ui/binder';

const matcher = {
	string_contains(val, args) {
		if (args.length === 0 || args[0] === null) {
			return true;
		}
		if (val === null) {
			return false;
		}
		return val.toLowerCase().indexOf(args[0].toLowerCase()) >= 0;
	},
	number_equal(val, args) {
		if (args.length === 0 || args[0] === null) {
			return true;
		}
		if (val === null) {
			return false;
		}
		return val === args[0];
	},
	number_gt(val, args) {
		if (args.length === 0 || args[0] === null) {
			return true;
		}
		if (val === null) {
			return false;
		}
		return val >= args[0];
	},
	number_lt(val, args) {
		if (args.length === 0 || args[0] === null) {
			return true;
		}
		if (val === null) {
			return false;
		}
		return val <= args[0];
	},
	array_count(val, args) {
		if (args.length === 0 || args[0] === null) {
			return true;
		}
		if (val === null) {
			return false;
		}
		return val.length === args[0];
	},
	array_gt(val, args) {
		if (args.length === 0 || args[0] === null) {
			return true;
		}
		if (val === null) {
			return false;
		}
		return val.length >= args[0];
	},
	array_lt(val, args) {
		if (args.length === 0 || args[0] === null) {
			return true;
		}
		if (val === null) {
			return false;
		}
		return val.length <= args[0];
	},
};

const constrains = [
	{
		for: ['string'],
		name: 'Contains',
		args: [
			{
				name: 'Text',
				type: 'string',
			},
		],
		match: 'string_contains',
	},
	{
		for: ['number'],
		name: 'Equal',
		args: [
			{
				name: '#',
				type: 'number',
			},
		],
		match: 'number_equal',
	},
	{
		for: ['number'],
		name: 'Greater than',
		args: [
			{
				name: '#',
				type: 'number',
			},
		],
		match: 'number_gt',
	},
	{
		for: ['number'],
		name: 'Less than',
		args: [
			{
				name: '#',
				type: 'number',
			},
		],
		match: 'number_lt',
	},
	{
		for: ['array'],
		name: 'Item count',
		args: [
			{
				name: 'Count',
				type: 'number',
			},
		],
		match: 'array_count',
	},
	{
		for: ['array'],
		name: 'More items than',
		args: [
			{
				name: 'Count',
				type: 'number',
			},
		],
		match: 'array_gt',
	},
	{
		for: ['array'],
		name: 'Less items than',
		args: [
			{
				name: 'Count',
				type: 'number',
			},
		],
		match: 'array_lt',
	},
];

function suitableConstrains(obj) {
	let type = Array.isArray(obj) ? 'array' : typeof obj;
	return constrains.filter((c) => c.for.some((t) => t === type));
}

function allPaths(obj, cur) {
	let paths = map(obj, (val, key) => {
		let isObject = typeof val === 'object' && !Array.isArray(val);
		if (isObject) {
			return allPaths(val, cur + key + '.');
		}
		return cur + key;
	});
	return flattenDeep(paths);
}

export default () => {
	let state = {
		selectedKey: '',
		search: '',
		filter: {},
		onChange() {},
		onClose: null,
	};

	let triggerChange = () => {
		let search = state.search;
		let filter = cloneDeep(state.filter);

		state.onChange((name, obj) => {
			if (name.toLowerCase().indexOf(search.toLowerCase()) < 0) {
				return false;
			}

			return !some(filter, (filter, key) => {
				if (filter.constrains.length === 0) {
					return false;
				}

				return !some(filter.constrains, (con) => {
					let res = matcher[con.base.match](get(obj, key), con.args);
					return con.negate ? !res : res;
				});
			});
		});
	};

	return {
		oninit(vnode) {
			if (vnode.attrs.onchange) {
				state.onChange = vnode.attrs.onchange;
			}
			if (vnode.attrs.onclose) {
				state.onClose = vnode.attrs.onclose;
			}
		},
		view(vnode) {
			let paths = allPaths(vnode.attrs.target, '');

			let pathToName = (path) => {
				let val = get(vnode.attrs.target, path);
				return (
					path
						.split('.')
						.map((n) => startCase(camelCase(n)))
						.join(' - ') + ` (${Array.isArray(val) ? 'List' : startCase(typeof val)})`
				);
			};

			return (
				<div className='overflow-auto'>
					<div className='flex justify-between items-center bb b--black-10 pb2 mb1'>
						<span className='f5'>
							<i className='ion ion-md-search mr1' /> Advanced Search
						</span>
						{state.onClose ? <i className='ion ion-md-close red f5 pointer dim' onclick={state.onClose} /> : null}
					</div>
					<div className='bb b--black-10 pb2 mb3'>
						<Input label='Name Search' placeholder='Dragon...' oninput={binder.inputString(state, 'search', triggerChange)} />
						<Select
							label='Property'
							selected={state.selectedKey}
							keys={paths}
							names={paths.map(pathToName)}
							oninput={(e) => (state.selectedKey = e.target.value)}
						/>
						<div
							className='btn btn-primary mb2'
							onclick={() => {
								if (state.filter[state.selectedKey]) {
									return;
								}

								state.filter[state.selectedKey] = {
									constrains: [],
									selectedSuitable: null,
									suitable: suitableConstrains(get(vnode.attrs.target, state.selectedKey)),
								};
							}}
						>
							Add Constrain
						</div>
					</div>
					{map(state.filter, (con, key) => (
							<div className='pa2 ba br1 b--black-10 mt2 bg-white-20'>
								<div className='flex justify-between items-center mb2'>
									<span className='b'>{pathToName(key)}</span>
									<i
										className='ion ion-md-close red f5 pointer dim'
										onclick={() => {
											delete state.filter[key];
											triggerChange();
										}}
									/>
								</div>
								<div className='flex'>
									<Select
										selected={con.selectedSuitable}
										keys={con.suitable.map((_, i) => i)}
										names={con.suitable.map((s) => s.name)}
										oninput={(e) => (con.selectedSuitable = parseInt(e.target.value))}
									/>
									<div
										className='btn btn-primary ml2'
										onclick={() => {
											if (con.selectedSuitable === null) {
												return;
											}

											con.constrains.push({
												base: con.suitable[con.selectedSuitable],
												args: con.suitable[con.selectedSuitable].args.map(() => null),
												negate: false,
											});

											triggerChange();
										}}
									>
										Add
									</div>
								</div>
								<div>
									{map(con.constrains, (c, i) => (
											<div className='bt b--black-10 pt2 mt2'>
												<div className='flex justify-between items-center'>
													<span className='b'>{c.base.name}</span>{' '}
													<i
														className='ion ion-md-close red f5 pointer dim'
														onclick={() => {
															con.constrains.splice(i, 1);
															triggerChange();
														}}
													/>
												</div>
												<div className='flex w-100'>
													<div className='flex-grow-1'>
														{map(c.base.args, (input, i) => {
															switch (input.type) {
																case 'string':
																	return (
																		<Input
																			value={c.args[i]}
																			label={input.name}
																			oninput={binder.inputString(c, 'args[' + i + ']', triggerChange)}
																		/>
																	);
																case 'number':
																	return (
																		<Input
																			value={c.args[i]}
																			label={input.name}
																			oninput={binder.inputNumber(c, 'args[' + i + ']', triggerChange)}
																		/>
																	);
															}
														})}
													</div>
													<Form className='form-no-margin ml2 flex-shrink-0' horizontal={false}>
														<Switch
															label='Negate'
															labelCol={5}
															value={c.negate}
															oninput={binder.checkbox(c, 'negate', triggerChange)}
														/>
													</Form>
												</div>
											</div>
										))}
								</div>
							</div>
						))}
				</div>
			);
		},
	};
};
