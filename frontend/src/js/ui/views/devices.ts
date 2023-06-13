import m from 'mithril';

import { map } from 'lodash-es';

import store, { settings } from 'js/core/store';

import Select from 'js/ui/spectre/select';

import Base from 'js/ui/components/base';
import Device from 'js/ui/components/device';
import InfoIcon from 'js/ui/components/info-icon';
import Title from 'js/ui/components/title';

const infoText = `On this page you can select the printer you want to use from the ones that were automatically detected.`;

export default (): m.Component => {
	const header = () => {
		return m(
			'div.mw5',
			m(Select, {
				keys: Object.keys(store.value.printer).filter((k) => Object.keys(store.value.printer[k]).length > 0),
				selected: null,
				oninput: (e) => {
					console.log(e);
				},
			})
		);
	};

	const devices = () => {
		return m(
			'div.flex.flex-wrap.mt3',
			map(store.value.printer, (printers, type) => {
				if (Object.keys(printers).length === 0) return null;

				return map(printers, (endpoint, name) => {
					return m(Device, {
						endpoint: endpoint,
						printer: name,
						type: type,
						active: store.value.settings?.printerType == type && store.value.settings?.printerEndpoint == endpoint,
						className: '.mr3.mb3',
						onUse: (printer, endpoint, type) => {
							settings.update((state) => {
								if (!state) return state;

								return {
									...state,
									printerEndpoint: endpoint,
									printerType: type,
								};
							});
						},
					});
				});
			})
		);
	};

	return {
		view(vnode) {
			return m(
				Base,
				{ title: m(Title, ['Devices', m(InfoIcon, { className: '.ml2', size: 7 }, infoText)]), active: 'devices', classNameContainer: '.pa3' },
				m('div', [header(), devices()])
			);
		},
	};
};
