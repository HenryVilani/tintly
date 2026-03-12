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

export interface HSB extends BaseColor {
	type: "HSB";

	h: number; // 0–360
	s: number; // 0–100
	b: number; // 0–100
	alpha: number; // 0–1
}

/**
 * HSB (also known as HSV) to RGB conversion.
 * h: 0–360, s: 0–100, b: 0–100
 * Returns r, g, b in range 0–1.
 */
const hsbToRgb = (
	h: number,
	s: number,
	b: number,
): [number, number, number] => {
	h = ((h % 360) + 360) % 360;
	s /= 100;
	b /= 100;

	const c = b * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = b - c;

	let r = 0,
		g = 0,
		bl = 0;

	if (h < 60) [r, g, bl] = [c, x, 0];
	else if (h < 120) [r, g, bl] = [x, c, 0];
	else if (h < 180) [r, g, bl] = [0, c, x];
	else if (h < 240) [r, g, bl] = [0, x, c];
	else if (h < 300) [r, g, bl] = [x, 0, c];
	else [r, g, bl] = [c, 0, x];

	return [r + m, g + m, bl + m];
};

/**
 * RGB to HSB conversion.
 * r, g, b in range 0–1.
 * Returns h: 0–360, s: 0–100, b: 0–100.
 */
const rgbToHsb = (
	r: number,
	g: number,
	b: number,
): { h: number; s: number; b: number } => {
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const d = max - min;

	let h = 0;

	if (d !== 0) {
		switch (max) {
			case r:
				h = 60 * (((g - b) / d) % 6);
				break;
			case g:
				h = 60 * ((b - r) / d + 2);
				break;
			case b:
				h = 60 * ((r - g) / d + 4);
				break;
		}
	}

	if (h < 0) h += 360;

	const s = max === 0 ? 0 : d / max;

	return {
		h,
		s: s * 100,
		b: max * 100,
	};
};

export const HSBSupport: ColorModel<HSB> = {
	type: "HSB",

	parse(input) {
		const m = input.match(
			/^hsb[av]?\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?(?:\s*,\s*([\d.]+))?\)$/i,
		);

		if (!m) return null;

		return {
			type: "HSB",
			h: Number(m[1]),
			s: Number(m[2]),
			b: Number(m[3]),
			alpha: m[4] !== undefined ? Number(m[4]) : 1,
		};
	},

	toCanonical(color) {
		const [r, g, b] = hsbToRgb(color.h, color.s, color.b);

		const lr = linearize(r);
		const lg = linearize(g);
		const lb = linearize(b);

		const [x, y, z] = matMul(toXYZMatrix, [lr, lg, lb]);

		return { x: x!, y: y!, z: z!, alpha: color.alpha };
	},

	fromCanonical(color) {
		const [lr, lg, lb] = matMul(fromXYZMatrix, [color.x, color.y, color.z]);

		const clamp = (v: number) => Math.max(0, Math.min(1, v));

		const r = gammify(clamp(lr!));
		const g = gammify(clamp(lg!));
		const b = gammify(clamp(lb!));

		const { h, s, b: brightness } = rgbToHsb(r, g, b);

		return {
			type: "HSB",
			h,
			s,
			b: brightness,
			alpha: color.alpha,
		};
	},

	toString(color) {
		const h = Number(color.h.toFixed(4));
		const s = Number(color.s.toFixed(4));
		const b = Number(color.b.toFixed(4));

		if (color.alpha === 1) {
			return `hsb(${h} ${s}% ${b}%)`;
		}

		return `hsb(${h} ${s}% ${b}% / ${color.alpha})`;
	},
};

Tintly.register(HSBSupport);
