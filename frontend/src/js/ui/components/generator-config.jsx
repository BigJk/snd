import Types from '/js/ui/components/generator/types';
import { Input } from '/js/ui/components/index';

export default () => ({
	view(vnode) {
		return (
			<div className='lh-copy'>
				<Input
					label='Random Seed'
					placeholder='121FA0GA...'
					value={vnode.attrs.value.seed}
					oninput={(e) => vnode.attrs.onchange('seed', e.target.value)}
				/>{' '}
				<div className='mb2 o-70'>
					A random seed will make the random number generator deterministic. The same seed will result in the same generated random values.
				</div>
				<div className='btn btn-primary mb2' onclick={() => vnode.attrs.onchange('seed', Math.ceil(Math.random() * 1000000000))}>
					Reroll
				</div>
				<div className='divider' />
				{vnode.attrs.config.map((val) => {
					if (!Types[val.type] || vnode.attrs.value[val.key] === undefined) {
						return null;
					}

					return (
						<div>
							{m(Types[val.type].view, {
								value: vnode.attrs.value[val.key],
								oninput: (newVal) => {
									vnode.attrs.onchange(val.key, newVal);
								},
								inEdit: false,
								label: val.name,
							})}
							<div className='o-70 mt2 mb2'>{val.description}</div>
							<div className='divider' />
						</div>
					);
				})}
			</div>
		);
	},
});
