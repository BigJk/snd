import { Input, Modal, TextArea } from '/js/ui/components';

import binder from '/js/ui/binder';

export function ModalCreate() {
	let state = {
		author: '',
		name: '',
		slug: '',
		description: '',
	};

	return {
		onupdate(vnode) {
			if (!vnode.attrs.show) {
				state.author = '';
				state.name = '';
				state.slug = '';
				state.description = '';
			}
		},
		view(vnode) {
			if (!vnode.attrs.show) return null;

			return (
				<Modal title='New Data Source' onclose={vnode.attrs.onclose}>
					<Input label='Name' placeholder='Name of the Data Source' value={state.name} oninput={binder.inputString(state, 'name')} />
					<Input label='Author' placeholder='Author of the Data Source' value={state.author} oninput={binder.inputString(state, 'author')} />
					<Input
						label='Slug'
						placeholder='Slug of the Data Source (Alphanumerical and - allowed)'
						value={state.slug}
						oninput={binder.inputString(state, 'slug', null, (txt) => txt.replace(/[^a-z0-9-]/gi, ''))}
					/>
					<TextArea label='Description' rows={3} value={state.description} oninput={binder.inputString(state, 'description')} />
					<div className='btn btn-success' onclick={() => vnode.attrs.onconfirm(state)}>
						Create
					</div>
				</Modal>
			);
		},
	};
}

export function ModalDuplicate() {
	let state = {
		lastShow: false,
		author: '',
		name: '',
		slug: '',
		description: '',
	};

	return {
		onupdate(vnode) {
			if (!state.lastShow && vnode.attrs.show) {
				state.author = vnode.attrs.target.author;
				state.name = vnode.attrs.target.name;
				state.slug = vnode.attrs.target.slug;
				state.description = vnode.attrs.target.description;

				m.redraw();
			}

			state.lastShow = vnode.attrs.show;
		},
		view(vnode) {
			if (!vnode.attrs.show) return null;

			return (
				<Modal title='Duplicate Data Source' onclose={vnode.attrs.onclose}>
					<div className='mb2'>
						You are in the process of duplicating the '<b>{vnode.attrs.target.name}</b>' Data Source. <br />
						<br /> Please change Author and / or Slug to give the duplicate a new unique identifier.
					</div>
					<div className='divider' />
					<Input label='Name' placeholder='Name of the Data Source' value={state.name} oninput={binder.inputString(state, 'name')} />
					<Input label='Author' placeholder='Author of the Data Source' value={state.author} oninput={binder.inputString(state, 'author')} />
					<Input
						label='Slug'
						placeholder='Slug of the Data Source (Alphanumerical and - allowed)'
						value={state.slug}
						oninput={binder.inputString(state, 'slug', null, (txt) => txt.replace(/[^a-z0-9-]/gi, ''))}
					/>
					<TextArea label='Description' rows={3} value={state.description} oninput={binder.inputString(state, 'description')} />
					<div className='btn btn-success' onclick={() => vnode.attrs.onconfirm(state)}>
						Create
					</div>
				</Modal>
			);
		},
	};
}
