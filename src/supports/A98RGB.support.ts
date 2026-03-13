import type { BaseColor } from "../core/Color.js";
import type { ColorModel } from "../core/ColorModel.js";
import { Tintly } from "../core/Registry.js";

const linearize = (v: number) => v ** 2.19921875;
const gammify = (v: number) => v ** (1 / 2.19921875);

const toXYZMatrix = [
	[0.576669, 0.1855582, 0.1882286],
	[0.297345, 0.6273635, 0.0752915],
	[0.0270314, 0.0706889, 0.9913375],
];

const fromXYZMatrix = [
	[2.0415879, -0.565007, -0.3447314],
	[-0.9692436, 1.8759675, 0.0415551],
	[0.0134443, -0.1183624, 1.015175],
];

const matMul = (m: number[][], v: number[]) =>
	m.map((row) => row.reduce((sum, c, i) => sum + c * (v[i] ?? 0), 0));

export interface A98RGB extends BaseColor {
	type: "A98RGB";
	r: number;
	g: number;
	b: number;
	alpha: number;
}

export const A98RGBSupport: ColorModel<A98RGB> = {
	type: "A98RGB",

	parse(input) {
		const m = input.match(
			/^color\(\s*a98-rgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/i,
		);
		if (!m) return null;
		return {
			type: "A98RGB",
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
			type: "A98RGB",
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
		if (color.alpha === 1) return `color(a98-rgb ${r} ${g} ${b})`;
		return `color(a98-rgb ${r} ${g} ${b} / ${color.alpha})`;
	},
};

Tintly.register(A98RGBSupport);
