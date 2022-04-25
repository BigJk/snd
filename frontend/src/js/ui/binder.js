import { set } from 'lodash-es';

export default {
	inputString: (base, path, callback, filter) => {
		return (e) => {
			let val = filter ? filter(e.target.value) : e.target.value;
			set(base, path, val);
			callback?.(val);
		};
	},
	inputNumber: (base, path, callback) => {
		return (e) => {
			let val = parseInt(e.target.value) | 0;
			set(base, path, val);
			callback?.(val);
		};
	},
	checkbox: (base, path, callback) => {
		return (e) => {
			set(base, path, e.target.checked);
			callback?.(e.target.checked);
		};
	},
};
