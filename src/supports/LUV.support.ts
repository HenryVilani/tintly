import type { BaseColor } from "../core/Color.js";
import type { ColorModel } from "../core/ColorModel.js";
import { Tintly } from "../core/Registry.js";

// D65 reference white
const Xn = 0.95047,
	Yn = 1.0,
	Zn = 1.08883;
const refU = (4 * Xn) / (Xn + 15 * Yn + 3 * Zn);
const refV = (9 * Yn) / (Xn + 15 * Yn + 3 * Zn);
const kappa = 903.3;
const epsilon = 0.008856;

function xyzToLuv(x: number, y: number, z: number): [number, number, number] {
	const denom = x + 15 * y + 3 * z;
	if (denom === 0) return [0, 0, 0];
	const u = (4 * x) / denom;
	const v = (9 * y) / denom;
	const yr = y / Yn;
	const L = yr <= epsilon ? kappa * yr : 116 * yr ** (1 / 3) - 16;
	return [L, 13 * L * (u - refU), 13 * L * (v - refV)];
}

function luvToXYZ(L: number, U: number, V: number): [number, number, number] {
	if (L === 0) return [0, 0, 0];
	const u0 = U / (13 * L) + refU;
	const v0 = V / (13 * L) + refV;
	const Y = L <= 8 ? (Yn * L) / kappa : Yn * ((L + 16) / 116) ** 3;
	const X = (Y * 9 * u0) / (4 * v0);
	const Z = (Y * (12 - 3 * u0 - 20 * v0)) / (4 * v0);
	return [X, Y, Z];
}

// ─── CIELUV ───────────────────────────────────────────────────────────────────

export interface LUV extends BaseColor {
	type: "LUV";
	l: number;
	u: number;
	v: number;
	alpha: number;
}

export const LUVSupport: ColorModel<LUV> = {
	type: "LUV",

	parse(input) {
		const m = input.match(
			/^luv\(\s*([\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
		);
		if (!m) return null;
		return {
			type: "LUV",
			l: Number(m[1]),
			u: Number(m[2]),
			v: Number(m[3]),
			alpha: m[4] !== undefined ? Number(m[4]) : 1,
		};
	},

	toCanonical(color) {
		const [x, y, z] = luvToXYZ(color.l, color.u, color.v);
		return { x, y, z, alpha: color.alpha };
	},

	fromCanonical(color) {
		const [l, u, v] = xyzToLuv(color.x, color.y, color.z);
		return { type: "LUV", l, u, v, alpha: color.alpha };
	},

	toString(color) {
		const l = Number(color.l.toFixed(4));
		const u = Number(color.u.toFixed(4));
		const v = Number(color.v.toFixed(4));
		if (color.alpha === 1) return `luv(${l} ${u} ${v})`;
		return `luv(${l} ${u} ${v} / ${color.alpha})`;
	},
};

// ─── LCHuv ────────────────────────────────────────────────────────────────────

export interface LCHuv extends BaseColor {
	type: "LCHUV";
	l: number;
	c: number;
	h: number;
	alpha: number;
}

export const LCHuvSupport: ColorModel<LCHuv> = {
	type: "LCHUV",

	parse(input) {
		const m = input.match(
			/^lchuv\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
		);
		if (!m) return null;
		return {
			type: "LCHUV",
			l: Number(m[1]),
			c: Number(m[2]),
			h: Number(m[3]),
			alpha: m[4] !== undefined ? Number(m[4]) : 1,
		};
	},

	toCanonical(color) {
		const hr = (color.h * Math.PI) / 180;
		const U = color.c * Math.cos(hr);
		const V = color.c * Math.sin(hr);
		const [x, y, z] = luvToXYZ(color.l, U, V);
		return { x, y, z, alpha: color.alpha };
	},

	fromCanonical(color) {
		const [L, U, V] = xyzToLuv(color.x, color.y, color.z);
		const C = Math.sqrt(U * U + V * V);
		let H = (Math.atan2(V, U) * 180) / Math.PI;
		if (H < 0) H += 360;
		return { type: "LCHUV", l: L, c: C, h: H, alpha: color.alpha };
	},

	toString(color) {
		const l = Number(color.l.toFixed(4));
		const c = Number(color.c.toFixed(4));
		const h = Number(color.h.toFixed(4));
		if (color.alpha === 1) return `lchuv(${l} ${c} ${h})`;
		return `lchuv(${l} ${c} ${h} / ${color.alpha})`;
	},
};

Tintly.register(LUVSupport);
Tintly.register(LCHuvSupport);
