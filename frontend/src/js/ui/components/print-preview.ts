import m from 'mithril';
import { startsWith } from 'lodash-es';

import { css, keyframes } from 'goober';
// @ts-ignore
import { inElectron } from 'js/electron';

import * as API from 'js/core/api';
import guid from 'js/core/guid';
import { dataDir, settings } from 'js/core/store';

import Loader from 'js/ui/shoelace/loader';

const PADDING = 15;

const pre = `
<!DOCTYPE html>
<html lang="en">
  <title> </title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
		html, body {
			margin: 0;
			padding: 0;
			border: 0;
			vertical-align: baseline;
		}
		article, aside, details, figcaption, figure,
		footer, header, hgroup, menu, nav, section {
			display: block;
		}
		body {
			line-height: 1;
		}

		#content::-webkit-scrollbar-thumb:hover {
			background: #d1d1d1;
		}

  	#content::-webkit-scrollbar, ::-webkit-scrollbar {
				width: 0;
		}

		#content::-webkit-scrollbar-track, ::-webkit-scrollbar-track {
			background: #f1f1f1;
		}

		#content::-webkit-scrollbar-thumb, ::-webkit-scrollbar-thumb {
			background: #c2c2c2;
		}

		#content::-webkit-scrollbar-thumb:hover, ::-webkit-scrollbar-thumb:hover {
			background: #d1d1d1;
		}
  </style>
  <body style="padding: ${PADDING}px; overflow-y: {{OVERFLOW}}; zoom: {{ZOOM}};">
    <div id="content">`;

const post = `
    </div>
  </body>
</html>
`;

const loadingFrames = keyframes`
	0% {
		opacity: 1.0;
	}
	50% {
		opacity: 0.5;
	}
	100% {
		opacity: 1.0;
	}
`;

const loadingClass = css`
	& > iframe,
	webview {
		animation: ${loadingFrames} 5s infinite;
	}
`;

export type PrintPreviewProps = {
	className?: string;
	content: string;
	width: number;
	loading?: boolean;
	overflow?: string;
	devTools?: boolean;
	onMessage?: (type: string, data: any) => void;
};

type PrintPreviewState = {
	id: string;
	loading: boolean;
	lastContent: string;
	aiEnabled: boolean;
	onMessage?: (type: string, data: any) => void;
};

export function openDevTools(dom: HTMLElement) {
	const elem = dom.querySelector('webview');
	if (elem) {
		// @ts-ignore
		elem.openDevTools();
	}
}

export default (): m.Component<PrintPreviewProps> => {
	let state: PrintPreviewState = {
		id: guid(),
		loading: false,
		lastContent: '',
		aiEnabled: false,
	};

	let updateContent = (frame: HTMLElement, content: string, scale: number, overflow: string) => {
		if (content === state.lastContent) {
			return;
		}

		state.lastContent = content;

		let preCss = pre.replace('{{ZOOM}}', scale.toString()).replace('{{OVERFLOW}}', overflow ?? 'overlay');

		let fixed = (content ?? '')
			.replaceAll(/url\(["']?(.+)\)/gi, (subString, ...args) => {
				let content = args[0];
				let symbol = '';

				switch (content[content.length - 1]) {
					case '"':
					case "'":
						symbol = content[content.length - 1];
				}

				if (startsWith(content, 'data:')) {
					return subString;
				}

				if (startsWith(content, 'http')) {
					return `url(${symbol}/proxy/${content})`;
				}

				return subString;
			})
			.replace(/src="h/gi, 'src="/proxy/h');

		if (inElectron) {
			// Save the final template to the cache in the backend. The webview won't load scripts if we use
			// data urls or some local files, so we serve it temporarily and serve it via the backend
			// webserver.
			state.loading = true;
			API.exec(API.PREVIEW_CACHE, state.id.toString(), preCss + fixed + post).then((url) => {
				// @ts-ignore
				frame.stop();
				frame // @ts-ignore
					.loadURL(url)
					.then(() => {})
					.catch(() => {
						// TODO: investigate IPC error that doesn't seem to have any negative impact.
					});
			});

			// Create a 120-second timeout. If this timeout is triggered we most likely have an infinite loop
			// in the template. We stop the webview and show a warning message.
			let timeout = setTimeout(() => {
				// @ts-ignore
				frame.stop();

				// @ts-ignore
				frame.loadURL('data:text/html,Template stopped after not responding for 120 seconds! Please check your code for infinite loops.');
			}, 120000); // TODO: handle AI...

			// Wait for the finish load event to stop the loading indicator and clear the infinite loop timeout.
			frame.addEventListener(
				'did-finish-load',
				() => {
					clearTimeout(timeout);
					state.loading = false;
					m.redraw();
				},
				{ once: true },
			);
		} else {
			// For headless mode we fall back to iframe and we need to reset the iframe to clear old javascript declarations.
			let iframe = frame as HTMLIFrameElement;

			state.loading = true;
			iframe.contentWindow?.location.reload();
			iframe.onload = () => {
				let doc = iframe.contentWindow?.document;
				if (!doc) {
					return;
				}

				doc.open();
				doc.write(preCss + fixed + `<script>parent.postMessage({ type: 'done', id: '${state.id}'}, '*');</script>` + post);
				doc.close();
			};
		}
	};

	let targetElement = inElectron ? 'webview' : 'iframe';

	let onIFrameMessage = (event: any) => {
		if (event.type === 'done' && event.data.id !== state.id) {
			return;
		}

		switch (event.data.type) {
			case 'done':
				state.loading = false;
				m.redraw();
				break;
			default:
				console.log(event);
				state.onMessage?.(event.data.type, event.data.data);
				break;
		}
	};

	const calcScale = (width: number) => width / settings.value.printerWidth;

	return {
		oncreate({ attrs, dom }) {
			let frame = dom.querySelector(targetElement);
			if (!frame) {
				return;
			}

			state.onMessage = attrs.onMessage;

			let scale = calcScale(attrs.width);
			let overflow = attrs.overflow ?? 'overlay';
			if (inElectron) {
				frame.addEventListener('dom-ready', () => updateContent(frame as HTMLElement, attrs.content, scale, overflow), {
					once: true,
				});
				frame.addEventListener('ipc-message', (data: any) => {
					state.onMessage?.(data.args[0], JSON.parse(data.args[1] ?? '{}'));
				});
			} else {
				window.addEventListener('message', onIFrameMessage);
				updateContent(frame as HTMLElement, attrs.content, scale, overflow);
			}
		},
		onupdate({ attrs, dom }) {
			let frame = dom.querySelector(targetElement);
			if (!frame) {
				return;
			}

			state.onMessage = attrs.onMessage;

			updateContent(frame as HTMLElement, attrs.content, calcScale(attrs.width), attrs.overflow ?? 'overlay');
		},
		onremove(vnode) {
			if (inElectron) {
				// @ts-ignore
				vnode.dom.querySelector('webview').closeDevTools();
			} else {
				window.removeEventListener('message', onIFrameMessage);
			}
		},
		view({ attrs, key, children }) {
			let width = attrs.width + PADDING * 2 + 'px';

			state.onMessage = attrs.onMessage;

			let frame: m.Children;
			if (inElectron) {
				frame = m('webview.h-100', {
					src: 'data:text/html,',
					disablewebsecurity: true,
					preload: `file:${dataDir.value}/preload.js`,
					webpreferences: 'allowRunningInsecureContent, javascript=yes',
					style: { width: width },
				});
			} else {
				frame = m('iframe.h-100', {
					style: { width: width },
					name: 'result',
					sandbox: 'allow-scripts allow-same-origin',
					allowFullScreen: 'false',
					allowpaymentrequest: 'false',
					frameBorder: '0',
					src: '',
				});
			}

			return m(`div.dib.relative${attrs.className ?? ''}${state.loading ? `.${loadingClass}` : ''}`, { key }, [
				frame,
				state.loading || attrs.loading === true
					? m('div.absolute.left-0.top-0.bg-white.ba.br2.b--black-20.ma3.ph2.pv1.light-shadow', m(Loader))
					: null,
				children,
			]);
		},
	};
};
