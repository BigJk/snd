import FormGroup from './form-group';
import Input from './input';

import api from '/js/core/api';

import { error } from '/js/ui/toast';

export default () => {
	let state = {
		url: '',
		name: '',
	};

	return {
		view(vnode) {
			return (
				<div className='mb1 dib ba pa3 br2 b--black-10'>
					<div className='f5 mb2'>Import Image</div>
					<div className='divider' />
					<FormGroup label='File'>
						<input
							className='mb1'
							type='file'
							id='files'
							name='files[]'
							multiple
							onchange={(e) => {
								let files = e.target.files;

								for (let i = 0, f; (f = files[i]); i++) {
									if (!f.type.match('image.*')) {
										continue;
									}

									let reader = new FileReader();

									reader.onload = ((name) => (e) => {
										vnode.attrs.oninput(name, e.target.result);
										m.redraw();
									})(f.name);

									reader.readAsDataURL(f);
								}
							}}
						/>
					</FormGroup>
					<div className='tc b mt2'>OR BY</div>
					<div className='w-100'>
						{!vnode.attrs.hideName ? (
							<Input label='Name' placeholder='Name to save to (e.g. cool_image)' value={state.name} oninput={(e) => (state.name = e.target.value)} />
						) : null}
						<Input
							label='Import by URL'
							value={state.url}
							oninput={(e) => (state.url = e.target.value)}
							disabled={!vnode.attrs.hideName && state.name.length === 0}
						/>
						<div
							className='btn btn-primary'
							onclick={() => {
								api
									.fetchImage(state.url)
									.then((dataUri) => {
										vnode.attrs.oninput(state.name, dataUri);
										state.name = '';
										state.url = '';
									})
									.catch(error);
							}}
						>
							Import URL
						</div>
					</div>
				</div>
			);
		},
	};
};
