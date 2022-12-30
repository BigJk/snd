import m from 'mithril';

import { error } from '/js/ui/toast';

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

const remote = outsideRequire ? outsideRequire('@electron/remote') : null;

export const shell = remote?.shell;

// Add right-click menu interactions
if (electron) {
	let Menu = remote.Menu;
	let MenuItem = remote.MenuItem;

	remote.getCurrentWindow().webContents.on('context-menu', (event, params) => {
		const menu = new Menu();

		if (params.dictionarySuggestions.length === 0) {
			menu.append(
				new MenuItem({
					label: 'No spelling fix found...',
				})
			);
		} else {
			for (const suggestion of params.dictionarySuggestions) {
				menu.append(
					new MenuItem({
						label: suggestion,
						click: () => remote.getCurrentWindow().webContents.replaceMisspelling(suggestion),
					})
				);
			}
		}

		menu.append(
			new MenuItem({
				type: 'separator',
			})
		);

		menu.append(
			new MenuItem({
				label: 'Copy',
				role: 'copy',
			})
		);

		menu.append(
			new MenuItem({
				label: 'Cut',
				role: 'cut',
			})
		);

		menu.append(
			new MenuItem({
				label: 'Paste',
				role: 'paste',
			})
		);

		menu.append(
			new MenuItem({
				label: 'Select All',
				role: 'selectAll',
			})
		);

		menu.popup();
	});
}

export function close() {
	if (!electron) {
		return;
	}

	remote.getCurrentWindow().close();
}

export function setSpellcheckerLanguages(languages) {
	if (!electron) {
		return;
	}

	remote.session.defaultSession.setSpellCheckerLanguages(languages ?? ['en-US']);
}

export function openFolderDialog(title) {
	if (!electron) {
		error('Only available in GUI mode!');
		return;
	}

	return new Promise((resolve, reject) => {
		remote.dialog
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
		remote.dialog
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
