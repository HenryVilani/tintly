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
	m.map((row) => row.reduce((s, c, i) => s + c * (v[i] ?? 0), 0));

const Kr = 0.299,
	Kg = 0.587,
	Kb = 0.114;


export interface YCbCr extends BaseColor {
	type: "YCBCR";
	y: number;
	cb: number;
	cr: number;
	alpha: number;
}

export const YCbCrSupport: ColorModel<YCbCr> = {
	type: "YCBCR",

	unsupportedOperations: ["harmony", "complement"],

	parse(input) {
		const m = input.match(
			/^ycbcr\(\s*([\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
		);
		if (!m) return null;
		return {
			type: "YCBCR",
			y: Number(m[1]),
			cb: Number(m[2]),
			cr: Number(m[3]),
			alpha: m[4] !== undefined ? Number(m[4]) : 1,
		};
	},

	toCanonical(color) {
		const r = color.y + 1.402 * color.cr;
		const g = color.y - 0.344136 * color.cb - 0.714136 * color.cr;
		const b = color.y + 1.772 * color.cb;
		const clamp = (v: number) => Math.max(0, Math.min(1, v));
		const [x, y, z] = matMul(toXYZMatrix, [
			linearize(clamp(r)),
			linearize(clamp(g)),
			linearize(clamp(b)),
		]);
		return { x: x!, y: y!, z: z!, alpha: color.alpha };
	},

	fromCanonical(color) {
		const [lr, lg, lb] = matMul(fromXYZMatrix, [color.x, color.y, color.z]);
		const clamp = (v: number) => Math.max(0, Math.min(1, v));
		const r = gammify(clamp(lr!));
		const g = gammify(clamp(lg!));
		const b = gammify(clamp(lb!));
		const Y = Kr * r + Kg * g + Kb * b;
		const Cb = (b - Y) / (2 * (1 - Kb));
		const Cr = (r - Y) / (2 * (1 - Kr));
		return { type: "YCBCR", y: Y, cb: Cb, cr: Cr, alpha: color.alpha };
	},

	toString(color) {
		const y = Number(color.y.toFixed(6));
		const cb = Number(color.cb.toFixed(6));
		const cr = Number(color.cr.toFixed(6));
		if (color.alpha === 1) return `ycbcr(${y} ${cb} ${cr})`;
		return `ycbcr(${y} ${cb} ${cr} / ${color.alpha})`;
	},
};

Tintly.register(YCbCrSupport);
