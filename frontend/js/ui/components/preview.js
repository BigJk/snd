import m from 'mithril';

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
    	width: 0px;
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
  <body class="sans-serif" style="padding: 15px; overflow-y: {{OVERFLOW}}; zoom: {{ZOOM}};">
    <div id="content">`;

const post = `    
    </div>
  </body>
</html>
`;

export default () => {
	let lastContent = '';

	let updateContent = (iframe, content, stylesheets, scale, overflow) => {
		if (content === lastContent) {
			return;
		}

		lastContent = content;

		let preCss = pre
			.replace(
				'{{CSS}}',
				(stylesheets ?? [])
					.map(sheet => {
						if (sheet[0] === '/') {
							sheet = location.origin + sheet;
						}
						return '<link rel="stylesheet" href="' + sheet + '">';
					})
					.join('\n')
			)
			.replace('{{ZOOM}}', scale)
			.replace('{{OVERFLOW}}', overflow ?? 'overlay');
		let doc = iframe.contentWindow.document;
		doc.open();
		doc.write(preCss + (content ?? '').replace(/src="h/gi, 'src="/image-proxy?url=h') + post);
		doc.close();
	};

	return {
		oncreate(vnode) {
			updateContent(vnode.dom, vnode.attrs.content, vnode.attrs.stylesheets, vnode.attrs.scale ?? 1.0, vnode.attrs.overflow);
		},
		onupdate(vnode) {
			updateContent(vnode.dom, vnode.attrs.content, vnode.attrs.stylesheets, vnode.attrs.scale ?? 1.0, vnode.attrs.overflow);
		},
		view(vnode) {
			let scale = vnode.attrs.scale ?? 1.0;
			let width = 0;
			if (typeof vnode.attrs.width === 'number') {
				width = ((vnode.attrs.width ?? 384) + 30) * (vnode.attrs.scaleWidth ? scale : 1.0) + 'px';
			} else {
				width = vnode.attrs.width;
			}

			return <iframe style={{ width: width }} className={vnode.attrs.className} name="result" sandbox="allow-scripts allow-same-origin" allowfullscreen="false" allowpaymentrequest="false" frameborder="0" src="" />;
		}
	};
};
