import type { BaseColor } from "../core/Color.js";
import type { ColorModel } from "../core/ColorModel.js";
import { Tintly } from "../core/Registry.js";

const linearize = (v: number) =>
	v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;

const gammify = (v: number) =>
	v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;

const toXYZMatrix = [
	[0.4124564, 0.3575761, 0.1804375],
	[0.2126729, 0.7151522, 0.072175],
	[0.0193339, 0.119192, 0.9503041],
];

const fromXYZMatrix = [
	[3.2404542, -1.5371385, -0.4985314],
	[-0.969266, 1.8760108, 0.041556],
	[0.0556434, -0.2040259, 1.0572252],
];

const matMul = (m: number[][], v: number[]) =>
	m.map((row) => row.reduce((sum, c, i) => sum + c * (v[i] ?? 0), 0));

export interface CMY extends BaseColor {
	type: "CMY";

	c: number;
	m: number;
	y: number;
	alpha: number;
}

const cmyToRgb = (c: number, m: number, y: number) => {
	c /= 100;
	m /= 100;
	y /= 100;

	return [1 - c, 1 - m, 1 - y];
};

const rgbToCmy = (r: number, g: number, b: number) => {
	return {
		c: (1 - r) * 100,
		m: (1 - g) * 100,
		y: (1 - b) * 100,
	};
};

export const CMYSupport: ColorModel<CMY> = {
	type: "CMY",

	unsupportedOperations: ["alpha", "lighten", "darken", "harmony", "complement"],

	parse(input) {
		const m = input.match(
			/^cmy\(\s*([\d.]+)%?,\s*([\d.]+)%?,\s*([\d.]+)%?(?:,\s*([\d.]+))?\)$/i,
		);

		if (!m) return null;

		return {
			type: "CMY",
			c: Number(m[1]),
			m: Number(m[2]),
			y: Number(m[3]),
			alpha: m[4] !== undefined ? Number(m[4]) : 1,
		};
	},

	toCanonical(color) {
		const [r, g, b] = cmyToRgb(color.c, color.m, color.y);

		const lr = linearize(r!);
		const lg = linearize(g!);
		const lb = linearize(b!);

		const [x, y, z] = matMul(toXYZMatrix, [lr, lg, lb]);

		return { x: x!, y: y!, z: z!, alpha: color.alpha };
	},

	fromCanonical(color) {
		const [lr, lg, lb] = matMul(fromXYZMatrix, [color.x, color.y, color.z]);

		const clamp = (v: number) => Math.max(0, Math.min(1, v));

		const r = gammify(clamp(lr!));
		const g = gammify(clamp(lg!));
		const b = gammify(clamp(lb!));

		const { c, m, y } = rgbToCmy(r, g, b);

		return {
			type: "CMY",
			c,
			m,
			y,
			alpha: color.alpha
		};
	},

	toString(color) {
		const c = Number(color.c.toFixed(4));
		const m = Number(color.m.toFixed(4));
		const y = Number(color.y.toFixed(4));

		if (color.alpha === 1) {
			return `cmy(${c}% ${m}% ${y}%)`;
		}

		return `cmy(${c}% ${m}% ${y}% / ${color.alpha})`;
	},
};

Tintly.register(CMYSupport);
