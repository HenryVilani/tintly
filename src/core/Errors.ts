
export class ColorNotSupported extends Error {

	constructor(type: string) {
		super(`${type} is not supported.`);
	}

}
