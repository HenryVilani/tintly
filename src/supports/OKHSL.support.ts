import type { BaseColor } from "../core/Color.js";
import type { ColorModel } from "../core/ColorModel.js";
import { Tintly } from "../core/Registry.js";

const cbrt = Math.cbrt;
const pow3 = (x: number) => x * x * x;

function xyzToOklab(x: number, y: number, z: number): [number, number, number] {
	const l = 0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z;
	const m = 0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z;
	const s = 0.0482003018 * x + 0.2643662691 * y + 0.633851707 * z;
	const l_ = cbrt(l),
		m_ = cbrt(m),
		s_ = cbrt(s);
	return [
		0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
		1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
		0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
	];
}

function oklabToXYZ(L: number, a: number, b: number): [number, number, number] {
	const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = L - 0.0894841775 * a - 1.291485548 * b;
	const l3 = pow3(l_),
		m3 = pow3(m_),
		s3 = pow3(s_);
	return [
		1.2270138511 * l3 - 0.5577999807 * m3 + 0.281256149 * s3,
		-0.0405801784 * l3 + 1.1122568696 * m3 - 0.0716766787 * s3,
		-0.0763812845 * l3 - 0.4214819784 * m3 + 1.5861632204 * s3,
	];
}

const gammify = (v: number) =>
	v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;

const fromXYZMatrix = [
	[3.2404542, -1.5371385, -0.4985314],
	[-0.969266, 1.8760108, 0.041556],
	[0.0556434, -0.2040259, 1.0572252],
];
const matMul = (m: number[][], v: number[]) =>
	m.map((row) => row.reduce((s, c, i) => s + c * (v[i] ?? 0), 0));

function oklabToRGB(L: number, a: number, b: number): [number, number, number] {
	const [x, y, z] = oklabToXYZ(L, a, b);
	const clamp = (v: number) => Math.max(0, Math.min(1, v));
	const [lr, lg, lb] = matMul(fromXYZMatrix, [x, y, z]);
	return [gammify(clamp(lr!)), gammify(clamp(lg!)), gammify(clamp(lb!))];
}

function computeMaxSaturation(a: number, b: number): number {
	let k0: number, k1: number, k2: number, k3: number, k4: number;
	let wl: number, wm: number, ws: number;

	if (-1.88170328 * a - 0.80936493 * b > 1) {
		k0 = +0.1247473;
		k1 = +0.6595014;
		k2 = +0.7443786;
		k3 = +0.6236119;
		k4 = -0.0002108;
		wl = +4.0767416;
		wm = -3.3077115;
		ws = +0.2309699;
	} else if (1.81444104 * a - 1.19445276 * b > 1) {
		k0 = +0.2739568;
		k1 = +0.3018559;
		k2 = +0.4166903;
		k3 = +0.139784;
		k4 = -0.0004272;
		wl = -1.268438;
		wm = +2.6097574;
		ws = -0.3413193;
	} else {
		k0 = +0.2208774;
		k1 = -0.2552899;
		k2 = -0.26678;
		k3 = +0.53211;
		k4 = +0.0002028;
		wl = -0.004196;
		wm = -0.7034186;
		ws = +1.7076147;
	}

	let S = k0 + k1 * a + k2 * b + k3 * a * a + k4 * a * b;

	const kl = 0.3963377774 * a + 0.2158037573 * b;
	const km = -0.1055613458 * a - 0.0638541728 * b;
	const ks = -0.0894841775 * a - 1.291485548 * b;

	for (let i = 0; i < 2; i++) {
		const l_ = 1 + S * kl,
			m_ = 1 + S * km,
			s_ = 1 + S * ks;
		const l = pow3(l_),
			m = pow3(m_),
			s = pow3(s_);
		const ldS = 3 * kl * l_ * l_,
			mdS = 3 * km * m_ * m_,
			sdS = 3 * ks * s_ * s_;
		const ldS2 = 6 * kl * kl * l_,
			mdS2 = 6 * km * km * m_,
			sdS2 = 6 * ks * ks * s_;
		const f = wl * l + wm * m + ws * s;
		const f1 = wl * ldS + wm * mdS + ws * sdS;
		const f2 = wl * ldS2 + wm * mdS2 + ws * sdS2;
		S -= (f * f1) / (f1 * f1 - 0.5 * f * f2);
	}

	return S;
}

function findCuspLS(a: number, b: number): [number, number] {
	const S_cusp = computeMaxSaturation(a, b);
	const [R, G, B] = oklabToRGB(1, S_cusp * a, S_cusp * b);
	const L_cusp = cbrt(1 / Math.max(R, G, B, 0));
	const C_cusp = L_cusp * S_cusp;
	return [L_cusp, C_cusp];
}

function getStMax(
	a: number,
	b: number,
	cusp?: [number, number],
): [number, number] {
	const [Lc, Cc] = cusp ?? findCuspLS(a, b);
	return [Cc / Lc, Cc / (1 - Lc)];
}

function getStMid(a: number, b: number): [number, number] {
	const S =
		0.11516993 +
		1 /
			(7.4477897 +
				4.1590124 * b +
				a *
					(-2.19557347 +
						1.75520762 * b +
						a *
							(-2.13704948 -
								10.02301043 * b +
								a *
									(-4.24894561 +
										5.38770819 * b +
										4.69891013 * a))));
	const T =
		0.11239642 +
		1 /
			(1.6132032 -
				0.68124379 * b +
				a *
					(+0.40370612 +
						0.90148123 * b +
						a *
							(-0.27087943 +
								0.6122399 * b +
								a *
									(+0.00299215 -
										0.45399568 * b -
										0.14661872 * a))));
	return [S, T];
}

export interface Okhsl extends BaseColor {
	type: "OKHSL";
	h: number;
	s: number;
	l: number;
	alpha: number;
}

export const OkhslSupport: ColorModel<Okhsl> = {
	type: "OKHSL",

	parse(input) {
		const m = input.match(
			/^okhsl\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?(?:\s*,\s*([\d.]+))?\s*\)$/i,
		);
		if (!m) return null;
		return {
			type: "OKHSL",
			h: Number(m[1]),
			s: Number(m[2]),
			l: Number(m[3]),
			alpha: m[4] !== undefined ? Number(m[4]) : 1,
		};
	},

	toCanonical(color) {

		const h = (color.h / 360) * 2 * Math.PI;
		const s = color.s / 100;
		const l = color.l / 100;

		const a_ = Math.cos(h);
		const b_ = Math.sin(h);

		const L = 0.5 * (1 + Math.sin(Math.asin(2 * l - 1)));
		const [Smax, Tmax] = getStMax(a_, b_);
		const [Smid, Tmid] = getStMid(a_, b_);

		const mid = 0.8;
		const midInv = 1.25;

		let C: number;
		if (s <= mid) {
			const t = s * midInv;
			const kS = 1 - Smid / Smax;
			C = (mid * t) / (1 - kS * (1 - t));
		} else {
			const t = (s - mid) * midInv;
			const kT = (Tmax - Tmid) / Tmax;
			C = mid + ((1 - mid) * t) / (1 - kT * (1 - t));
		}

		const Ls = 1 - L;
		const Cs = C * Math.min(L * Smax, Ls * Tmax);

		const [x, y, z] = oklabToXYZ(L, Cs * a_, Cs * b_);
		return { x, y, z, alpha: color.alpha };
	},

	fromCanonical(color) {
		const [x, y, z] = [color.x, color.y, color.z];
		const [L, a, b] = xyzToOklab(x, y, z);

		const C = Math.sqrt(a * a + b * b);
		const a_ = C > 1e-8 ? a / C : 1;
		const b_ = C > 1e-8 ? b / C : 0;

		let h = (Math.atan2(-b_, -a_) / (2 * Math.PI) + 0.5) * 360;
		if (h < 0) h += 360;

		const [Smax, Tmax] = getStMax(a_, b_);
		const [Smid, Tmid] = getStMid(a_, b_);
		const Ls = 1 - L;
		const Cs = C / Math.min(L * Smax, Ls * Tmax);

		const mid = 0.8;
		const midInv = 1.25;
		let s: number;

		if (Cs <= mid) {
			const t = Cs * midInv;
			const kS = 1 - Smid / Smax;
			s = (mid * t) / (1 - kS * (1 - t));
		} else {
			const t = (Cs - mid) * midInv;
			const kT = (Tmax - Tmid) / Tmax;
			s = mid + ((1 - mid) * t) / (1 - kT * (1 - t));
		}

		const l = 0.5 * (1 - Math.cos(Math.asin(2 * L - 1)));

		return {
			type: "OKHSL",
			h,
			s: Math.max(0, Math.min(100, s * 100)),
			l: Math.max(0, Math.min(100, l * 100)),
			alpha: color.alpha,
		};
	},

	toString(color) {
		const h = Number(color.h.toFixed(4));
		const s = Number(color.s.toFixed(4));
		const l = Number(color.l.toFixed(4));
		if (color.alpha === 1) return `okhsl(${h} ${s}% ${l}%)`;
		return `okhsl(${h} ${s}% ${l}% / ${color.alpha})`;
	},
};


Tintly.register(OkhslSupport);
