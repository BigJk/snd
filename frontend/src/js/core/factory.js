export function NewTemplate() {
	return {
		name: '',
		slug: '',
		author: '',
		description: '',
		printTemplate: '',
		listTemplate: '',
		skeletonData: {},
	};
}

export function NewDataSource() {
	return {
		name: '',
		slug: '',
		author: '',
		url: '',
	};
}

export function NewEntry() {
	return {
		id: 'ENT-' + Math.ceil(Math.random() * 999999).toString() + '-' + Math.ceil(Math.random() * 999999).toString(),
		name: '',
		data: {},
	};
}

export function NewScript() {
	return {
		name: '',
		slug: '',
		author: '',
		source: '',
		description: '',
	};
}
