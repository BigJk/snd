import { trim } from 'lodash-es';

import { shell } from '/js/electron';

import api from '/js/core/api';
import store from '/js/core/store';

import { Base, Form, Header, Input, Select, Switch, TextArea } from '/js/ui/components';

import binder from '/js/ui/binder';
import { error, success } from '/js/ui/toast';

export default () => {
	let state = {
		spellcheckerLanguages: (store.data.settings?.spellcheckerLanguages ?? []).join(', '),
		packageRepos: (store.data.settings?.packageRepos ?? []).join('\n'),
		editingDevice: false,
	};

	let fetchDevices = () => {
		api.getAvailablePrinter().then((devices) => {
			devices = devices ?? {};
			const isDeviceSelected = Object.values(devices[store.data.settings.printerType])?.includes(store.data.settings.printerEndpoint);
			if (!isDeviceSelected) state.editingDevice = true;
		}, error);
	};

	fetchDevices();

	let version = () => {
		if (store.data.version === null || store.data.version?.gitCommitHash.length === 0) return null;

		return (
			<div className='white mb2 toast'>
				<div className='code f7'>
					<div className='white'>
						<span className='dib w4'>Build </span> : {store.data.version.buildTime}
					</div>
					<div className='white'>
						<span className='dib w4'>Commit Hash</span> : {store.data.version.gitCommitHash}
					</div>
					<div className='white'>
						<span className='dib w4'>Branch</span> : {store.data.version.gitBranch}
					</div>
					<div className='white-70 mt1'>If you want to submit a bug please provide the above information!</div>
				</div>
			</div>
		);
	};

	let body = () => {
		if (!store.data.settings || !store.data.printer) {
			return (
				<div className='flex-grow-1 flex justify-center items-center'>
					<div className='loading loading-lg' />
				</div>
			);
		}

		if (store.data.settings.stylesheets === null) {
			store.data.settings.stylesheets = [];
		}

		if (store.data.settings.packageRepos === null) {
			store.data.settings.packageRepos = [];
		}

		return (
			<div className='overflow-auto flex-grow-1'>
				<div className='flex flex-wrap pa3'>
					<div className='bg-white ph3 pt3 pb3 ba b--black-10 br1 flex-grow-1 lh-solid relative'>
						<div className='br2 br--top bl bt br b--black-10 absolute fw7 left-0 panel-title'>
							<i className='ion ion-md-settings mr1' />
							Application Settings
						</div>
						<Form className='w-50 f7 black-70'>
							<Input
								label='Spellchecking Languages'
								placeholder='e.g. en-US, de'
								value={state.spellcheckerLanguages}
								oninput={binder.inputString(state, 'spellcheckerLanguages')}
							/>
							<div className='o-70 lh-copy mt1'>Use a comma seperated list of languages that should be used for spellchecking like "en-US, de".</div>
						</Form>
						<div className='w-50 mt3'>
							<div className='divider' />
						</div>
						<Form className='w-50 f7 black-70'>
							<TextArea
								label='Package Repos'
								rows={5}
								placeholder='e.g. https://package-repo.de/packages.json'
								value={state.packageRepos}
								oninput={binder.inputString(state, 'packageRepos')}
							/>
							<div className='o-70 lh-copy mt1'>
								Can be used to add non-official package repos to the workshop. Should contain one package repo link per line.
							</div>
						</Form>
					</div>
				</div>
				<div className='flex flex-wrap ph3 pt1 pb2'>
					<div className='bg-white ph3 pt3 pb2 mt2 ba b--black-10 br1 flex-grow-1 lh-solid flex flex-wrap relative'>
						<div className='br2 br--top bl bt br b--black-10 absolute fw7 left-0 panel-title'>
							<i className='ion ion-md-print mr1' />
							Printer Settings
						</div>
						<div className='w-100'>
							<div
								className='btn btn-primary mb2'
								onclick={() => {
									m.route.set('/devices');
								}}
							>
								Pick Device
							</div>
						</div>
						<div className='w-50'>{printerSelection()}</div>
						<Form className='w-50 f7 black-70' horizontal={true}>
							<Input
								label='Printing Width'
								labelCol={4}
								placeholder='e.g. 384'
								value={store.data.settings.printerWidth}
								oninput={binder.inputNumber(store.data.settings, 'printerWidth')}
							/>
							<Input
								label='Empty Lines Before'
								labelCol={4}
								placeholder='e.g. 7'
								value={store.data.settings.commands.linesBefore}
								oninput={binder.inputNumber(store.data.settings.commands, 'linesBefore')}
							/>
							<Input
								label='Empty Lines After'
								labelCol={4}
								placeholder='e.g. 7'
								value={store.data.settings.commands.linesAfter}
								oninput={binder.inputNumber(store.data.settings.commands, 'linesAfter')}
							/>
						</Form>
						<div className='w-100'>
							<div className='divider' />
							<Form className='w-100 form-no-margin' horizontal={true}>
								<Switch
									label='Explicit Initialization'
									labelCol={4}
									value={store.data.settings.commands.explicitInit}
									oninput={binder.checkbox(store.data.settings.commands, 'explicitInit')}
								/>
								<Switch
									label='Force Standard Mode'
									labelCol={4}
									value={store.data.settings.commands.forceStandardMode}
									oninput={binder.checkbox(store.data.settings.commands, 'forceStandardMode')}
								/>
								<Switch
									label='Cut After Printing'
									labelCol={4}
									value={store.data.settings.commands.cut}
									oninput={binder.checkbox(store.data.settings.commands, 'cut')}
								/>
							</Form>
							<div className='divider' />
						</div>
						<div className='w-50 mb2'>
							<div className='f5 mb2 pt2'>Print Chunking</div>
							<div className='lh-copy o-70'>
								If you are using a old printer with a small print buffer you can tell Sales & Dungeons to split the printing into smaller chunks. This
								might help in avoiding gibberish print-outs.
							</div>
							<Form horizontal={true}>
								<Switch
									label='Enable'
									labelCol={4}
									value={store.data.settings.commands.splitPrinting}
									oninput={binder.checkbox(store.data.settings.commands, 'splitPrinting')}
								/>
								<Input
									label='Split Height'
									labelCol={4}
									placeholder='Pixel height to split like 300'
									value={store.data.settings.commands.splitHeight}
									oninput={binder.inputNumber(store.data.settings.commands, 'splitHeight')}
								/>
								<Input
									label='Split Delay'
									labelCol={4}
									placeholder='Delay after a print in milliseconds like 1000'
									value={store.data.settings.commands.splitDelay}
									oninput={binder.inputNumber(store.data.settings.commands, 'splitDelay')}
								/>
							</Form>
						</div>
					</div>
				</div>
				<div className='flex flex-wrap pa3'>
					<div className='bg-white ph3 pt3 pb3 ba b--black-10 br1 flex-grow-1 lh-solid flex flex-wrap relative'>
						<div className='br2 br--top bl bt br b--black-10 absolute fw7 left-0 panel-title'>
							<i className='ion ion-md-code mr1' />
							Global Stylesheets
						</div>
						<Form className='w-100 pt2'>
							{store.data.settings.stylesheets?.map((s, i) => (
								<div className='flex justify-between'>
									<Input value={s} placeholder='e.g. http://unpkg.com/style.css' oninput={binder.inputString(store.data.settings.stylesheets, i)} />
									<div className='btn btn-error ml2' onclick={() => store.data.settings.stylesheets.splice(i, 1)}>
										Delete
									</div>
								</div>
							))}
						</Form>
						<div className='btn btn-success btn-sm' onclick={() => store.data.settings.stylesheets.push('')}>
							New Entry
						</div>
					</div>
				</div>
				<div className='ph3 mt2'>{version()}</div>
				<div className='ph3 mt2 mb1'>
					Logo Icons made by
					<a onclick={() => shell.openExternal('https://www.flaticon.com/authors/smashicons')} title='Smashicons' className='ml1'>
						Smashicons
					</a>
					,
					<a onclick={() => shell.openExternal('https://www.flaticon.com/authors/good-ware')} title='Good Ware' className='mh1'>
						Good Ware
					</a>
					from
					<a onclick={() => shell.openExternal('https://www.flaticon.com/')} title='Flaticon' className='mh1'>
						www.flaticon.com
					</a>
				</div>
				<div className='ph3 pb4'>
					Software made with <i className='ion ion-md-heart red' /> by <a onclick={() => shell.openExternal('https://github.com/BigJk')}>BigJk</a>
				</div>
			</div>
		);
	};

	const printerSelection = () => {
		if (state.editingDevice) {
			return (
				<Form className='mr3 f7 black-70' horizontal={true}>
					<Select
						label='Printer Type'
						keys={Object.keys(store.data.printer)}
						selected={store.data.settings.printerType}
						labelCol={4}
						oninput={binder.inputString(store.data.settings, 'printerType')}
					/>
					<Input
						label='Endpoint'
						labelCol={4}
						placeholder='e.g. POS-80'
						value={store.data.settings.printerEndpoint}
						oninput={binder.inputString(store.data.settings, 'printerEndpoint')}
					/>
					<div className='mt3 lh-copy o-70'>{store.data.printer?.[store.data.settings.printerType]}</div>
				</Form>
			);
		}

		// Non-custom device:
		return (
			<div className='flex items-center lh-copy pa3 mr3 ba b--black-05 br4'>
				<i className='ion ion-md-print mr2 black-50 f4' />
				<div className='flex-auto'>
					<span className='f6 db fw7 truncate'>{store.data.settings.printerEndpoint}</span>
					<span className='f8 db black-50 truncate'>{store.data.settings.printerType}</span>
				</div>
				<div
					className='btn'
					onclick={() => {
						state.editingDevice = true;
					}}
				>
					Edit
				</div>
			</div>
		);
	};

	return {
		onremove() {
			store.pub('reload_settings');
		},
		view(vnode) {
			return (
				<Base active='settings'>
					<div className='h-100 flex flex-column'>
						<Header title='Settings' subtitle='Configure various aspects'>
							<div
								className='btn btn-success'
								onclick={() => {
									store.data.settings.spellcheckerLanguages = state.spellcheckerLanguages.split(',').map(trim);
									store.data.settings.packageRepos = state.packageRepos.split('\n').map(trim);
									api.saveSettings(store.data.settings).then(
										() => {
											success('Settings saved');
											store.pub('reload_settings');
										},
										(err) => {
											error(err);
										}
									);
								}}
							>
								Save Settings
							</div>
						</Header>
						{body()}
					</div>
				</Base>
			);
		},
	};
};
