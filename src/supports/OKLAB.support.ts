import type { BaseColor } from "../core/Color.js";
import type { ColorModel } from "../core/ColorModel.js";
import { Tintly } from "../core/Registry.js";

export interface OKLAB extends BaseColor {
	type: "OKLAB";

	l: number;
	a: number;
	b: number;
	alpha: number;
}

const cbrt = Math.cbrt;

const pow3 = (x: number) => x * x * x;

// XYZ → LMS
const m1 = [
	[0.8189330101, 0.3618667424, -0.1288597137],
	[0.0329845436, 0.9293118715, 0.0361456387],
	[0.0482003018, 0.2643662691, 0.633851707],
];

// LMS → OKLAB
const m2 = [
	[0.2104542553, 0.793617785, -0.0040720468],
	[1.9779984951, -2.428592205, 0.4505937099],
	[0.0259040371, 0.7827717662, -0.808675766],
];

// OKLAB → LMS
const m1Inv = [
	[1.2270138511, -0.5577999807, 0.281256149],
	[-0.0405801784, 1.1122568696, -0.0716766787],
	[-0.0763812845, -0.4214819784, 1.5861632204],
];

// LMS → XYZ
const m2Inv = [
	[1, 0.3963377774, 0.2158037573],
	[1, -0.1055613458, -0.0638541728],
	[1, -0.0894841775, -1.291485548],
];

const matMul = (m: number[][], v: number[]) =>
	m.map((row) => row.reduce((sum, c, i) => sum + c * (v[i] ?? 0), 0));

export const OKLABSupport: ColorModel<OKLAB> = {
	type: "OKLAB",

	parse(input) {
		const m = input.match(
			/^oklab\(\s*([\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)(?:\s*,\s*([\d.]+))?\)$/i,
		);

		if (!m) return null;

		return {
			type: "OKLAB",
			l: Number(m[1]),
			a: Number(m[2]),
			b: Number(m[3]),
			alpha: m[4] !== undefined ? Number(m[4]) : 1,
		};
	},

	toCanonical(color) {
		const l = color.l;
		const a = color.a;
		const b = color.b;

		const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
		const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
		const s_ = l - 0.0894841775 * a - 1.291485548 * b;

		const l3 = pow3(l_);
		const m3 = pow3(m_);
		const s3 = pow3(s_);

		const x = 1.2270138511 * l3 - 0.5577999807 * m3 + 0.281256149 * s3;

		const y = -0.0405801784 * l3 + 1.1122568696 * m3 - 0.0716766787 * s3;

		const z = -0.0763812845 * l3 - 0.4214819784 * m3 + 1.5861632204 * s3;

		return { x, y, z, alpha: color.alpha };
	},

	fromCanonical(color) {
		const x = color.x;
		const y = color.y;
		const z = color.z;

		const l = 0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z;

		const m = 0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z;

		const s = 0.0482003018 * x + 0.2643662691 * y + 0.633851707 * z;

		const l_ = cbrt(l);
		const m_ = cbrt(m);
		const s_ = cbrt(s);

		const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;

		const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;

		const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

		return {
			type: "OKLAB",
			l: L,
			a: A,
			b: B,
			alpha: color.alpha,
		};
	},

	toString(color) {
		const l = Number(color.l.toFixed(6));
		const a = Number(color.a.toFixed(6));
		const b = Number(color.b.toFixed(6));

		if (color.alpha === 1) {
			return `oklab(${l} ${a} ${b})`;
		}

		return `oklab(${l} ${a} ${b} / ${color.alpha})`;
	},
};

Tintly.register(OKLABSupport);
