import m from 'mithril';

export default () => {
	let breadcrumbs = b => {
		return (
			<div className="inline-flex f6">
				{b.map((e, i) => {
					if (i < b.length - 1) {
						if (e.link) {
							return (
								<span className="mr1">
									<span className="black-60 dim pointer mr1" onclick={() => m.route.set(e.link)}>
										{e.name}
									</span>
									/
								</span>
							);
						}
						return (
							<span className="mr1">
								<span className="black-60 mr1">{e.name}</span>/
							</span>
						);
					}
					return <span className="black-80">{e.name}</span>;
				})}
			</div>
		);
	};

	return {
		view(vnode) {
			return (
				<div className="ph3 h3 bg-grad-primary flex justify-between items-center bb b--black-10 flex-shrink-0">
					{vnode.attrs.breadcrumbs ? breadcrumbs(vnode.attrs.breadcrumbs) : <span className="f6 fw5 black-80">{vnode.attrs.title}</span>}
					<div>{vnode.children}</div>
				</div>
			);
		}
	};
};
