import type { BaseColor } from "../core/Color.js";
import type { ColorModel } from "../core/ColorModel.js";
import { Tintly } from "../core/Registry.js";

const linearize = (v: number) =>
	v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;

const gammify = (v: number) =>
	v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;

const toXYZMatrix = [
	[0.4865709, 0.2656677, 0.1982173],
	[0.2289746, 0.6917385, 0.0792869],
	[0.0, 0.0451134, 1.0439444],
];

const fromXYZMatrix = [
	[2.4934969, -0.9313836, -0.4027108],
	[-0.829489, 1.7626641, 0.0236247],
	[0.0358458, -0.0761724, 0.9568845],
];

const matMul = (m: number[][], v: number[]) =>
	m.map((row) => row.reduce((sum, c, i) => sum + c * (v[i] ?? 0), 0));

export interface DisplayP3 extends BaseColor {
	type: "DISPLAYP3";
	r: number;
	g: number;
	b: number;
	alpha: number;
}

export const DisplayP3Support: ColorModel<DisplayP3> = {
	type: "DISPLAYP3",

	parse(input) {
		const m = input.match(
			/^color\(\s*display-p3\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/i,
		);
		if (!m) return null;
		return {
			type: "DISPLAYP3",
			r: Number(m[1]),
			g: Number(m[2]),
			b: Number(m[3]),
			alpha: m[4] !== undefined ? Number(m[4]) : 1,
		};
	},

	toCanonical(color) {
		const lr = linearize(color.r);
		const lg = linearize(color.g);
		const lb = linearize(color.b);
		const [x, y, z] = matMul(toXYZMatrix, [lr, lg, lb]);
		return { x: x!, y: y!, z: z!, alpha: color.alpha };
	},

	fromCanonical(color) {
		const [lr, lg, lb] = matMul(fromXYZMatrix, [color.x, color.y, color.z]);
		const clamp = (v: number) => Math.max(0, Math.min(1, v));
		return {
			type: "DISPLAYP3",
			r: gammify(clamp(lr!)),
			g: gammify(clamp(lg!)),
			b: gammify(clamp(lb!)),
			alpha: color.alpha,
		};
	},

	toString(color) {
		const r = Number(color.r.toFixed(6));
		const g = Number(color.g.toFixed(6));
		const b = Number(color.b.toFixed(6));
		if (color.alpha === 1) return `color(display-p3 ${r} ${g} ${b})`;
		return `color(display-p3 ${r} ${g} ${b} / ${color.alpha})`;
	},
};

Tintly.register(DisplayP3Support);
