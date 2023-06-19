import m from 'mithril';

import { map } from 'lodash-es';

import store, { settings } from 'js/core/store';

import Select from 'js/ui/spectre/select';

import InfoIcon from 'js/ui/components/atomic/info-icon';
import Title from 'js/ui/components/atomic/title';
import Device from 'js/ui/components/device';
import Base from 'js/ui/components/view-layout/base';

const infoText = `On this page you can select the printer you want to use from the ones that were automatically detected.`;

type DevicesState = {
	search: string;
	typeFilter: string;
};

const DevicesGridStyle = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
	gridGap: '1rem',
};

export default (): m.Component => {
	let state: DevicesState = {
		search: '',
		typeFilter: '',
	};

	const header = () => {
		return m(
			'div',
			m(Select, {
				width: 250,
				default: 'Filter by type...',
				keys: Object.keys(store.value.printer).filter((k) => Object.keys(store.value.printer[k]).length > 0),
				selected: null,
				onInput: (e) => {
					state.typeFilter = e.value;
				},
			})
		);
	};

	const devices = () => {
		return m(
			'div.w-100.h-100.overflow-auto',
			{ style: DevicesGridStyle },
			map(store.value.printer, (printers, type) => {
				if (Object.keys(printers).length === 0) return null;

				if (state.typeFilter.length > 0 && state.typeFilter !== type) return null;

				return map(printers, (endpoint, name) => {
					return m(Device, {
						endpoint: endpoint,
						printer: name,
						type: type,
						active: store.value.settings?.printerType == type && store.value.settings?.printerEndpoint == endpoint,
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
				{
					title: m(Title, ['Devices', m(InfoIcon, { className: '.ml2', size: 7 }, infoText)]),
					rightElement: header(),
					active: 'devices',
					classNameContainer: '.pa3',
				},
				m('div.overflow-auto', [devices()])
			);
		},
	};
};
