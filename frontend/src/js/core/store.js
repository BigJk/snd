import { forEach, get, has, set, toPath } from 'lodash-es';

class PubSubStore {
	constructor(data) {
		this.data = data;
		this.eventSubs = {};
		this.changeSubs = {};
	}

	watch(subs, fn) {
		if (typeof subs === 'string') {
			subs = [subs];
		}

		let deleter = [];
		subs.forEach((s) => {
			if (!this.changeSubs[s]) {
				this.changeSubs[s] = {};
			}

			let id = Math.ceil(Math.random() * 5000000).toString();
			this.changeSubs[s][id] = fn;

			deleter.push(() => {
				delete this.changeSubs[s][id];
			});
		});

		return () => {
			deleter.forEach((d) => {
				d();
			});
		};
	}

	has(path) {
		return new Promise((resolve, reject) => {
			if (has(this.data, path)) {
				resolve(get(this.data, path));
			} else {
				reject();
			}
		});
	}

	there(paths) {
		if (typeof paths === 'string') {
			paths = [paths];
		}

		for (let i = 0; i < paths.length; i++) {
			if (!get(this.data, paths[i])) return false;
		}
		return true;
	}

	sub(subs, fn) {
		if (typeof subs === 'string') {
			subs = [subs];
		}

		let deleter = [];
		subs.forEach((s) => {
			if (!this.eventSubs[s]) {
				this.eventSubs[s] = {};
			}

			let id = Math.ceil(Math.random() * 5000000).toString();
			this.eventSubs[s][id] = fn;

			deleter.push(() => {
				delete this.eventSubs[s][id];
			});
		});

		return () => {
			deleter.forEach((d) => {
				d();
			});
		};
	}

	set(path, obj) {
		set(this.data, path, obj);

		let pathParts = toPath(path);
		let cur = '';

		while (pathParts.length > 0) {
			cur += (cur.length > 0 ? '.' : '') + pathParts.shift();
			if (this.changeSubs[cur]) {
				forEach(this.changeSubs[cur], (s) => {
					s(get(this.data, cur), cur);
				});
			}
		}
	}

	pub(type, ...args) {
		if (this.eventSubs[type]) {
			forEach(this.eventSubs[type], (s) => {
				s(type, ...args);
			});
		}
	}
}

export default new PubSubStore({
	settings: null,
	templates: null,
	generators: null,
	sources: null,
	printer: null,
	version: null,
	publicPackages: null,
	newVersion: null,
});
