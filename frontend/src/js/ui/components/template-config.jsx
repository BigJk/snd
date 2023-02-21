import Types from '/js/ui/components/config/types';

export default () => ({
	view(vnode) {
		return (
			<div className='lh-copy'>
				{(vnode.attrs.config || []).map((val) => {
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
