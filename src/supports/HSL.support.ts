import type { BaseColor } from "../core/Color.js";
import type { ColorModel } from "../core/ColorModel.js";
import { Tintly } from "../core/Registry.js";

const linearize = (v: number) =>
	v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;

const gammify = (v: number) =>
	v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;

// Matrizes sRGB D65
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

export interface HSL extends BaseColor {
	type: "HSL";

	h: number;
	s: number;
	l: number;
	alpha: number;
}

const hslToRgb = (h: number, s: number, l: number) => {
	h = h % 360;
	s /= 100;
	l /= 100;

	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;

	let r = 0,
		g = 0,
		b = 0;

	if (h < 60) [r, g, b] = [c, x, 0];
	else if (h < 120) [r, g, b] = [x, c, 0];
	else if (h < 180) [r, g, b] = [0, c, x];
	else if (h < 240) [r, g, b] = [0, x, c];
	else if (h < 300) [r, g, b] = [x, 0, c];
	else [r, g, b] = [c, 0, x];

	return [r + m, g + m, b + m];
};

const rgbToHsl = (r: number, g: number, b: number) => {
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);

	let h = 0;
	let s = 0;
	const l = (max + min) / 2;

	const d = max - min;

	if (d !== 0) {
		s = d / (1 - Math.abs(2 * l - 1));

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

	return {
		h,
		s: s * 100,
		l: l * 100,
	};
};

export const HSLSupport: ColorModel<HSL> = {
	type: "HSL",

	parse(input) {
		const m = input.match(
			/^hsla?\(\s*([\d.]+),\s*([\d.]+)%?,\s*([\d.]+)%?(?:,\s*([\d.]+))?\)$/i,
		);

		if (!m) return null;

		return {
			type: "HSL",
			h: Number(m[1]),
			s: Number(m[2]),
			l: Number(m[3]),
			alpha: m[4] !== undefined ? Number(m[4]) : 1,
		};
	},

	toCanonical(color) {
		const [r, g, b] = hslToRgb(color.h, color.s, color.l);

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

		const { h, s, l } = rgbToHsl(r, g, b);

		return {
			type: "HSL",
			h,
			s,
			l,
			alpha: color.alpha,
		};
	},

	toString(color) {
		const h = Number(color.h.toFixed(4));
		const s = Number(color.s.toFixed(4));
		const l = Number(color.l.toFixed(4));

		if (color.alpha === 1) {
			return `hsl(${h} ${s}% ${l}%)`;
		}

		return `hsl(${h} ${s}% ${l}% / ${color.alpha})`;
	},
};

Tintly.register(HSLSupport);
