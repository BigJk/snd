export const hasFileApi = !!window.showDirectoryPicker;

export const openFolderDialog = async (write) => window.showDirectoryPicker({ mode: write ? 'readwrite' : 'read' });

export const writeJSONToFolder = async (rootHandle, json) => {
	const data = JSON.parse(json);

	// Create Folder
	const folder = await rootHandle.getDirectoryHandle(data.name, { create: true });

	// Create Files
	await Promise.all(
		Object.keys(data.files).map(async (fileName) => {
			console.log(`Saving file ${rootHandle.name}/${data.name}/${fileName}`);
			const fileHandle = await folder.getFileHandle(fileName, { create: true });
			const writable = await fileHandle.createWritable();
			await writable.write(data.files[fileName]);
			await writable.close();
		})
	);
};

export const folderToJSON = async (dirHandle) => {
	const data = {};
	data.name = dirHandle.name;
	data.files = {};

	for await (const [fileName, fileHandle] of dirHandle.entries()) {
		if (fileHandle.kind !== 'file') continue;
		const file = await fileHandle.getFile();
		data.files[fileName] = await file.text();
	}

	// Double encode so that it can be passed as a string value
	return JSON.stringify(data);
};
