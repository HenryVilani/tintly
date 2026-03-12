import type { Canonical } from "./Canonical.js";
import type { BaseColor } from "./Color.js";

export interface ColorModel<T extends BaseColor> {

    readonly type: T["type"];
    
	parse(input: string): T | null;

    toCanonical(color: T): Canonical;
	fromCanonical(color: Canonical): T;

	toString(color: T): string;

}

