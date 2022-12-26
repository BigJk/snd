import { Input } from '../index';

export default {
	name: 'S&D Format',
	view: () => {
		let url = '';

		return {
			view(vnode) {
				return (
					<div>
						<div className='mb3 lh-copy'>
							<div className='mb2'>
								<b>Import {vnode.attrs.type} either locally (e.g. .zip, folder) or from the internet via a URL</b>
							</div>
							<div>
								<b>Warning:</b> A {vnode.attrs.type} with the same author and identification name will overwrite any previous imported version!
							</div>
						</div>
						<div className='mb3'>
							<div className='btn btn-primary mr2' onclick={() => vnode.attrs.onimport('zip')}>
								Import .zip
							</div>
							<div className='btn btn-primary' onclick={() => vnode.attrs.onimport('folder')}>
								Import Folder
							</div>
						</div>
						<div className='divider' />
						<div>
							<Input label='Import URL' placeholder='http://example.com/example.zip' oninput={(e) => (url = e.target.value)} />
							<div className='btn btn-primary' onclick={() => vnode.attrs.onimport('url', url)}>
								Import URL
							</div>
						</div>
					</div>
				);
			},
		};
	},
};
