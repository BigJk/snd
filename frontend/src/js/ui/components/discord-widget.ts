import m from 'mithril';

// @ts-ignore
import { inElectron, shell } from 'src/js/electron';

type DiscordWidgetProps = {
	className?: string;
	width?: number;
	height?: number;
};

export default (): m.Component<DiscordWidgetProps> => {
	return {
		oncreate(vnode) {
			// If we are in electron we hide the join button inside the webview.
			if (inElectron) {
				vnode.dom.addEventListener('did-finish-load', (e: any) => {
					// @ts-ignore
					vnode.dom.insertCSS('div[class^="widgetFooter-"] { display: none !important; }');
				});
			}
		},
		view({ attrs }) {
			// If we are in electron we use a webview instead of an iframe.
			if (inElectron) {
				let width = attrs.width ? attrs.width + 'px' : '100%';
				let height = attrs.height ? attrs.height + 'px' : '100%';

				return m('webview', {
					src: 'https://discord.com/widget?id=678654745803751579&theme=dark',
					style: { width, height },
					nodeintegration: 'true',
					className: attrs.className ?? '',
				});
			}

			return m('iframe', {
				src: 'https://discord.com/widget?id=678654745803751579&theme=dark',
				width: attrs.width ?? undefined,
				height: attrs.height ?? undefined,
				allowtransparency: 'true',
				frameborder: '0',
				sandbox: 'allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts',
				className: attrs.className ?? '',
			});
		},
	};
};
