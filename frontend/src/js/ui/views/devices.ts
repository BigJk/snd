import m from 'mithril';
import { map } from 'lodash-es';

import store, { settings } from 'js/core/store';

import DividerVert from 'js/ui/shoelace/divider-vert';
import IconButton from 'js/ui/shoelace/icon-button';
import Select from 'js/ui/shoelace/select';

import Icon from 'js/ui/components/atomic/icon';
import InfoIcon from 'js/ui/components/atomic/info-icon';
import Title from 'js/ui/components/atomic/title';
import Device from 'js/ui/components/device';
import Flex from 'js/ui/components/layout/flex';
import Base from 'js/ui/components/view-layout/base';

import { error } from 'js/ui/toast';

const infoText = `On this page you can select the printer you want to use from the ones that were automatically detected.`;

type DevicesState = {
	typeFilter: string;
	refreshing: boolean;
};

const DevicesGridStyle = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
	gridGap: '1rem',
	alignItems: 'start',
	alignContent: 'start',
};

export default (): m.Component => {
	let state: DevicesState = {
		typeFilter: '',
		refreshing: false,
	};

	const availablePrinterTypes = () => Object.keys(store.value.printer).filter((k) => Object.keys(store.value.printer[k] ?? {}).length > 0);
	const hasAvailableDevices = () => availablePrinterTypes().length > 0;

	const refreshDevices = () => {
		state.refreshing = true;
		store.actions
			.loadPrinter()
			.then(() => {
				if (state.typeFilter && !availablePrinterTypes().includes(state.typeFilter)) {
					state.typeFilter = '';
				}
			})
			.catch(error)
			.finally(() => {
				state.refreshing = false;
				m.redraw();
			});
	};

	const header = () =>
		m(Flex, { justify: 'center', items: 'center' }, [
			hasAvailableDevices()
				? m(Select, {
						width: 250,
						default: 'Filter by type...',
						keys: availablePrinterTypes(),
						selected: state.typeFilter,
						clearable: true,
						onInput: (e) => {
							state.typeFilter = e.value;
						},
					})
				: m('div.f7.text-muted', 'No devices available'),
			m(DividerVert, { noSpacing: true, className: '.ml3.mr2' }),
			m(IconButton, { icon: 'refresh', intend: 'link', loading: state.refreshing, onClick: refreshDevices }, 'Refresh'),
		]);

	const emptyState = () =>
		m(
			Flex,
			{ direction: 'column', items: 'center', justify: 'center', gap: 3, className: '.h-100.tc.text-muted' },
			m(Icon, { icon: 'print', size: 1, className: '.o-40' }),
			m('div', [
				m('div.f5.fw6.mb2', 'No printers detected'),
				m('div.f7.lh-copy.mw6', 'Connect or pair a printer, then reopen this page or refresh the device list.'),
			]),
		);

	const devices = () =>
		hasAvailableDevices()
			? m(
					'div.w-100.h-100.overflow-auto',
					{ style: DevicesGridStyle },
					map(store.value.printer, (printers, type) => {
						if (!printers || Object.keys(printers).length === 0) return null;

						if (state.typeFilter.length > 0 && state.typeFilter !== type) return null;

						return map(printers, (endpoint, name) =>
							m(Device, {
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
							}),
						);
					}),
				)
			: emptyState();

	return {
		view() {
			return m(
				Base,
				{
					title: m(Title, ['Devices', m(InfoIcon, { className: '.ml2', size: 7 }, infoText)]),
					rightElement: header(),
					active: 'devices',
					classNameContainer: '.pa3',
				},
				m('div.h-100.overflow-auto', [devices()]),
			);
		},
	};
};
