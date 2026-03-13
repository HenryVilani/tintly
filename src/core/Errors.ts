import type { Operation } from "./ColorModel.js";

export class ColorNotSupported extends Error {

	constructor(type: string) {
		super(`${type} is not supported.`);
	}

}

export class OperationNotSupported extends Error {

	constructor(type: string, operation: Operation) {
		super(`${type} not support ${operation} operation.`);
	}

}
