import type { BaseColor } from "../core/Color.js";
import type { ColorModel } from "../core/ColorModel.js";
import { Color } from "../core/Registry.js";

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

export interface YIQ extends BaseColor {
	type: "YIQ";

	y: number;
	i: number;
	q: number;
	a: number;
}

const yiqToRgb = (y: number, i: number, q: number) => {
	const r = y + 0.956 * i + 0.621 * q;
	const g = y - 0.272 * i - 0.647 * q;
	const b = y - 1.106 * i + 1.703 * q;

	return [r, g, b];
};

const rgbToYiq = (r: number, g: number, b: number) => {
	const y = 0.299 * r + 0.587 * g + 0.114 * b;
	const i = 0.596 * r - 0.274 * g - 0.322 * b;
	const q = 0.211 * r - 0.523 * g + 0.312 * b;

	return { y, i, q };
};

export const YIQSupport: ColorModel<YIQ> = {
	type: "YIQ",

	parse(input) {
		const m = input.match(
			/^yiq\(\s*([\d.\-]+)\s*,\s*([\d.\-]+)\s*,\s*([\d.\-]+)(?:,\s*([\d.]+))?\)$/i,
		);

		if (!m) return null;

		return {
			type: "YIQ",
			y: Number(m[1]),
			i: Number(m[2]),
			q: Number(m[3]),
			a: m[4] !== undefined ? Number(m[4]) : 1,
		};
	},

	toCanonical(color) {
		const [r, g, b] = yiqToRgb(color.y, color.i, color.q);

		const lr = linearize(r!);
		const lg = linearize(g!);
		const lb = linearize(b!);

		const [x, y, z] = matMul(toXYZMatrix, [lr, lg, lb]);

		return { x: x!, y: y!, z: z!, a: color.a };
	},

	fromCanonical(color) {
		const [lr, lg, lb] = matMul(fromXYZMatrix, [color.x, color.y, color.z]);

		const clamp = (v: number) => Math.max(0, Math.min(1, v));

		const r = gammify(clamp(lr!));
		const g = gammify(clamp(lg!));
		const b = gammify(clamp(lb!));

		const { y, i, q } = rgbToYiq(r, g, b);

		return {
			type: "YIQ",
			y,
			i,
			q,
			a: color.a,
		};
	},

	toString(color) {
		const y = Number(color.y.toFixed(6));
		const i = Number(color.i.toFixed(6));
		const q = Number(color.q.toFixed(6));

		if (color.a === 1) {
			return `yiq(${y} ${i} ${q})`;
		}

		return `yiq(${y} ${i} ${q} / ${color.a})`;
	},
};

Color.register(YIQSupport);
