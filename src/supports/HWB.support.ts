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

export interface HWB extends BaseColor {
	type: "HWB";

	h: number;
	w: number;
	b: number;
	a: number;
}

const hueToRgb = (h: number) => {
	h = ((h % 360) + 360) % 360;
	const c = 1;
	const x = 1 - Math.abs(((h / 60) % 2) - 1);

	let r = 0,
		g = 0,
		b = 0;

	if (h < 60) [r, g, b] = [c, x, 0];
	else if (h < 120) [r, g, b] = [x, c, 0];
	else if (h < 180) [r, g, b] = [0, c, x];
	else if (h < 240) [r, g, b] = [0, x, c];
	else if (h < 300) [r, g, b] = [x, 0, c];
	else [r, g, b] = [c, 0, x];

	return [r, g, b];
};

const hwbToRgb = (h: number, w: number, bl: number) => {
	w /= 100;
	bl /= 100;

	const [r, g, b] = hueToRgb(h);

	const sum = w + bl;

	if (sum > 1) {
		w /= sum;
		bl /= sum;
	}

	return [
		r! * (1 - w - bl) + w,
		g! * (1 - w - bl) + w,
		b! * (1 - w - bl) + w,
	];
};

const rgbToHwb = (r: number, g: number, b: number) => {
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);

	const w = min;
	const bl = 1 - max;

	let h = 0;

	if (max !== min) {
		const d = max - min;

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
		w: w * 100,
		b: bl * 100,
	};
};

export const HWBSupport: ColorModel<HWB> = {
	type: "HWB",

	parse(input) {
		const m = input.match(
			/^hwb\(\s*([\d.]+)\s*,\s*([\d.]+)%?,\s*([\d.]+)%?(?:,\s*([\d.]+))?\)$/i,
		);

		if (!m) return null;

		return {
			type: "HWB",
			h: Number(m[1]),
			w: Number(m[2]),
			b: Number(m[3]),
			a: m[4] !== undefined ? Number(m[4]) : 1,
		};
	},

	toCanonical(color) {
		const [r, g, b] = hwbToRgb(color.h, color.w, color.b);

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

		const { h, w, b: bl } = rgbToHwb(r, g, b);

		return {
			type: "HWB",
			h,
			w,
			b: bl,
			a: color.a,
		};
	},

	toString(color) {
		const h = Number(color.h.toFixed(4));
		const w = Number(color.w.toFixed(4));
		const b = Number(color.b.toFixed(4));

		if (color.a === 1) {
			return `hwb(${h} ${w}% ${b}%)`;
		}

		return `hwb(${h} ${w}% ${b}% / ${color.a})`;
	},
};

Color.register(HWBSupport);
