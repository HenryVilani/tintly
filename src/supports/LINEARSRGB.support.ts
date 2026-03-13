import type { BaseColor } from "../core/Color.js";
import type { ColorModel } from "../core/ColorModel.js";
import { Tintly } from "../core/Registry.js";

const toXYZMatrix = [
	[0.4124564, 0.3575761, 0.1804375],
	[0.2126729, 0.7151522, 0.0721750],
	[0.0193339, 0.1191920, 0.9503041],
];

const fromXYZMatrix = [
	[ 3.2404542, -1.5371385, -0.4985314],
	[-0.9692660,  1.8760108,  0.0415560],
	[ 0.0556434, -0.2040259,  1.0572252],
];

const matMul = (m: number[][], v: number[]) =>
	m.map((row) => row.reduce((sum, c, i) => sum + c * (v[i] ?? 0), 0));

export interface LinearSRGB extends BaseColor {
	type: "LINEARSRGB";
	r: number;
	g: number;
	b: number;
	alpha: number;
}

export const LinearSRGBSupport: ColorModel<LinearSRGB> = {
	type: "LINEARSRGB",

	parse(input) {
		const m = input.match(
			/^color\(\s*srgb-linear\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/i,
		);
		if (!m) return null;
		return {
			type: "LINEARSRGB",
			r: Number(m[1]),
			g: Number(m[2]),
			b: Number(m[3]),
			alpha: m[4] !== undefined ? Number(m[4]) : 1,
		};
	},

	toCanonical(color) {
		const [x, y, z] = matMul(toXYZMatrix, [color.r, color.g, color.b]);
		return { x: x!, y: y!, z: z!, alpha: color.alpha };
	},

	fromCanonical(color) {
		const [r, g, b] = matMul(fromXYZMatrix, [color.x, color.y, color.z]);
		const clamp = (v: number) => Math.max(0, Math.min(1, v));
		return {
			type: "LINEARSRGB",
			r: clamp(r!),
			g: clamp(g!),
			b: clamp(b!),
			alpha: color.alpha,
		};
	},

	toString(color) {
		const r = Number(color.r.toFixed(6));
		const g = Number(color.g.toFixed(6));
		const b = Number(color.b.toFixed(6));
		if (color.alpha === 1) return `color(srgb-linear ${r} ${g} ${b})`;
		return `color(srgb-linear ${r} ${g} ${b} / ${color.alpha})`;
	},
};

Tintly.register(LinearSRGBSupport);