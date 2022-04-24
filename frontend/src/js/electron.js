// Workaround to avoid compile time require of Bundler.
// This will populate the electron variable with the
// correct runtime electron variable of the browser
// environment.
let outsideRequire = null;
try {
	outsideRequire = eval('require');
} catch (e) {
	console.log('headless mode detected');
}

export const electron = outsideRequire ? outsideRequire('electron') : null;
export const inElectron = !!electron;
export const dialog = electron?.remote.dialog;
export const shell = electron?.shell;

import m from 'mithril';
import { error } from '/js/ui/toast';

export function close() {
	if (!electron) {
		return;
	}

	electron.remote.getCurrentWindow().close();
}

export function openFolderDialog(title) {
	if (!electron) {
		error('Only available in GUI mode!');
		return;
	}

	return new Promise((resolve, reject) => {
		dialog
			.showOpenDialog({
				properties: ['openDirectory'],
				message: title ?? 'Select Folder',
			})
			.then((res) => {
				if (res.canceled || res.filePaths.length === 0) {
					reject();
					return;
				}

				resolve(res.filePaths[0]);
				m.redraw();
			});
	});
}

export function openFileDialog(title) {
	if (!electron) {
		error('Only available in GUI mode!');
		return;
	}

	return new Promise((resolve, reject) => {
		dialog
			.showOpenDialog({
				properties: ['openFile'],
				message: title ?? 'Select File',
			})
			.then((res) => {
				if (res.canceled || res.filePaths.length === 0) {
					reject();
					return;
				}

				resolve(res.filePaths[0]);
				m.redraw();
			});
	});
}
