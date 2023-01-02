import 'toastify-js/src/toastify.css';

import Toastify from 'toastify-js';

export function success(message) {
	Toastify({
		text: message,
		duration: 3000,
		gravity: 'top',
		position: 'center',
		backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
	}).showToast();
}

export function error(message) {
	console.error(message);
	Toastify({
		text: message,
		duration: 3000,
		gravity: 'top',
		position: 'center',
		backgroundColor: 'linear-gradient(to right, red, darkred)',
	}).showToast();
}

const dialogBackgrounds = {
	NEUTRAL: 'linear-gradient(to right, #48AFF0, #137CBD)',
	RED: 'linear-gradient(to right, red, darkred)',
	SUCCESS: 'linear-gradient(to right, #00b09b, #96c93d)',
};

let dialogToast = {
	toast: null,
	reject: null,
	callback: null,
};

function resetDialogState() {
	dialogToast = {
		toast: null,
		reject: null,
		callback: null,
	};
}

function dialogInternal(question, bg) {
	// If a dialog is already open abort it and reset state.
	if (dialogToast.toast) {
		dialogToast.toast.hideToast();
		clearTimeout(dialogToast.callback);
		dialogToast.reject();
		resetDialogState();
	}

	return new Promise((resolve, reject) => {
		let duration = 5000 + 250;
		let div = document.createElement('div');

		dialogToast.callback = setTimeout(reject, duration);
		dialogToast.reject = reject;

		m.render(
			div,
			<div
				className='flex justify-between items-center'
				onmouseenter={() => clearTimeout(dialogToast.callback)}
				onmouseleave={() => (dialogToast.callback = setTimeout(reject, duration))}
			>
				<span className='mh3'>{question}</span>
				<div className='bg-white flex pv2 ph3' style={{ borderRadius: '0 2px 2px 0' }}>
					<div
						className='mr2 btn btn-success btn-sm'
						onclick={() => {
							clearTimeout(dialogToast.callback);
							dialogToast.toast.hideToast();
							resetDialogState();
							resolve();
							m.redraw();
						}}
					>
						Yes
					</div>
					<div
						className='btn btn-error btn-sm'
						onclick={() => {
							clearTimeout(dialogToast.callback);
							dialogToast.toast.hideToast();
							resetDialogState();
							reject();
							m.redraw();
						}}
					>
						No
					</div>
				</div>
			</div>
		);

		dialogToast.toast = Toastify({
			node: div,
			duration: duration,
			gravity: 'top',
			position: 'center',
			stopOnFocus: true,
			backgroundColor: bg,
			style: {
				padding: 0,
				borderRadius: '2px 5px 5px 2px',
			},
		});

		dialogToast.toast.showToast();
	});
}

export function dialog(question) {
	return dialogInternal(question, dialogBackgrounds.NEUTRAL);
}

export function dialogSuccess(question) {
	return dialogInternal(question, dialogBackgrounds.SUCCESS);
}

export function dialogWarning(question) {
	return dialogInternal(question, dialogBackgrounds.RED);
}
