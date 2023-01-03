import { Input, Modal, TextArea } from '/js/ui/components';

import binder from '/js/ui/binder';

export function ModalChangeInfo() {
	let state = {
		lastShow: false,
		name: '',
		description: '',
	};

	return {
		onupdate(vnode) {
			if (!state.lastShow && vnode.attrs.show) {
				state.name = vnode.attrs.target.name;
				state.description = vnode.attrs.target.description;

				m.redraw();
			}

			state.lastShow = vnode.attrs.show;
		},
		view(vnode) {
			if (!vnode.attrs.show) return null;

			return (
				<Modal title='Edit Info' onclose={vnode.attrs.onclose}>
					<Input label='Name' placeholder='Name of the Data Source' value={state.name} oninput={binder.inputString(state, 'name')} />
					<TextArea label='Description' rows={3} value={state.description} oninput={binder.inputString(state, 'description')} />
					<div className='btn btn-success' onclick={() => vnode.attrs.onconfirm(state)}>
						Change
					</div>
				</Modal>
			);
		},
	};
}
