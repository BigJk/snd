import m from 'mithril';

import * as nunjucks from 'nunjucks';

import store from '../../../core/store';

import Base from '../../components/base';
import Preview from '../../components/preview';
import Header from '../../components/header';
import Loading from '../../components/loading';

import map from 'lodash-es/map';

let tryParse = (data) => {
	try {
		return JSON.parse(data);
	}  catch (e) {

	}
	return {};
};

export default () => {
	let body = () => {
		if (!store.there('templates')) {
			return <Loading />;
		}

		return (
			<div className="">
				<div className="w-100 pr3">
					{map(store.data.templates, (v, k) => {
						return (
							<div className="w-25-l w-50 fl">
								<div className="pl3 pt3 flex flex-column">
									<Preview className="no-input h4 br2 br--top bg-secondary" overflow="hidden" width={'100%'} scale={0.5} content={nunjucks.renderString(v.printTemplate, { it: tryParse(v.skeletonData) })} stylesheets={store.data.settings.stylesheets} />
									<div className="pa2 bg-dark hover-bg-dark-lighten lh-solid pointer" onclick={() => m.route.set('/templates/' + v.id)}>
										<div className="f6 fw7 mb1 white">{v.name}</div>
										<div className="f7 white-80 cut-text">{v.description}</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		);
	};

	let updater = null;

	return {
		oninit() {
			store.pub('reload_templates');
			updater = setInterval(() => {
				store.pub('reload_templates');
			}, 5000);
		},
		onremove() {
			clearInterval(updater);
		},
		view(vnode) {
			return (
				<Base active={'templates'}>
					<div className="h-100 flex flex-column">
						<Header title={'Templates'}>
							<div className="btn btn-success btn-sm" onclick={() => m.route.set('/templates/new')}>
								Create New
							</div>
						</Header>
						{body()}
					</div>
				</Base>
			);
		}
	};
};
