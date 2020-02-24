import m from 'mithril';

import api from '../../core/api';

import Header from '../components/header';
import SideNav from '../components/side-nav';

import { success, error } from '../toast';

import map from 'lodash-es/map';

export default () => {
	let state = {
		settings: null,
		printer: null,
		version: null
	};

	api.getVersion().then(version => {
		state.version = version;
	});

	let fetchSettings = () => {
		api
			.getPrinter()
			.then(printer => {
				state.printer = printer;
			})
			.then(() => {
				api.getSettings().then(settings => {
					state.settings = settings;
				});
			});
	};

	let getPrinterDescription = () => {
		if (!state.settings || !state.printer) return null;

		return state.printer[state.settings.printer_type];
	};

	let version = () => {
		if (state.version === null || state.version?.git_commit_hash.length === 0) return null;

		return (
			<div>
				<div className="divider" />
				<div className="code">
					<div>
						<span className="dib w4">Build </span> : {state.version.build_time}
					</div>
					<div>
						<span className="dib w4">Commit Hash</span> : {state.version.git_commit_hash}
					</div>
					<div>
						<span className="dib w4">Branch</span> : {state.version.git_branch}
					</div>
					<div className="black-40 mt1">If you want to submit a bug please provide the above information!</div>
				</div>
			</div>
		);
	};

	fetchSettings();

	return {
		view(vnode) {
			return (
				<div className="h-100 w-100 flex flex-column black-80">
					<Header />

					<div className="flex-grow-1 flex overflow-auto">
						<SideNav page="settings" />
						<div className="flex-grow-1 overflow-auto ph3 pv2">
							<div className="form-group mw6 pb2">
								<label className="form-label">Printer Endpoint</label>
								<div className="flex justify-between pb2">
									<select className="form-select mr2" oninput={e => (state.settings.printer_type = e.target.value)}>
										{map(state.printer, (v, k) => {
											return (
												<option value={k} selected={k === state.settings?.printer_type}>
													{k}
												</option>
											);
										})}
									</select>
									<input type="text" className="form-input" value={state.settings?.printer_endpoint} oninput={e => (state.settings.printer_endpoint = e.target.value)} />
								</div>
								<span className="f7 black-50">{getPrinterDescription()}</span>
							</div>
							<div className="form-group mw6 pb2">
								<label className="form-label">Printer Width</label>
								<div className="flex justify-between pb2">
									<input type="text" className="form-input" value={state.settings?.printer_width} oninput={e => (state.settings.printer_width = parseInt(e.target.value) | 0)}/>
								</div>
								<span className="f7 black-50">This is the width of the printing area (most likely tha dots/line of your printer)</span>
							</div>
							<div className="form-group mw6 pb2">
								<label className="form-label">Additional Printer Commands</label>
								<label className="form-switch">
									<input type="checkbox" checked={state.settings?.commands.explicit_init} oninput={e => (state.settings.commands.explicit_init = e.target.checked)}/>
									<i className="form-icon"/> Explicit Initialization
								</label>
								<label className="form-switch">
									<input type="checkbox" checked={state.settings?.commands.force_standard_mode} oninput={e => (state.settings.commands.force_standard_mode = e.target.checked)}/>
									<i className="form-icon"/> Force Standard Mode
								</label>
								<label className="form-switch">
									<input type="checkbox" checked={state.settings?.commands.cut} oninput={e => (state.settings.commands.cut = e.target.checked)}/>
									<i className="form-icon"/> Cut After Printing
								</label>
								<div className="flex justify-between pt2">
									<div className="flex-grow-1 justify-between mr3">
										<label className="form-label">Empty Lines Before Print</label>
										<input type="text" className="form-input" value={state.settings?.commands.lines_before}
											   oninput={e => (state.settings.commands.lines_before = parseInt(e.target.value) | 0)}/>
									</div>
									<div className="flex-grow-1 justify-between">
										<label className="form-label">Empty Lines After Print</label>
										<input type="text" className="form-input" value={state.settings?.commands.lines_after}
											   oninput={e => (state.settings.commands.lines_after = parseInt(e.target.value) | 0)}/>
									</div>
								</div>
							</div>
							<div className="divider" />
							<div className="form-group mw6 pb1">
								<label className="form-label">Global Stylesheets</label>
								<div className="btn btn-primary btn-sm" onclick={() => state.settings.stylesheets.push('http://')}>
									New Entry
								</div>
								{state.settings?.stylesheets?.map((e, i) => {
									return (
										<div className="flex justify-between mt2">
											<input type="text" className="form-input" value={e} oninput={e => (state.settings.stylesheets[i] = e.target.value)} />
											<div className="btn btn-error ml2" onclick={() => state.settings.stylesheets.splice(i, 1)}>
												Delete
											</div>
										</div>
									);
								})}
							</div>
							<div className="divider" />
							<div
								className="btn btn-success mv2"
								onclick={() => {
									api.saveSettings(state.settings).then(
										() => {
											success('Settings saved');
											fetchSettings();
										},
										err => {
											error(err);
										}
									);
								}}
							>
								Save Changes
							</div>
							<div className="divider" />
							<div>
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
							{version()}
						</div>
					</div>
				</div>
			);
		}
	};
};
