import { Modal, Select } from '/js/ui/components';
import ImportTypes from '/js/ui/components/import/types';

export default function () {
	let opened = '';

	return {
		oninit(vnode) {
			opened = vnode.attrs.types[0];
		},
		view(vnode) {
			if (!vnode.attrs.show) return null;

			if (vnode.attrs.loading)
				return (
					<Modal title='Import' noclose={true}>
						<div className='flex flex-column justify-center items-center'>
							<div className='loading loading-lg mb2' />
							Fetching data...
						</div>
					</Modal>
				);

			return (
				<Modal title='Import' onclose={vnode.attrs.onclose} className='mh450'>
					<Select
						selected={opened}
						keys={vnode.attrs.types}
						names={vnode.attrs.types.map((t) => ImportTypes[t].name)}
						oninput={(e) => (opened = e.target.value)}
						noDefault={true}
					/>
					<div className='pv2'>
						<div className='divider' />
					</div>
					{m(ImportTypes[opened].view, {
						type: vnode.attrs.type,
						onimport: vnode.attrs.onimport,
					})}
				</Modal>
			);
		},
	};
}
