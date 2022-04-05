export default () => {
	let breadcrumbs = (b) => {
		return (
			<div className="inline-flex f4">
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
				<div className="margin-lh-minus ph3 pt3 mb3 flex justify-between items-end">
					<div className="lh-title">
						{vnode.attrs.breadcrumbs ? breadcrumbs(vnode.attrs.breadcrumbs) : <span className="f4 fw5 black-70">{vnode.attrs.title}</span>}
						<div className="f7 black-50">{vnode.attrs.subtitle}</div>
					</div>
					<div className="flex">{vnode.children}</div>
				</div>
			);
		},
	};
};
