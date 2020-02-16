import m from 'mithril';

import api from '../../core/api';

import { error, success } from '../toast';

import Header from '../components/header';
import SideNav from '../components/side-nav';
import Editor from '../components/Editor';
import ListHeader from '../components/list-header';
import ListEntry from '../components/list-entry';

import { newScript } from '../../core/factory';

export default () => {
	let state = {
		scripts: [],
		selected_script: null,
		new_script: null
	};

	let fetch = () => {
		api.getScripts().then(scripts => {
			state.scripts = scripts ?? [];
		});
	};

	let body = () => {
		let target = state.new_script ?? state.selected_script;
		if (!target) {
			return null;
		}

		return (
			<div className="flex-grow-1 overflow-auto relative">
				<Editor className="h-100" content={target.source} language="go" onchange={code => (target.source = code)} />
				<div className="absolute right-0 bottom-0 ma3 flex z-999">
					{state.new_script ? <input type="text" className="form-input input-sm ml2" placeholder="Script name..." value={target.name} oninput={e => (target.name = e.target.value)} /> : null}
					<div
						className="btn btn-success btn-sm ml2"
						onclick={() => {
							api.saveScript(target).then(
								() => {
									success('script saved');
									state.new_script = null;
									fetch();
								},
								err => {
									error(err);
								}
							);
						}}
					>
						Save
					</div>
					{!state.new_script ? (
						<div
							className="btn btn-primary btn-sm ml2"
							onclick={() => {
								api.runScript(target.id).then(
									() => {
										success('script started');
									},
									err => {
										error(err);
									}
								);
							}}
						>
							Run Script
						</div>
					) : null}
					<div
						className="btn btn-error btn-sm ml2"
						onclick={() => {
							state.new_script = null;
							state.selected_script = null;
						}}
					>
						Abort
					</div>
				</div>
			</div>
		);
	};

	fetch();

	return {
		view(vnode) {
			return (
				<div className="h-100 w-100 flex flex-column black-80">
					<Header />

					<div className="flex-grow-1 flex overflow-auto">
						<SideNav page="scripts" />
						<div className="w5 flex-shrink-0 overflow-auto br b--black-10">
							<ListHeader title="Scripts">
								<i
									className="ion ion-md-add-circle f5 green dim pointer"
									onclick={() => {
										state.new_script = newScript();
										state.selected_script = null;
									}}
								/>
							</ListHeader>
							{state.scripts.map((s, i) => {
								return (
									<ListEntry>
										<div
											className="flex justify-between"
											onclick={() => {
												state.selected_script = s;
												state.new_script = null;
											}}
											active={state.selected_script?.id === s.id}
										>
											<span>{i + 1}.</span>
											{s.name}
										</div>
									</ListEntry>
								);
							})}
						</div>

						<div className="flex-grow-1 flex flex-column overflow-auto">
							<div className="flex-shrink-0 bb b--black-10 ph3 pv2 bg-light-gray flex justify-between items-center">
								<div className="f6">{state?.selected_script?.name ?? 'No script selected...'}</div>
							</div>
							{body()}
						</div>
					</div>
				</div>
			);
		}
	};
};
