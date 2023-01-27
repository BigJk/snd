import { Input, Modal, TextArea } from '/js/ui/components';

export function ModalInfo() {
	return {
		view(vnode) {
			if (!vnode.attrs.show) return null;

			return (
				<Modal title='Information' onclose={vnode.attrs.onclose}>
					<div className='mb1 b f5'>Generator ID</div>
					<div className='mb2'>This is the generator id that is used in the Database.</div>
					<Input value={vnode.attrs.id} />
					<div className='mt3 b mb1 f5'>API Print Endpoint</div>
					<div className='mb2'>
						This is the local endpoint if you want to remotely print this generator. Just do a POST request containing the JSON encoded config data
						that should be inserted.
					</div>
					<Input value={location.origin + '/api/extern/print/' + vnode.attrs.id} />
					<div className='mt3 b mb1 f5'>Current Config</div>
					<div className='mb2'>This is the JSON of the current configuration.</div>
					<TextArea rows={10} value={JSON.stringify(vnode.attrs.config, null, '\t')} />
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
				<Modal title='Live Sync' onclose={vnode.attrs.onclose}>
					<div className='mb3'>You can synchronise a generator to a folder so that you are able to edit it in an external editor.</div>
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
