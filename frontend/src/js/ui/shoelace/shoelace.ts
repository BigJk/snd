export const intendToShoelace = (intend?: 'primary' | 'success' | 'error' | 'warning' | 'link') => {
	switch (intend) {
		case 'primary':
		case 'success':
		case 'warning':
			return intend;
		case 'error':
			return 'danger';
		case 'link':
			return 'text';
		default:
			return 'default';
	}
};

export const sizeToShoelace = (size?: 'sm' | 'lg') => {
	switch (size) {
		case 'sm':
			return 'small';
		case 'lg':
			return 'large';
		default:
			return 'small';
	}
};
