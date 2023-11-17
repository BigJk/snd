import 'toastify-js/src/toastify.css';

import m from 'mithril';

import Toastify from 'toastify-js';

const dialogBackgrounds = {
	NEUTRAL: 'linear-gradient(to right, #48AFF0, #137CBD)',
	RED: 'linear-gradient(to right, red, darkred)',
	SUCCESS: 'linear-gradient(to right, #00b09b, #96c93d)',
};

export function success(message: string) {
	Toastify({
		text: message,
		duration: 3000,
		gravity: 'top',
		position: 'center',
		backgroundColor: dialogBackgrounds.SUCCESS,
	}).showToast();
}

export function neutral(message: string) {
	Toastify({
		text: message,
		duration: 3000,
		gravity: 'top',
		position: 'center',
		backgroundColor: dialogBackgrounds.NEUTRAL,
	}).showToast();
}

export function error(message: string) {
	console.error(message);
	Toastify({
		text: message,
		duration: 3000,
		gravity: 'top',
		position: 'center',
		backgroundColor: dialogBackgrounds.RED,
	}).showToast();
}

type DialogToastState = {
	toast: any;
	reject: any;
	callback: any;
};

const dialogToast: DialogToastState = {
	toast: null,
	reject: null,
	callback: null,
};

function resetDialogState() {
	dialogToast.toast = null;
	dialogToast.reject = null;
	dialogToast.callback = null;
}

function dialogInternal(question: string, bg: string) {
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

		// Convert from JSX to m hyperscript
		m.render(
			div,
			m(
				'div',
				{
					className: 'flex justify-between items-center',
					onmouseenter: () => clearTimeout(dialogToast.callback),
					onmouseleave: () => (dialogToast.callback = setTimeout(reject, duration)),
				},
				[
					m('span', { className: 'mh3' }, question),
					m('div', { className: 'bg-white flex pv2 ph3', style: { borderRadius: '0 2px 2px 0' } }, [
						m(
							'div',
							{
								className: 'mr2 btn btn-success btn-sm',
								onclick: () => {
									clearTimeout(dialogToast.callback);
									dialogToast.toast.hideToast();
									resetDialogState();
									resolve(true);
									m.redraw();
								},
							},
							'Yes',
						),
						m(
							'div',
							{
								className: 'btn btn-error btn-sm',
								onclick: () => {
									clearTimeout(dialogToast.callback);
									dialogToast.toast.hideToast();
									resetDialogState();
									reject();
									m.redraw();
								},
							},
							'No',
						),
					]),
				],
			),
		);

		dialogToast.toast = Toastify({
			node: div,
			duration: duration,
			gravity: 'top',
			position: 'center',
			stopOnFocus: true,
			backgroundColor: bg,
			style: {
				padding: '0',
				borderRadius: '2px 5px 5px 2px',
			},
		});

		dialogToast.toast.showToast();
	});
}

export function dialog(question: string) {
	return dialogInternal(question, dialogBackgrounds.NEUTRAL);
}

export function dialogSuccess(question: string) {
	return dialogInternal(question, dialogBackgrounds.SUCCESS);
}

export function dialogWarning(question: string) {
	return dialogInternal(question, dialogBackgrounds.RED);
}
