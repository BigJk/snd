import 'toastify-js/src/toastify.css';

import Toastify from 'toastify-js';

export function success(message) {
	Toastify({
		text: message,
		duration: 3000,
		gravity: 'top',
		position: 'center',
		backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)'
	}).showToast();
}

export function error(message) {
	Toastify({
		text: message,
		duration: 3000,
		gravity: 'top',
		position: 'center',
		backgroundColor: 'linear-gradient(to right, red, darkred)'
	}).showToast();
}
