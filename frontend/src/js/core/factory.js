export function newTemplate() {
	return {
		id: null,
		name: '',
		description: '',
		printTemplate: '',
		listTemplate: '',
		skeletonData: '{}',
	};
}

export function newEntry() {
	return {
		id: null,
		name: '',
		data: '',
	};
}

export function newScript() {
	return {
		id: null,
		name: '',
		source: '',
		description: '',
	};
}
