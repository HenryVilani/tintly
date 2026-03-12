import type { BaseColor } from "../core/Color.js";
import type { ColorModel } from "../core/ColorModel.js";
import { Tintly } from "../core/Registry.js";

const linearize = (v: number) =>
	v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;

// Aplica gamma linear → sRGB
const gammify = (v: number) =>
	v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;

// Matriz IEC 61966-2-1 — D65 white point
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

export interface RGBA extends BaseColor {
	type: "RGBA";

	r: number;
	g: number;
	b: number;
	alpha: number;
}

export const RGBASuppor: ColorModel<RGBA> = {
	type: "RGBA",

	parse(input) {
		const m = input.match(
			/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/,
		);

		if (!m) return null;

		return {
			type: "RGBA",
			r: Number(m[1]),
			g: Number(m[2]),
			b: Number(m[3]),
			alpha: m[4] !== undefined ? Number(m[4]) : 1,
		};
	},

	toCanonical(color) {
		const lr = linearize(color.r / 255);
		const lg = linearize(color.g / 255);
		const lb = linearize(color.b / 255);
		const [x, y, z] = matMul(toXYZMatrix, [lr, lg, lb]);
		return { x: x!, y: y!, z: z!, alpha: color.alpha };
	},

	fromCanonical(color) {
		const [lr, lg, lb] = matMul(fromXYZMatrix, [color.x, color.y, color.z]);
		const clamp = (v: number) => Math.max(0, Math.min(1, v));
		return {
			type: "RGBA",
			r: Math.round(gammify(clamp(lr!)) * 255),
			g: Math.round(gammify(clamp(lg!)) * 255),
			b: Math.round(gammify(clamp(lb!)) * 255),
			alpha: color.alpha,
		};
	},

	toString(color) {
		const r = Math.round(color.r);
		const g = Math.round(color.g);
		const b = Math.round(color.b);

		if (color.alpha === 1) {
			return `rgb(${r} ${g} ${b})`;
		}

		return `rgb(${r} ${g} ${b} / ${color.alpha})`;
	},
};

Tintly.register(RGBASuppor);
