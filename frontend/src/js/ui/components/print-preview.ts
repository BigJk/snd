import m from 'mithril';

import { startsWith } from 'lodash-es';

import * as API from 'js/core/api';
// @ts-ignore
import { inElectron } from 'js/core/electron';
import guid from 'js/core/guid';

const pre = `
<!DOCTYPE html>
<html lang="en">
  <title> </title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
        margin: 0;
    }
  
  	::-webkit-scrollbar {
    	width: 0;
	}
	
	::-webkit-scrollbar-track {
		background: #f1f1f1;
	}
	
	::-webkit-scrollbar-thumb {
		background: #c2c2c2;
	}
	
	::-webkit-scrollbar-thumb:hover {
		background: #d1d1d1;
	}
  </style>
  <body style="padding: 15px; overflow-y: {{OVERFLOW}}; zoom: {{ZOOM}};">
    <div id="content">`;

const post = `
    </div>
  </body>
</html>
`;

type PrintPreviewProps = {
	content: string;
	width?: number;
	scale?: number;
	overflow?: string;
};

type PrintPreviewState = {
	id: string;
	loading: boolean;
	lastContent: string;
};

export default (): m.Component<PrintPreviewProps> => {
	let state: PrintPreviewState = {
		id: guid(),
		loading: false,
		lastContent: '',
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
			// save the final template to the cache in the backend. The webview won't load scripts if we use
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

			// create a 5-second timeout. If this timeout is triggered we most likely have an infinite loop
			// in the template. We stop the webview and show a warning message.
			let timeout = setTimeout(() => {
				// @ts-ignore
				frame.stop();

				// @ts-ignore
				frame.loadURL('data:text/html,Template stopped after not responding for 5 seconds! Please check your code for infinite loops.');
			}, 5000);

			// Wait for the finish load event to stop the loading indicator and clear the infinite loop timeout.
			frame.addEventListener(
				'did-finish-load',
				() => {
					clearTimeout(timeout);
					state.loading = false;
					m.redraw();
				},
				{ once: true }
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
				doc.write(preCss + fixed + `<script>parent.postMessage({ type: 'done', id: ${state.id}}, '*')</script>` + post);
				doc.close();
			};
		}
	};

	let targetElement = inElectron ? 'webview' : 'iframe';

	let onIFrameMessage = (event: any) => {
		if (event.data.id !== state.id) {
			return;
		}

		switch (event.data.type) {
			case 'done':
				state.loading = false;
				m.redraw();
				break;
		}
	};

	return {
		oncreate({ attrs, dom }) {
			let frame = dom.querySelector(targetElement);
			if (!frame) {
				return;
			}

			let scale = attrs.scale ?? 1.0;
			let overflow = attrs.overflow ?? 'overlay';
			if (inElectron) {
				frame.addEventListener('dom-ready', () => updateContent(frame as HTMLElement, attrs.content, scale, overflow), {
					once: true,
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

			updateContent(frame as HTMLElement, attrs.content, attrs.scale ?? 1.0, attrs.overflow ?? 'overlay');
		},
		onremove(vnode) {
			if (inElectron) {
				// @ts-ignore
				vnode.dom.querySelector('webview').closeDevTools();
			} else {
				window.removeEventListener('message', onIFrameMessage);
			}
		},
		view(vnode) {
			return m('div', {}, []);
		},
	};
};
