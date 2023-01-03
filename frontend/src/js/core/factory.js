export function NewTemplate() {
	return {
		name: '',
		slug: '',
		author: '',
		description: '',
		printTemplate: '',
		listTemplate: '',
		skeletonData: {},
		images: {},
		dataSources: [],
	};
}

export function NewGenerator() {
	return {
		name: '',
		slug: '',
		author: '',
		description: '',
		printTemplate: '',
		passEntriesToJS: false,
		config: [],
		images: {},
		dataSources: [],
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
