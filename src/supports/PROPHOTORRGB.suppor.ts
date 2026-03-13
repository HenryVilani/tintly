import type { BaseColor } from "../core/Color.js";
import type { ColorModel } from "../core/ColorModel.js";
import { Tintly } from "../core/Registry.js";

const Et  = 1 / 512;
const Et2 = 16 / 512;

const linearize = (v: number) =>
	v <= Et2 ? v / 16 : v ** 1.8;

const gammify = (v: number) =>
	v < Et ? 16 * v : v ** (1 / 1.8);

const toXYZMatrix = [
	[0.7977604896723027,  0.13518583717574031, 0.0313493495815248 ],
	[0.2880711282292934,  0.7118432178101014,  0.00008565396060525902],
	[0.0,                 0.0,                 0.8251046025104602 ],
];

const fromXYZMatrix = [
	[ 1.3457989731016901, -0.25558010007997534, -0.05110628506753401],
	[-0.5446224939028347,  1.5082327413132781,   0.02053603239147973],
	[ 0.0,                 0.0,                  1.2119675456389454 ],
];

const matMul = (m: number[][], v: number[]) =>
	m.map((row) => row.reduce((sum, c, i) => sum + c * (v[i] ?? 0), 0));

export interface ProPhotoRGB extends BaseColor {
	type: "PROPHOTORGB";
	r: number;
	g: number;
	b: number;
	alpha: number;
}

export const ProPhotoRGBSupport: ColorModel<ProPhotoRGB> = {
	type: "PROPHOTORGB",

	parse(input) {
		const m = input.match(
			/^color\(\s*prophoto-rgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/i,
		);
		if (!m) return null;
		return {
			type: "PROPHOTORGB",
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
			type: "PROPHOTORGB",
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
		if (color.alpha === 1) return `color(prophoto-rgb ${r} ${g} ${b})`;
		return `color(prophoto-rgb ${r} ${g} ${b} / ${color.alpha})`;
	},
};

Tintly.register(ProPhotoRGBSupport);