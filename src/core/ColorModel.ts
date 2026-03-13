import type { Canonical } from "./Canonical.js";
import type { BaseColor } from "./Color.js";

export type Operation =
	| "alpha"
	| "mix"
	| "scale"
	| "lighten"
	| "darken"
	| "grayscale"
	| "invert"
	| "complement"
	| "harmony"
	| "luminance"
	| "contrastRatio"
	| "readableOn"
	| "clamp";

export interface ColorModel<T extends BaseColor> {
	unsupportedOperations?: Operation[];

	readonly type: T["type"];

	parse(input: string): T | null;

	toCanonical(color: T): Canonical;
	fromCanonical(color: Canonical): T;

	toString(color: T): string;
}
