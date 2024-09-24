export function buildProps(props: Record<string, any>): string {
	return Object.keys(props).reduce((acc, key) => {
		const val = props[key];

		if (val === null || val === undefined) {
			return acc;
		}

		switch (typeof val) {
			case 'boolean':
				if (val) {
					return `${acc}[${key}]`;
				} else {
					return acc;
				}
				break;
		}

		return `${acc}[${key}=${props[key]}]`;
	}, '');
}
