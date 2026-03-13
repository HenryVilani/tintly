import type { BaseColor } from "../core/Color.js";
import type { ColorModel } from "../core/ColorModel.js";
import { Tintly } from "../core/Registry.js";

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
	const U = 13 * L * (u - refU);
	const V = 13 * L * (v - refV);
	return [L, U, V];
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

function maxSafeChromaForLH(L: number, H: number): number {
	const hrad = (H / 180) * Math.PI;
	const sinH = Math.sin(hrad);
	const cosH = Math.cos(hrad);

	const m = fromXYZMatrix;
	let minLen = Infinity;

	for (let i = 0; i < 3; i++) {
		const row = m[i]!;
		const sub1 = (L + 16) ** 3 / 1560896;
		const sub2 = sub1 > epsilon ? sub1 : L / kappa;

		for (const t of [0, 1] as const) {
			const top1 = (284517 * row[0]! - 94839 * row[2]!) * sub2;
			const top2 =
				(838422 * row[2]! + 769860 * row[1]! + 731718 * row[0]!) *
					L *
					sub2 -
				769860 * t * L;
			const bottom =
				(632260 * row[2]! - 126452 * row[1]!) * sub2 + 126452 * t;

			if (bottom === 0) continue;

			const length = top2 / (sinH * top1 - cosH * bottom);
			if (length > 0) minLen = Math.min(minLen, length);
		}
	}

	return minLen === Infinity ? 0 : minLen;
}

function luvToHSLuv(L: number, U: number, V: number): [number, number, number] {
	const C = Math.sqrt(U * U + V * V);
	let H = (Math.atan2(V, U) * 180) / Math.PI;
	if (H < 0) H += 360;

	if (L > 99.9999999) return [H, 0, 100];
	if (L < 0.00000001) return [H, 0, 0];

	const maxC = maxSafeChromaForLH(L, H);
	const S = (C / maxC) * 100;

	return [H, S, L];
}

function hsLuvToLuv(H: number, S: number, L: number): [number, number, number] {
	if (L > 99.9999999) return [L, 0, 0];
	if (L < 0.00000001) return [L, 0, 0];

	const maxC = maxSafeChromaForLH(L, H);
	const C = maxC * (S / 100);
	const hrad = (H / 180) * Math.PI;

	return [L, C * Math.cos(hrad), C * Math.sin(hrad)];
}

export interface HSLuv extends BaseColor {
	type: "HSLUV";
	h: number;
	s: number;
	l: number;
	alpha: number;
}

export const HSLuvSupport: ColorModel<HSLuv> = {
	type: "HSLUV",

	parse(input) {
		const m = input.match(
			/^hsluv\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?(?:\s*,\s*([\d.]+))?\s*\)$/i,
		);
		if (!m) return null;
		return {
			type: "HSLUV",
			h: Number(m[1]),
			s: Number(m[2]),
			l: Number(m[3]),
			alpha: m[4] !== undefined ? Number(m[4]) : 1,
		};
	},

	toCanonical(color) {
		const [L, U, V] = hsLuvToLuv(color.h, color.s, color.l);
		const [x, y, z] = luvToXYZ(L, U, V);
		return { x, y, z, alpha: color.alpha };
	},

	fromCanonical(color) {
		const [L, U, V] = xyzToLuv(color.x, color.y, color.z);
		const [h, s, l] = luvToHSLuv(L, U, V);
		return { type: "HSLUV", h, s, l, alpha: color.alpha };
	},

	toString(color) {
		const h = Number(color.h.toFixed(4));
		const s = Number(color.s.toFixed(4));
		const l = Number(color.l.toFixed(4));
		if (color.alpha === 1) return `hsluv(${h} ${s}% ${l}%)`;
		return `hsluv(${h} ${s}% ${l}% / ${color.alpha})`;
	},
};

Tintly.register(HSLuvSupport);
