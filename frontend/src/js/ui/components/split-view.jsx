import store from '/js/core/store';

import Preview from '/js/ui/components/preview';

export default () => {
	return {
		view(vnode) {
			return (
				<div className="h-100 ph3 pb3 flex justify-between overflow-auto">
					<div className="br1 ba b--black-10 bg-white mr2 flex-grow-1 flex flex-column overflow-auto lh-solid">{vnode.children}</div>
					<Preview
						className="br1 ba b--black-10 bg-black-05 flex-shrink-0"
						width={vnode.attrs.width}
						scale={vnode.attrs.scale}
						stylesheets={vnode.attrs.stylesheets ?? store.data.settings.stylesheets}
						content={vnode.attrs.content}
					/>
				</div>
			);
		},
	};
};
