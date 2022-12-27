import api from '/js/core/api';

export function fetchMultipleEntries(sources) {
	return new Promise((resolve, reject) => {
		if (sources.length === 0) {
			resolve([]);
			return;
		}

		Promise.all(sources.map((ds) => api.getEntries(ds)))
			.then((res) => {
				let allEntries = [];

				// add a source field to each entry indicating from which data source it came from.
				res
					.map((entries, i) => (entries ?? []).map((e) => ({ ...e, source: sources[i] })))
					.forEach((entries) => {
						allEntries = [...allEntries, ...entries];
					});

				resolve(allEntries);
			})
			.catch(reject);
	});
}
