import type { BaseColor } from "../core/Color.js";
import type { ColorModel } from "../core/ColorModel.js";
import { Tintly } from "../core/Registry.js";

const alpha = 1.09929682680944;
const beta = 0.018053968510807;

const linearize = (v: number) =>
	v < beta * 4.5 ? v / 4.5 : ((v + alpha - 1) / alpha) ** (1 / 0.45);

const gammify = (v: number) =>
	v < beta ? 4.5 * v : alpha * v ** 0.45 - (alpha - 1);

const toXYZMatrix = [
	[0.636958, 0.1446169, 0.168881],
	[0.2627002, 0.6779981, 0.0593017],
	[0.0, 0.0280727, 1.0609851],
];

const fromXYZMatrix = [
	[1.7166512, -0.3556708, -0.2533663],
	[-0.6666844, 1.6164812, 0.0157685],
	[0.0176399, -0.0427706, 0.9421031],
];

const matMul = (m: number[][], v: number[]) =>
	m.map((row) => row.reduce((sum, c, i) => sum + c * (v[i] ?? 0), 0));

export interface Rec2020 extends BaseColor {
	type: "REC2020";
	r: number;
	g: number;
	b: number;
	alpha: number;
}

export const Rec2020Support: ColorModel<Rec2020> = {
	type: "REC2020",

	parse(input) {
		const m = input.match(
			/^color\(\s*rec2020\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/i,
		);
		if (!m) return null;
		return {
			type: "REC2020",
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
			type: "REC2020",
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
		if (color.alpha === 1) return `color(rec2020 ${r} ${g} ${b})`;
		return `color(rec2020 ${r} ${g} ${b} / ${color.alpha})`;
	},
};

Tintly.register(Rec2020Support);
