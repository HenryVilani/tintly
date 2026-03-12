import type { BaseColor } from "./Color.js";
import type { ColorModel } from "./ColorModel.js";
import { ColorNotSupported } from "./Errors.js";

type AnyModel = ColorModel<BaseColor>;

class ColorRegistry {

	private models = new Map<string, AnyModel>();

	register<T extends BaseColor>(model: ColorModel<T>): this {
		this.models.set(model.type, model as AnyModel);
		return this;
	}

	parse(input: string): BaseColor | null {
		for (const model of this.models.values()) {
			const result = model.parse(input);
			if (result !== null) return result;
		}
		return null;
	}

	convert<To extends BaseColor>(color: BaseColor, targetType: string): To | null {
		if (color.type === targetType) return color as To;

		const from = this.models.get(color.type);
		const to = this.models.get(targetType);
		if (!from || !to) return null;

		const xyz = from.toCanonical(color);
		return to.fromCanonical(xyz) as To;
	}

	has(type: string): boolean {
		return this.models.has(type);
	}

	types(): string[] {
		return [...this.models.keys()];
	}

	toString<T extends BaseColor>(color: T): string {

		const _color = this.models.get(color.type);
		if (!_color) throw new ColorNotSupported(color.type);

		return _color.toString(color)

	}

}

export const Color = new ColorRegistry();