import { startsWith } from 'lodash-es';

import { inElectron } from '/js/electron';

import api from '/js/core/api';

import { Tooltip } from '/js/ui/components';

const pre = `
<!DOCTYPE html>
<html lang="en">
  <title> </title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  {{CSS}}
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

export default () => {
	let state = {
		id: Math.floor(Math.random() * 10000000),
		loading: false,
		lastContent: '',
	};

	let updateContent = (frame, content, stylesheets, scale, overflow) => {
		if (content === state.lastContent) {
			return;
		}

		state.lastContent = content;

		let preCss = pre
			.replace(
				'{{CSS}}',
				(stylesheets ?? [])
					.map((sheet) => {
						if (sheet[0] === '/') {
							sheet = location.origin + sheet;
						}
						return '<link rel="stylesheet" href="' + sheet + '">';
					})
					.join('\n')
			)
			.replace('{{ZOOM}}', scale)
			.replace('{{OVERFLOW}}', overflow ?? 'overlay');

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
			api.previewCache(state.id.toString(), preCss + fixed + post).then((url) => {
				frame.stop();
				frame
					.loadURL(url)
					.then(() => {})
					.catch(() => {
						// TODO: investigate IPC error that doesn't seem to have any negative impact.
					});
			});

			// create a 5-second timeout. If this timeout is triggered we most likely have an infinite loop
			// in the template. We stop the webview and show a warning message.
			let timeout = setTimeout(() => {
				frame.stop();
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
			state.loading = true;
			frame.contentWindow.location.reload(true);
			frame.onload = () => {
				let doc = frame.contentWindow.document;

				doc.open();
				doc.write(preCss + fixed + `<script>parent.postMessage({ type: 'done', id: ${state.id}}, '*')</script>` + post);
				doc.close();
			};
		}
	};

	let targetElement = inElectron ? 'webview' : 'iframe';

	let onIFrameMessage = (event) => {
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
		oncreate(vnode) {
			let frame = vnode.dom.querySelector(targetElement);

			if (inElectron) {
				frame.addEventListener(
					'dom-ready',
					() => updateContent(frame, vnode.attrs.content, vnode.attrs.stylesheets, vnode.attrs.scale ?? 1.0, vnode.attrs.overflow),
					{ once: true }
				);
			} else {
				window.addEventListener('message', onIFrameMessage);
				updateContent(frame, vnode.attrs.content, vnode.attrs.stylesheets, vnode.attrs.scale ?? 1.0, vnode.attrs.overflow);
			}
		},
		onupdate(vnode) {
			updateContent(
				vnode.dom.querySelector(targetElement),
				vnode.attrs.content,
				vnode.attrs.stylesheets,
				vnode.attrs.scale ?? 1.0,
				vnode.attrs.overflow
			);
		},
		onremove(vnode) {
			if (inElectron) {
				vnode.dom.querySelector('webview').closeDevTools();
			} else {
				window.removeEventListener('message', onIFrameMessage);
			}
		},
		view(vnode) {
			let scale = vnode.attrs.scale ?? 1.0;
			let width = 0;
			if (typeof vnode.attrs.width === 'number') {
				width = ((vnode.attrs.width ?? 384) + 30) * (vnode.attrs.scaleWidth ? scale : 1.0) + 'px';
			} else {
				width = vnode.attrs.width;
			}

			return (
				<div className={`relative ${vnode.attrs.className}`}>
					{inElectron ? (
						<webview
							src='data:text/html,'
							disablewebsecurity
							webpreferences='allowRunningInsecureContent, javascript=yes'
							style={{ width: width }}
							className='h-100'
						/>
					) : (
						<iframe
							style={{ width: width }}
							className='h-100'
							name='result'
							sandbox='allow-scripts allow-same-origin'
							allowFullScreen='false'
							allowpaymentrequest='false'
							frameBorder='0'
							src=''
						/>
					)}

					{vnode.attrs.devTools === true ? (
						<Tooltip content='Opens the DevTools for this Template View. Great for debugging Javascript.'>
							<div className='absolute bottom-0 left-0 ma2'>
								<div className='btn btn-primary btn-sm' onclick={() => vnode.dom.querySelector('webview').openDevTools()}>
									DevTools
								</div>
							</div>
						</Tooltip>
					) : null}

					{vnode.attrs.loading === true || state.loading ? (
						<div className='absolute bottom-0 right-0 ma2' style={{ width: '16px' }}>
							<div className='loading' />
						</div>
					) : null}
				</div>
			);
		},
	};
};
