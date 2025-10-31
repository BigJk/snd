type TemplateElementBase = {
	color?: string;
	name?: string;
};

type GridTemplateElement = TemplateElementBase & {
	templateId: string;
	dataSourceId?: string;
	entryId?: string;
	configName?: string;
};

type GridGeneratorElement = TemplateElementBase & {
	generatorId: string;
	configName?: string;
	aiEnabled?: boolean;
};

type GridElement = GridTemplateElement | GridGeneratorElement;

type GridLinearExecution = {
	repeat?: number;
	elements: GridElement[];
};

type SessionGrid = {
	name: string;
	elements: (GridElement | GridLinearExecution)[];
};

/**
 * Check if an element is a grid template element
 * @param element The element to check
 * @returns True if the element is a grid template element
 */
export function isGridTemplateElement(element: any): element is GridTemplateElement {
	return (element as GridTemplateElement).templateId !== undefined;
}

/**
 * Check if an element is a grid generator element
 * @param element The element to check
 * @returns True if the element is a grid generator element
 */
export function isGridGeneratorElement(element: any): element is GridGeneratorElement {
	return (element as GridGeneratorElement).generatorId !== undefined;
}

/**
 * Check if an element is a grid linear execution
 * @param element The element to check
 * @returns True if the element is a grid linear execution
 */
export function isGridLinearExecution(element: any): element is GridLinearExecution {
	return (element as GridLinearExecution).elements !== undefined;
}

export { GridElement, GridTemplateElement, GridGeneratorElement, GridLinearExecution, SessionGrid };
