import m from 'mithril';

export default new Proxy(
	{},
	{
		get(target, p) {
			return (...args) =>
				m.request({
					method: 'POST',
					url: '/api/' + p,
					body: args,
				});
		},
	}
);
