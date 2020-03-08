import m from 'mithril';

import api from 'core/api';
import store from 'core/store';

import { Base, Header } from 'components/*';

import { success, error } from 'ui/toast';

export default () => {
	let state = {
		devices: [],
		hasFeature: true
	};

	api.hasExt('usbDevices').then(
		() => {
			api.usbDevices().then(devices => {
				state.devices = devices ?? [];
			}, error);
		},
		() => {
			state.hasFeature = false;
		}
	);

	let controls = () => {
		if (!state.hasFeature) return null;

		return (
			<div
				className="btn btn-primary"
				onclick={() => {
					api.usbDevices().then(devices => {
						state.devices = devices ?? [];
					}, error);
				}}
			>
				<i className="ion ion-md-refresh" />
			</div>
		);
	};

	let body = () => {
		if (!store.data.settings || !store.data.printer) {
			return (
				<div className="flex-grow-1 flex justify-center items-center">
					<div className="loading loading-lg" />
				</div>
			);
		}

		if (!state.hasFeature) {
			return (
				<div className="h-100 br1 bg-white overflow-auto ba b--black-10 flex justify-center items-center">
					<div className="tc">
						<i className="red f2 ion ion-md-alert" />
						<div className="f5 b">Feature not Enabled</div>
						<div className="black-50">LibUSB is not available in your version of Sales & Dungeons.</div>
					</div>
				</div>
			);
		}

		if (state.devices.length === 0) {
			return (
				<div className="h-100 br1 bg-white overflow-auto ba b--black-10 flex justify-center items-center">
					<div className="tc">
						<i className="red f2 ion ion-md-alert" />
						<div className="f5 b">No Suitable Device Found</div>
						<div className="mw6 black-50">Don't worry! If you plugged the printer in and it is not showing up there is still a chance that direct USB printing can work. Please stop by the Discord so we can check your printer!</div>
					</div>
				</div>
			);
		}

		return (
			<div className="h-100 br1 bg-white overflow-auto ba b--black-10">
				{state.devices.map(d => {
					return (
						<div className="flex justify-between items-center pa2 bb b--black-05">
							<div className="lh-solid">
								<div className="f6 fw7 mb1">{d.name}</div>
								<div className="f7 black-50">{d.endpoint}</div>
							</div>
							<div className="h2 flex justify-between items-center">
								<div
									className="btn btn-success mr2"
									onclick={() => {
										store.data.settings.printerType = 'Raw USB Printing';
										store.data.settings.printerEndpoint = d.endpoint;
										api.saveSettings(store.data.settings).then(() => {
											success('Settings changed');
										}, error);
									}}
								>
									Use
								</div>
							</div>
						</div>
					);
				})}
			</div>
		);
	};

	return {
		view() {
			return (
				<Base active={'usb'}>
					<div className="h-100 flex flex-column">
						<Header title="USB Devices" subtitle="List possible direct usb printing devices">
							{controls()}
						</Header>
						<div className="flex-grow-1 flex flex-column ph3 pb3 overflow-auto">{body()}</div>
					</div>
				</Base>
			);
		}
	};
};
