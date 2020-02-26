export function newTemplate() {
	return {
		id: null,
		name: '',
		description: '',
		print_template: '',
		list_template: '',
		skeleton_data: '{}'
	};
}

export function newEntry() {
	return {
		id: null,
		name: '',
		data: ''
	};
}

export function newScript() {
	return {
		id: null,
		name: '',
		source: '',
		description: ''
	};
}
