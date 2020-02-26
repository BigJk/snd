import m from 'mithril';

import api from '../../../core/api';
import store from '../../../core/store';
import binder from '../../binder';

import Base from '../../components/base';
import Header from '../../components/header';
import Input from '../../components/input';
import Switch from '../../components/switch';
import Select from '../../components/select';
import Form from '../../components/form';

import { success, error } from '../../toast';

export default () => {
	let version = () => {
		if (store.data.version === null || store.data.version?.git_commit_hash.length === 0) return null;

		return (
			<div className="white mb2 toast">
				<div className="code f7">
					<div className="white">
						<span className="dib w4">Build </span> : {store.data.version.build_time}
					</div>
					<div className="white">
						<span className="dib w4">Commit Hash</span> : {store.data.version.git_commit_hash}
					</div>
					<div className="white">
						<span className="dib w4">Branch</span> : {store.data.version.git_branch}
					</div>
					<div className="white-70 mt1">If you want to submit a bug please provide the above information!</div>
				</div>
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

		if(store.data.settings.stylesheets === null) {
			store.data.settings.stylesheets = [];
		}

		return (
			<div className="overflow-auto flex-grow-1">
				<div className="flex flex-wrap pa3">
					<div className="ph3 pt3 pb2 mt2 ba b--black-10 br2 flex-grow-1 lh-solid flex flex-wrap relative">
						<div className="absolute fw7 left-0 panel-title">
							<i className="ion ion-md-print mr1" />
							Printer Settings
						</div>
						<Form className="flex-grow-1 mr4-ns mr0 f7 black-70" horizontal={true}>
							<Select label="Printer Type" keys={Object.keys(store.data.printer)} selected={store.data.settings.printer_type} labelCol={4} oninput={binder.inputString(store.data.settings, 'printer_type')} />
							<Input label="Endpoint" labelCol={4} placeholder="e.g. POS-80" value={store.data.settings.printer_endpoint} oninput={binder.inputString(store.data.settings, 'printer_endpoint')} />
							<div className="mt3">{store.data.printer?.[store.data.settings.printer_type]}</div>
						</Form>
						<Form className="flex-grow-1 f7 black-70" horizontal={true}>
							<Input label="Printing Width" labelCol={4} placeholder="e.g. 384" value={store.data.settings.printer_width} oninput={binder.inputNumber(store.data.settings, 'printer_width')} />
							<Input label="Empty Lines Before" labelCol={4} placeholder="e.g. 7" value={store.data.settings.commands.lines_before} oninput={binder.inputNumber(store.data.settings.commands, 'lines_before')} />
							<Input label="Empty Lines After" labelCol={4} placeholder="e.g. 7" value={store.data.settings.commands.lines_after} oninput={binder.inputNumber(store.data.settings.commands, 'lines_after')} />
						</Form>
						<div className="w-100">
							<div className="divider" />
							<Form className="w-100 form-no-margin" horizontal={true}>
								<Switch label={'Explicit Initialization'} labelCol={4} value={store.data.settings.commands.explicit_init} oninput={binder.checkbox(store.data.settings.commands, 'explicit_init')} />
								<Switch label={'Force Standard Mode'} labelCol={4} value={store.data.settings.commands.force_standard_mode} oninput={binder.checkbox(store.data.settings.commands, 'force_standard_mode')} />
								<Switch label={'Cut After Printing'} labelCol={4} value={store.data.settings.commands.cut} oninput={binder.checkbox(store.data.settings.commands, 'cut')} />
							</Form>
						</div>
					</div>
				</div>
				<div className="flex flex-wrap pa3">
					<div className="ph3 pt3 pb3 ba b--black-10 br2 flex-grow-1 lh-solid flex flex-wrap relative">
						<div className="absolute fw7 left-0 panel-title">
							<i className="ion ion-md-code mr1" />
							Global Stylesheets
						</div>
						<Form className="w-100 pt2">
							{store.data.settings.stylesheets?.map((s, i) => {
								return (
									<div className="flex justify-between">
										<Input value={s} placeholder="e.g. http://unpkg.com/style.css" oninput={binder.inputString(store.data.settings.stylesheets, i)} />
										<div className="btn btn-error ml2" onclick={() => store.data.settings.stylesheets.splice(i, 1)}>
											Delete
										</div>
									</div>
								);
							})}
						</Form>
						<div className="btn btn-success btn-sm" onclick={() => store.data.settings.stylesheets.push('')}>
							New Entry
						</div>
					</div>
				</div>
				<div className="ph3 mt2">{version()}</div>
				<div className="ph3 mt2 pb4">
					Logo Icons made by
					<a href="https://www.flaticon.com/authors/smashicons" title="Smashicons" className="ml1">
						Smashicons
					</a>
					,
					<a href="https://www.flaticon.com/authors/good-ware" title="Good Ware" className="mh1">
						Good Ware
					</a>
					from
					<a href="https://www.flaticon.com/" title="Flaticon" className="mh1">
						www.flaticon.com
					</a>
				</div>
			</div>
		);
	};

	return {
		view(vnode) {
			return (
				<Base active={'settings'}>
					<div className="h-100 flex flex-column">
						<Header title={'Settings'}>
							<div
								className="btn btn-success btn-sm"
								onclick={() => {
									api.saveSettings(store.data.settings).then(
										() => {
											success('Settings saved');
										},
										err => {
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
		}
	};
};
