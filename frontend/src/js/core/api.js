import m from 'mithril';

export default new Proxy(
	{},
	{
		get(target, p, receiver) {
			return (...args) => {
				return m.request({
					method: 'POST',
					url: '/api/' + p,
					body: args,
				});
			};
		},
	}
);
