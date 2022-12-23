import { startsWith } from 'lodash-es';

import dither from '/js/core/dither';

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

const post = (id) => `
	${dither}
	<script>parent.postMessage({ type: 'done', id: ${id}}, '*')</script>
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

	let updateContent = (iframe, content, stylesheets, scale, overflow) => {
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

		// We need to reset the iframe to clear old javascript declarations.
		// TODO: better way?
		state.loading = true;
		iframe.contentWindow.location.reload(true);
		iframe.onload = () => {
			let doc = iframe.contentWindow.document;

			doc.open();
			doc.write(preCss + fixed + post(state.id));
			doc.close();
		};
	};

	// wait for message emitted from iframe.
	let onMessage = (event) => {
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
			window.addEventListener('message', onMessage);

			updateContent(vnode.dom.querySelector('iframe'), vnode.attrs.content, vnode.attrs.stylesheets, vnode.attrs.scale ?? 1.0, vnode.attrs.overflow);
		},
		onupdate(vnode) {
			updateContent(vnode.dom.querySelector('iframe'), vnode.attrs.content, vnode.attrs.stylesheets, vnode.attrs.scale ?? 1.0, vnode.attrs.overflow);
		},
		onremove(vnode) {
			window.removeEventListener('message', onMessage);
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
					{vnode.attrs.loading === true || state.loading ? (
						<div className='absolute bottom-0 right-0 ma2'>
							<div className='loading' />
						</div>
					) : null}
				</div>
			);
		},
	};
};
