import m from 'mithril';

import api from '../../core/api';

import Header from '../components/header';
import SideNav from '../components/side-nav';

import { success, error } from '../toast';

export default () => {
	let state = {
		settings: null
	};

	let fetchSettings = () => {
		api.getSettings().then(settings => {
			state.settings = settings;
		});
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
							<div className="form-group mw5 pb2">
								<label className="form-label">Printer Endpoint</label>
								<input type="text" className="form-input" value={state.settings?.printer_endpoint} oninput={e => (state.settings.printer_endpoint = e.target.value)} />
							</div>
							<div className="divider" />
							<div className="form-group mw6 pb2">
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
						</div>
					</div>
				</div>
			);
		}
	};
};
