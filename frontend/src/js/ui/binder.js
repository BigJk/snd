import set from 'lodash-es/set';

export default {
	inputString: (base, path, callback, filter) => {
		return (e) => {
			set(base, path, filter ? filter(e.target.value) : e.target.value);
			callback?.();
		};
	},
	inputNumber: (base, path, callback) => {
		return (e) => {
			set(base, path, parseInt(e.target.value) | 0);
			callback?.();
		};
	},
	checkbox: (base, path, callback) => {
		return (e) => {
			set(base, path, e.target.checked);
			callback?.();
		};
	},
};
