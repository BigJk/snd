// Workaround to avoid compile time require of Bundler.
// This will populate the electron variable with the
// correct runtime electron variable of the browser
// environment.
export const electron = eval('require("electron")');
export const dialog = electron.remote.dialog;
export const shell = electron.shell;

import m from 'mithril';

export function close() {
	electron.remote.getCurrentWindow().close();
}

export function openFolderDialog(title) {
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
