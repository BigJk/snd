export default {
	name: 'FoundryVTT Module / System',
	view: () => ({
		view(vnode) {
			return (
				<div>
					<div className='mb3 lh-copy'>
						You can import data from FoundryVTT Modules and Systems. This will convert all the included packs and add them as Data Sources. To import
						a Module or System open the module.json or system.json file in it's folder.
					</div>
					<div className='btn btn-primary mr2' onclick={() => vnode.attrs.onimport('vtt')}>
						Import FoundryVTT (module.json, system.json)
					</div>
				</div>
			);
		},
	}),
};
