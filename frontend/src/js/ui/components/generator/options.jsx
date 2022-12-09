import { Input, Select } from '/js/ui/components/index';

export default {
	name: 'Option',
	defaultValue: {
		choices: ['Option A', 'Option B'],
		selected: 'Option A',
	},
	view: () => ({
			oninit() {},
			view(vnode) {
				return (
					<div>
						{vnode.attrs.inEdit ? (
							<Input
								value={vnode.attrs.value.choices.join(',')}
								label={'Choices'}
								oninput={(e) => vnode.attrs.oninput({ ...vnode.attrs.value, choices: e.target.value.split(',') })}
							></Input>
						) : null}
						<Select
							label={vnode.attrs.label}
							keys={vnode.attrs.value.choices}
							selected={vnode.attrs.value.selected}
							oninput={(e) => vnode.attrs.oninput({ ...vnode.attrs.value, selected: e.target.value })}
						></Select>
					</div>
				);
			},
		}),
};
