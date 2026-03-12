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

export interface HEX extends BaseColor {
	type: "HEX";
	hex: string;
	alpha: number;
}

const hexToRgb = (hex: string) => {
	hex = hex.replace("#", "");

	if (hex.length === 3 || hex.length === 4) {
		hex = hex
			.split("")
			.map((c) => c + c)
			.join("");
	}

	const r = parseInt(hex.slice(0, 2), 16);
	const g = parseInt(hex.slice(2, 4), 16);
	const b = parseInt(hex.slice(4, 6), 16);

	let a = 1;

	if (hex.length === 8) {
		a = parseInt(hex.slice(6, 8), 16) / 255;
	}

	return { r, g, b, alpha: a };
};

const rgbToHex = (r: number, g: number, b: number) =>
	"#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

export const HEXSupport: ColorModel<HEX> = {
	type: "HEX",

	parse(input) {
		const m = input.match(/^#([0-9a-fA-F]{3,8})$/);

		if (!m) return null;

		return {
			type: "HEX",
			hex: input,
			alpha: hexToRgb(input).alpha,
		};
	},

	toCanonical(color) {
		const { r, g, b, alpha } = hexToRgb(color.hex);

		const lr = linearize(r / 255);
		const lg = linearize(g / 255);
		const lb = linearize(b / 255);

		const [x, y, z] = matMul(toXYZMatrix, [lr, lg, lb]);

		return { x: x!, y: y!, z: z!, alpha };
	},

	fromCanonical(color) {
		const [lr, lg, lb] = matMul(fromXYZMatrix, [color.x, color.y, color.z]);

		const clamp = (v: number) => Math.max(0, Math.min(1, v));

		const r = Math.round(gammify(clamp(lr!)) * 255);
		const g = Math.round(gammify(clamp(lg!)) * 255);
		const b = Math.round(gammify(clamp(lb!)) * 255);

		return {
			type: "HEX",
			hex: rgbToHex(r, g, b),
			alpha: color.alpha,
		};
	},

	toString(color) {
		if (color.alpha === 1) {
			return color.hex;
		}

		const alpha = Math.round(color.alpha * 255)
			.toString(16)
			.padStart(2, "0");

		return `${color.hex}${alpha}`;
	},
};

Tintly.register(HEXSupport);
