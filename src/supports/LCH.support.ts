import type { BaseColor } from "../core/Color.js";
import type { ColorModel } from "../core/ColorModel.js";
import { Color } from "../core/Registry.js";

export interface LCH extends BaseColor {
	type: "LCH";

	l: number;
	c: number;
	h: number;
	a: number;
}

const Xn = 0.95047;
const Yn = 1.0;
const Zn = 1.08883;

const epsilon = 216 / 24389;
const kappa = 24389 / 27;

const f = (t: number) => (t > epsilon ? Math.cbrt(t) : (kappa * t + 16) / 116);

const finv = (t: number) =>
	t ** 3 > epsilon ? t ** 3 : (116 * t - 16) / kappa;

export const LCHSupport: ColorModel<LCH> = {
	type: "LCH",

	parse(input) {
		const m = input.match(
			/^lch\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\)$/i,
		);

		if (!m) return null;

		return {
			type: "LCH",
			l: Number(m[1]),
			c: Number(m[2]),
			h: Number(m[3]),
			a: m[4] !== undefined ? Number(m[4]) : 1,
		};
	},

	toCanonical(color) {
		const hr = (color.h * Math.PI) / 180;

		const a = color.c * Math.cos(hr);
		const b = color.c * Math.sin(hr);

		const fy = (color.l + 16) / 116;
		const fx = fy + a / 500;
		const fz = fy - b / 200;

		const xr = finv(fx);
		const yr = finv(fy);
		const zr = finv(fz);

		return {
			x: xr * Xn,
			y: yr * Yn,
			z: zr * Zn,
			a: color.a,
		};
	},

	fromCanonical(color) {
		const xr = color.x / Xn;
		const yr = color.y / Yn;
		const zr = color.z / Zn;

		const fx = f(xr);
		const fy = f(yr);
		const fz = f(zr);

		const L = 116 * fy - 16;
		const a = 500 * (fx - fy);
		const b = 200 * (fy - fz);

		const C = Math.sqrt(a * a + b * b);

		let H = (Math.atan2(b, a) * 180) / Math.PI;
		if (H < 0) H += 360;

		return {
			type: "LCH",
			l: L,
			c: C,
			h: H,
			a: color.a,
		};
	},

	toString(color) {
		const l = Number(color.l.toFixed(4));
		const c = Number(color.c.toFixed(4));
		const h = Number(color.h.toFixed(4));

		if (color.a === 1) {
			return `lch(${l}% ${c} ${h})`;
		}

		return `lch(${l}% ${c} ${h} / ${color.a})`;
	},
};

Color.register(LCHSupport);
