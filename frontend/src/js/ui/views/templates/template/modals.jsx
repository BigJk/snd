import { Input, Modal } from '/js/ui/components';

export function ModalInfo() {
	return {
		view(vnode) {
			if (!vnode.attrs.show) return null;

			return (
				<Modal title='Information' onclose={vnode.attrs.onclose}>
					<div className='mb1 b f5'>Template ID</div>
					<div className='mb2'>This is the template id that is used in the Database.</div>
					<Input value={vnode.attrs.id} />
					<div className='mt3 b mb1 f5'>API Print Endpoint</div>
					<div className='mb2'>
						This is the local endpoint if you want to remotely print this template. Just do a POST request containing the JSON encoded data that
						should be inserted.
					</div>
					<Input value={location.origin + '/api/extern/print/' + vnode.attrs.id} />
				</Modal>
			);
		},
	};
}

export function ModalSync() {
	return {
		view(vnode) {
			if (!vnode.attrs.show) return null;

			return (
				<Modal title='Live Sync' onclose={vnode.attrs.show}>
					<div className='mb3'>You can synchronise a template to a folder so that you are able to edit it in an external editor.</div>
					{vnode.attrs.active ? (
						<div className='btn btn-error' onclick={vnode.attrs.onstop}>
							Stop Sync
						</div>
					) : (
						<div className='btn btn-primary' onclick={vnode.attrs.onstart}>
							Start Sync
						</div>
					)}
				</Modal>
			);
		},
	};
}
