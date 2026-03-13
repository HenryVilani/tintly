import type { BaseColor } from "../core/Color.js";
import type { ColorModel } from "../core/ColorModel.js";
import { Tintly } from "../core/Registry.js";

export interface XYY extends BaseColor {
	type: "XYY";
	x: number;
	y: number;
	Y: number;
	alpha: number;
}

export const XYYSupport: ColorModel<XYY> = {
	type: "XYY",

	unsupportedOperations: ["lighten", "darken", "harmony", "complement"],

	parse(input) {
		const m = input.match(
			/^xyy\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
		);
		if (!m) return null;
		return {
			type: "XYY",
			x: Number(m[1]),
			y: Number(m[2]),
			Y: Number(m[3]),
			alpha: m[4] !== undefined ? Number(m[4]) : 1,
		};
	},

	toCanonical(color) {

		if (color.y === 0) return { x: 0, y: 0, z: 0, alpha: color.alpha };
		const X = (color.x * color.Y) / color.y;
		const Z = ((1 - color.x - color.y) * color.Y) / color.y;
		return { x: X, y: color.Y, z: Z, alpha: color.alpha };
	},

	fromCanonical(color) {
		const sum = color.x + color.y + color.z;
		if (sum === 0)
			return { type: "XYY", x: 0, y: 0, Y: 0, alpha: color.alpha };
		return {
			type: "XYY",
			x: color.x / sum,
			y: color.y / sum,
			Y: color.y,
			alpha: color.alpha,
		};
	},

	toString(color) {
		const x = Number(color.x.toFixed(6));
		const y = Number(color.y.toFixed(6));
		const Y = Number(color.Y.toFixed(6));
		if (color.alpha === 1) return `xyy(${x} ${y} ${Y})`;
		return `xyy(${x} ${y} ${Y} / ${color.alpha})`;
	},
};


Tintly.register(XYYSupport);
