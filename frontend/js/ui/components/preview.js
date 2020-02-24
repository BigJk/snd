import m from 'mithril';

const pre = `
<!DOCTYPE html>
<html lang="en">
  <title> </title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  {{CSS}}
  <style>
  	::-webkit-scrollbar {
    	width: 3px;
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
  <body class="sans-serif" style="padding: 15px; overflow-y: overlay;">
    <div id="content">`;

const post = `    
    </div>
  </body>
</html>
`;

export default () => {
	let updateContent = (iframe, content, stylesheets) => {
		let preCss = pre.replace(
			'{{CSS}}',
			(stylesheets ?? [])
				.map(sheet => {
					if (sheet[0] === '/') {
						sheet = location.origin + sheet;
					}
					return '<link rel="stylesheet" href="' + sheet + '">';
				})
				.join('\n')
		);
		let doc = iframe.contentWindow.document;
		doc.open();
		doc.write(preCss + (content ?? '').replace(/src="h/gi, 'src="/image-proxy?url=h') + post);
		doc.close();
	};

	return {
		oncreate(vnode) {
			updateContent(vnode.dom, vnode.attrs.content, vnode.attrs.stylesheets);
		},
		onupdate(vnode) {
			updateContent(vnode.dom, vnode.attrs.content, vnode.attrs.stylesheets);
		},
		view(vnode) {
			return (
				<iframe
					style={{width: ((vnode.attrs.width ?? 384) + 30) + 'px'}}
					className="h-100"
					name="result"
					allow="midi *; geolocation *; microphone *; camera *; encrypted-media *;"
					sandbox="allow-modals allow-forms allow-scripts allow-same-origin allow-popups allow-top-navigation-by-user-activation"
					allowfullscreen=""
					allowpaymentrequest=""
					frameborder="0"
					src=""
				/>
			);
		}
	};
};
