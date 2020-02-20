import m from 'mithril';

const pre = `
<!DOCTYPE html>
<html lang="en">
  <title> </title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  {{CSS}}
  <body class="sans-serif pv3" style="padding-left: 15px; padding-right: 15px;">
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
					className="w-100 h-100"
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
