import type { Canonical } from "./Canonical.js";
import type { BaseColor } from "./Color.js";
import type { ColorModel, Operation } from "./ColorModel.js";
import { ColorNotSupported, OperationNotSupported } from "./Errors.js";

type AnyModel = ColorModel<BaseColor>;

class ColorRegistry {

	private models = new Map<string, AnyModel>();
	
	private getModel(type: string): AnyModel {
		const model = this.models.get(type);
		if (!model) throw new ColorNotSupported(type);
		return model;
	}

	private clamp01(v: number): number {
		return Math.max(0, Math.min(1, v));
	}

	private assertSupports(color: BaseColor, op: Operation): void {
		const model = this.models.get(color.type);
		if (model?.unsupportedOperations?.includes(op)) {
			throw new OperationNotSupported(color.type, op);
		}
	}

	private rotateHueXYZ(canonical: Canonical, angleDeg: number): Canonical {
		const xn = 0.95047;
		const zn = 1.08883;
 
		const cx = canonical.x - xn * canonical.y;
		const cz = canonical.z - zn * canonical.y;
 
		const hue    = Math.atan2(cz, cx);
		const radius = Math.sqrt(cx * cx + cz * cz);
		const newHue = hue + (angleDeg * Math.PI) / 180;
 
		return {
			x: xn * canonical.y + radius * Math.cos(newHue),
			y: canonical.y,
			z: zn * canonical.y + radius * Math.sin(newHue),
			alpha: canonical.alpha,
		};
	}


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

		return to.fromCanonical(from.toCanonical(color)) as To;
	}

	has(type: string): boolean {
		return this.models.has(type);
	}

	types(): string[] {
		return [...this.models.keys()];
	}

	getUnsupportedOperations(type: string): Operation[] {
		const model = this.getModel(type);
		return model.unsupportedOperations ?? [];

	}

	toString<T extends BaseColor>(color: T): string {
		const model = this.models.get(color.type);
		if (!model) throw new ColorNotSupported(color.type);
		return model.toString(color);
	}

	setAlpha<T extends BaseColor>(color: T, alpha: number): T {
		this.assertSupports(color, "alpha");
		const model = this.getModel(color.type);
		const canonical = model.toCanonical(color);
		canonical.alpha = this.clamp01(alpha);
		return model.fromCanonical(canonical) as T;
	}

	adjustAlpha<T extends BaseColor>(color: T, amount: number): T {
		this.assertSupports(color, "alpha");
		const model = this.getModel(color.type);
		const canonical = model.toCanonical(color);
		canonical.alpha = this.clamp01(canonical.alpha + amount);
		return model.fromCanonical(canonical) as T;
	}

	getAlpha(color: BaseColor): number {
		this.assertSupports(color, "alpha");
		return this.getModel(color.type).toCanonical(color).alpha;
	}

	mix<T extends BaseColor>(colorA: T, colorB: BaseColor, weight: number = 0.5): T {
		this.assertSupports(colorA, "mix");
		this.assertSupports(colorB, "mix");

		const modelA = this.getModel(colorA.type);
		const modelB = this.getModel(colorB.type);

		const a = modelA.toCanonical(colorA);
		const b = modelB.toCanonical(colorB);

		weight = this.clamp01(weight);
		const lerp = (x: number, y: number) => x + (y - x) * weight;

		const mixed: Canonical = {
			x: lerp(a.x, b.x),
			y: lerp(a.y, b.y),
			z: lerp(a.z, b.z),
			alpha: lerp(a.alpha, b.alpha),
		};

		return modelA.fromCanonical(mixed) as T;
	}

	scale<T extends BaseColor>(from: T, to: BaseColor, steps: number = 5): T[] {
		this.assertSupports(from, "scale");
		this.assertSupports(to, "scale");
		if (steps < 2) return [from];
		return Array.from({ length: steps }, (_, i) =>
			this.mix(from, to, i / (steps - 1)),
		);
	}

	lighten<T extends BaseColor>(color: T, amount: number): T {
		this.assertSupports(color, "lighten");
		const model = this.getModel(color.type);
		const canonical = model.toCanonical(color);
		canonical.y = this.clamp01(canonical.y + amount);
		return model.fromCanonical(canonical) as T;
	}

	darken<T extends BaseColor>(color: T, amount: number): T {
		this.assertSupports(color, "darken");
		const model = this.getModel(color.type);
		const canonical = model.toCanonical(color);
		canonical.y = this.clamp01(canonical.y - amount);
		return model.fromCanonical(canonical) as T;
	}


	grayscale<T extends BaseColor>(color: T): T {
		this.assertSupports(color, "grayscale");
		const model = this.getModel(color.type);
		const canonical = model.toCanonical(color);

		canonical.x = canonical.y * 0.95047;
		canonical.z = canonical.y * 1.08883;
		return model.fromCanonical(canonical) as T;
	}


	invert<T extends BaseColor>(color: T): T {
		this.assertSupports(color, "invert");
		const model = this.getModel(color.type);
		const canonical = model.toCanonical(color);
		canonical.x = Math.max(0, 0.95047  - canonical.x);
		canonical.y = Math.max(0, 1.0      - canonical.y);
		canonical.z = Math.max(0, 1.08883  - canonical.z);
		return model.fromCanonical(canonical) as T;
	}

	complement<T extends BaseColor>(color: T): T {
		this.assertSupports(color, "complement");
		return this.harmony(color, 2)[1]!;
	}

	harmony<T extends BaseColor>(color: T, count: number = 3): T[] {
		this.assertSupports(color, "harmony");
		if (count < 1) return [];
 
		const model  = this.getModel(color.type);
		const canonical = model.toCanonical(color);
		const step   = 360 / count;
 
		return Array.from({ length: count }, (_, i) =>
			model.fromCanonical(this.rotateHueXYZ(canonical, step * i)) as T,
		);
	}

	luminance(color: BaseColor): number {
		this.assertSupports(color, "luminance");
		return this.getModel(color.type).toCanonical(color).y;
	}

	contrastRatio(colorA: BaseColor, colorB: BaseColor): number {
		this.assertSupports(colorA, "contrastRatio");
		this.assertSupports(colorB, "contrastRatio");
		const l1 = this.getModel(colorA.type).toCanonical(colorA).y;
		const l2 = this.getModel(colorB.type).toCanonical(colorB).y;
		const lighter = Math.max(l1, l2);
		const darker  = Math.min(l1, l2);
		return (lighter + 0.05) / (darker + 0.05);
	}

	readableOn(background: BaseColor): "black" | "white" {
		this.assertSupports(background, "readableOn");
		const lum = this.getModel(background.type).toCanonical(background).y;
		const contrastWhite = 1.05 / (lum + 0.05);
		const contrastBlack = (lum + 0.05) / 0.05;
		return contrastWhite >= contrastBlack ? "white" : "black";
	}

	clamp<T extends BaseColor>(color: T): T {
		const model = this.getModel(color.type);
		const canonical = model.toCanonical(color);
		canonical.x     = Math.max(0, canonical.x);
		canonical.y     = Math.max(0, canonical.y);
		canonical.z     = Math.max(0, canonical.z);
		canonical.alpha = this.clamp01(canonical.alpha);
		return model.fromCanonical(canonical) as T;
	}

}

export const Tintly = new ColorRegistry();