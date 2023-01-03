import { dataSourceId, generatorId, templateId } from '/js/core/model-helper';
import store from '/js/core/store';

export function dataSourceById(id) {
	return store.data.sources.find((e) => dataSourceId(e) === id);
}

export function templateById(id) {
	return store.data.templates.find((e) => templateId(e) === id);
}

export function generatorById(id) {
	return store.data.generators.find((e) => generatorId(e) === id);
}
