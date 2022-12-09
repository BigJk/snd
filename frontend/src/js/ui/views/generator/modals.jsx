import { inElectron, openFileDialog, openFolderDialog } from '/js/electron';
import { readFile } from '/js/file';

import api from '/js/core/api';
import store from '/js/core/store';

import { Input, Modal, TextArea } from '/js/ui/components';

import binder from '/js/ui/binder';
import { error, success } from '/js/ui/toast';

export function ModalImport() {
	let url = '';

	return {
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
				<Modal title='Import' onclose={vnode.attrs.onclose}>
					<div className='mb3 lh-copy'>
						<div className='mb2'>
							<b>Import generator either locally (e.g. .zip, folder) or from the internet via a URL</b>
						</div>
						<div>
							<b>Warning:</b> A generator with the same author and identification name will overwrite any previous imported version!
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
						<Input label='Import URL' placeholder='http://example.com/cool_generator.zip' oninput={(e) => (url = e.target.value)} />
						<div className='btn btn-primary' onclick={() => vnode.attrs.onimport('url', url)}>
							Import
						</div>
					</div>
				</Modal>
			);
		},
	};
}

export function ModalExport() {
	return {
		view(vnode) {
			if (!vnode.attrs.show) return null;

			return (
				<Modal title='Export' onclose={vnode.attrs.onclose}>
					<div className='mb3'>
						You can export this generator in multiple formats. This will only export the generator itself and no entries in any associated
						data sources!
					</div>
					<div className='btn btn-primary mr2 mb2' onclick={() => vnode.attrs.onexport('zip')}>
						Export as{' '}
						<b>
							gen_{vnode.attrs.gen.author}_{vnode.attrs.gen.slug}.zip
						</b>
					</div>
					<div className='btn btn-primary mb2' onclick={() => vnode.attrs.onexport('folder')}>
						Export to{' '}
						<b>
							gen_{vnode.attrs.gen.author}_{vnode.attrs.gen.slug}
						</b>{' '}
						folder
					</div>
				</Modal>
			);
		},
	};
}

export function ModalInfo() {
	return {
		view(vnode) {
			if (!vnode.attrs.show) return null;

			return (
				<Modal title='Information' onclose={vnode.attrs.onclose}>
					<div className='mb1 b f5'>Generator ID</div>
					<div className='mb2'>This is the generator id that is used in the Database.</div>
					<Input value={vnode.attrs.id}></Input>
					<div className='mt3 b mb1 f5'>API Print Endpoint</div>
					<div className='mb2'>
						This is the local endpoint if you want to remotely print this generator. Just do a POST request containing the JSON encoded
						config data that should be inserted.
					</div>
					<Input value={location.origin + '/api/extern/print/generator/' + vnode.attrs.id}></Input>
					<div className='mt3 b mb1 f5'>Current Config</div>
					<div className='mb2'>This is the JSON of the current configuration.</div>
					<TextArea rows={10} value={JSON.stringify(vnode.attrs.config, null, '\t')}></TextArea>
				</Modal>
			);
		},
	};
}
