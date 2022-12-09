import { Modal } from '/js/ui/components';

export default function () {
	return {
		view(vnode) {
			if (!vnode.attrs.show) return null;

			return (
				<Modal title='Export' onclose={vnode.attrs.onclose}>
					<div className='mb3'>
						You can export this {vnode.attrs.type} in multiple formats. This will only export the {vnode.attrs.type} itself and no entries
						in any associated data sources!
					</div>
					<div className='btn btn-primary mr2 mb2' onclick={() => vnode.attrs.onexport('zip')}>
						Export as{' '}
						<b>
							{vnode.attrs.prefix}
							{vnode.attrs.value.author}_{vnode.attrs.value.slug}.zip
						</b>
					</div>
					<div className='btn btn-primary mb2' onclick={() => vnode.attrs.onexport('folder')}>
						Export to{' '}
						<b>
							{vnode.attrs.prefix}
							{vnode.attrs.value.author}_{vnode.attrs.value.slug}
						</b>{' '}
						folder
					</div>
				</Modal>
			);
		},
	};
}
