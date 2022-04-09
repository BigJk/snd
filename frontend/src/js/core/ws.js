import ReconnectingWebSocket from 'reconnecting-websocket';
import wcmatch from 'wildcard-match';

let clientId = Math.ceil(Math.random() * 10000000) + '-' + Math.ceil(Math.random() * 10000000);
let subscriptions = {};

/*
	Websocket
 */

const rws = new ReconnectingWebSocket('ws://127.0.0.1:7123/api/ws');

rws.addEventListener('open', () => {});

rws.addEventListener('message', (msg) => {
	let data = JSON.parse(msg.data);

	if (!data.type) {
		return;
	}

	Object.keys(subscriptions).forEach((k) => {
		let sub = subscriptions[k];

		if (sub.matcher(data.type)) {
			if (sub.noSelf && data.clientId === clientId) {
				return;
			}

			sub.fn(data.data, data.type);
		}
	});
});

export function emit(type, data) {
	rws.send(
		JSON.stringify({
			type,
			data,
			clientId,
		})
	);
}

export function on(tag, fn, noSelf) {
	let matcher = wcmatch(tag);
	let id = Math.ceil(Math.random() * 10000000) + '-' + Math.ceil(Math.random() * 10000000);

	subscriptions[id] = {
		tag,
		matcher,
		fn,
		noSelf,
	};

	return () => {
		delete subscriptions[id];
	};
}

export function keepOpen(tmplId) {
	let id = setInterval(() => {
		rws.send(
			JSON.stringify({
				type: 'KeepOpen',
				data: tmplId,
			})
		);
	}, 5000);
	return () => {
		clearInterval(id);
	};
}
