import { camelCase, cloneDeep, flattenDeep, get, map, some, startCase } from 'lodash-es';

import * as diceRoller from '@airjp73/dice-notation';

import { Form, Input, Select, Switch } from './index';

import binder from '/js/ui/binder';

function isArgValOk(val, args) {
	if (args.length === 0 || args[0] === null) {
		return true;
	}
	return val !== null;
}

function mayParse(val) {
	if (typeof val === 'string') {
		return parseInt(val);
	}
	return val;
}

function runDice(format, config) {
	let tokens = diceRoller.tokenize(format);
	let roll = diceRoller.rollDice(tokens, config);
	return diceRoller.calculateFinalResult(tokens, diceRoller.tallyRolls(tokens, roll));
}

const matcher = {
	string_contains(val, args) {
		return isArgValOk(val, args) && val.toLowerCase().indexOf(args[0].toLowerCase()) >= 0;
	},
	string_starts_with(val, args) {
		return isArgValOk(val, args) && val.toLowerCase().indexOf(args[0].toLowerCase()) === 0;
	},
	dice_can_reach(val, args) {
		if (!isArgValOk(val, args)) return false;

		try {
			// run all dice with the maximum achievable values
			return (
				runDice(val, {
					random(min, max) {
						return max;
					},
				}) >= args[0]
			);
		} catch (e) {
			// ignore
		}

		return false;
	},
	dice_at_least(val, args) {
		if (!isArgValOk(val, args)) return false;

		try {
			// run all dice with the minimum achievable values
			return (
				runDice(val, {
					random(min) {
						return min;
					},
				}) >= args[0]
			);
		} catch (e) {
			// ignore
		}

		return false;
	},
	number_equal(val, args) {
		return isArgValOk(val, args) && mayParse(val) === args[0];
	},
	number_gt(val, args) {
		return isArgValOk(val, args) && mayParse(val) >= args[0];
	},
	number_lt(val, args) {
		return isArgValOk(val, args) && mayParse(val) <= args[0];
	},
	array_count(val, args) {
		if (!isArgValOk(val, args)) {
			return false;
		}
		return val.length === args[0];
	},
	array_gt(val, args) {
		if (!isArgValOk(val, args)) {
			return false;
		}
		return val.length >= args[0];
	},
	array_lt(val, args) {
		if (!isArgValOk(val, args)) {
			return false;
		}
		return val.length <= args[0];
	},
};

const constrains = [
	{
		for: ['string'],
		name: 'Text: Contains',
		args: [
			{
				name: 'Text',
				type: 'string',
			},
		],
		match: 'string_contains',
	},
	{
		for: ['string'],
		name: 'Text: Starts with',
		args: [
			{
				name: 'Text',
				type: 'string',
			},
		],
		match: 'string_starts_with',
	},
	{
		for: ['string'],
		name: 'Dice: Can reach',
		args: [
			{
				name: '#',
				type: 'number',
			},
		],
		match: 'dice_can_reach',
	},
	{
		for: ['string'],
		name: 'Dice: Minimum value',
		args: [
			{
				name: '#',
				type: 'number',
			},
		],
		match: 'dice_at_least',
	},
	{
		for: ['number', 'string'],
		name: 'Number: Equal',
		args: [
			{
				name: '#',
				type: 'number',
			},
		],
		match: 'number_equal',
	},
	{
		for: ['number', 'string'],
		name: 'Number: Greater than',
		args: [
			{
				name: '#',
				type: 'number',
			},
		],
		match: 'number_gt',
	},
	{
		for: ['number', 'string'],
		name: 'Number: Less than',
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
		name: 'List: Item count',
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
		name: 'List: More items than',
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
		name: 'List: Less items than',
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

	let updateCallbacks = (vnode) => {
		if (vnode.attrs.onchange) {
			state.onChange = vnode.attrs.onchange;
		}
		if (vnode.attrs.onclose) {
			state.onClose = vnode.attrs.onclose;
		}
	};

	return {
		oninit(vnode) {
			updateCallbacks(vnode);
		},
		onupdate(vnode) {
			updateCallbacks(vnode);
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
				<div className='overflow-auto min-h-100'>
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
								if (state.selectedKey.length === 0) {
									return;
								}

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
															return <Input value={c.args[i]} label={input.name} oninput={binder.inputString(c, 'args[' + i + ']', triggerChange)} />;
														case 'number':
															return <Input value={c.args[i]} label={input.name} oninput={binder.inputNumber(c, 'args[' + i + ']', triggerChange)} />;
													}
												})}
											</div>
											<Form className='form-no-margin ml2 flex-shrink-0' horizontal={false}>
												<Switch label='Negate' labelCol={5} value={c.negate} oninput={binder.checkbox(c, 'negate', triggerChange)} />
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
