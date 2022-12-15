import { uniq } from 'lodash-es';

import { Input, Select, Switch } from '/js/ui/components/index';

export default {
	name: 'Multiple Options',
	defaultValue: () => ({
		choices: ['Option A', 'Option B'],
		allowDuplicate: false,
		selected: ['Option A'],
	}),
	view: () => ({
		oninit() {},
		view(vnode) {
			return (
				<div>
					{vnode.attrs.inEdit
						? [
								<Input
									value={vnode.attrs.value.choices.join(',')}
									label='Choices'
									oninput={(e) => vnode.attrs.oninput({ ...vnode.attrs.value, choices: e.target.value.split(',') })}
								/>,
								<Switch
									label='Allow Duplicate'
									labelCol={5}
									value={vnode.attrs.value.allowDuplicate}
									oninput={(e) =>
										vnode.attrs.oninput({
											...vnode.attrs.value,
											selected: e.target.checked ? vnode.attrs.value.selected : uniq(vnode.attrs.value.selected),
											allowDuplicate: e.target.checked,
										})
									}
								/>,
						  ]
						: null}
					<Select
						label={vnode.attrs.label}
						keys={vnode.attrs.value.choices}
						oninput={(e) =>
							vnode.attrs.oninput({
								...vnode.attrs.value,
								selected: vnode.attrs.value.allowDuplicate
									? [...vnode.attrs.value.selected, e.target.value]
									: uniq([...vnode.attrs.value.selected, e.target.value]),
							})
						}
					/>
					{vnode.attrs.value.selected.map((v, i) => (
						<div className='dib mr2 mb2 label label-primary'>
							<span className='mr2'>{v}</span>
							<i
								className='ion ion-md-close pointer dim'
								onclick={() =>
									vnode.attrs.oninput({
										...vnode.attrs.value,
										selected: vnode.attrs.value.selected.filter((_, j) => j !== i),
									})
								}
							/>
						</div>
					))}
				</div>
			);
		},
	}),
};
