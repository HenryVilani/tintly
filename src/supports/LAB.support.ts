import type { BaseColor } from "../core/Color.js";
import type { ColorModel } from "../core/ColorModel.js";
import { Tintly } from "../core/Registry.js";

export interface LAB extends BaseColor {
	type: "LAB";

	l: number;
	a: number;
	b: number;
	alpha: number;
}

const Xn = 0.95047;
const Yn = 1.0;
const Zn = 1.08883;

const epsilon = 216 / 24389;
const kappa = 24389 / 27;

const f = (t: number) => (t > epsilon ? Math.cbrt(t) : (kappa * t + 16) / 116);

const finv = (t: number) =>
	t ** 3 > epsilon ? t ** 3 : (116 * t - 16) / kappa;

export const LABSupport: ColorModel<LAB> = {
	type: "LAB",

	parse(input) {
		const m = input.match(
			/^lab\(\s*([\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
		);

		if (!m) return null;

		return {
			type: "LAB",
			l: Number(m[1]),
			a: Number(m[2]),
			b: Number(m[3]),
			alpha: m[4] !== undefined ? Number(m[4]) : 1,
		};
	},

	toCanonical(color) {
		const fy = (color.l + 16) / 116;
		const fx = fy + color.a / 500;
		const fz = fy - color.b / 200;

		const xr = finv(fx);
		const yr = finv(fy);
		const zr = finv(fz);

		return {
			x: xr * Xn,
			y: yr * Yn,
			z: zr * Zn,
			alpha: color.alpha,
		};
	},

	fromCanonical(color) {
		const xr = color.x / Xn;
		const yr = color.y / Yn;
		const zr = color.z / Zn;

		const fx = f(xr);
		const fy = f(yr);
		const fz = f(zr);

		return {
			type: "LAB",
			l: 116 * fy - 16,
			a: 500 * (fx - fy),
			b: 200 * (fy - fz),
			alpha: color.alpha,
		};
	},

	toString(color) {
		const l = Number(color.l.toFixed(4));
		const a = Number(color.a.toFixed(4));
		const b = Number(color.b.toFixed(4));

		if (color.alpha === 1) {
			return `lab(${l}% ${a} ${b})`;
		}

		return `lab(${l}% ${a} ${b} / ${color.alpha})`;
	},
};

Tintly.register(LABSupport);
