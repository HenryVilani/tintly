import type { BaseColor } from "../core/Color.js";
import type { ColorModel } from "../core/ColorModel.js";
import { Tintly } from "../core/Registry.js";

const b  = 1.15;
const g  = 0.66;
const n  = 0.15930175664;
const c1 = 0.8359375;
const c2 = 18.8515625;
const c3 = 18.6875;
const eta = 2610 / 2 ** 14;
const rho = 1.7 * 2523 / 2 ** 5;
const d  = -0.56;
const d0 = 1.6295499532821566e-11;

const mToLMS = [
	[ 0.41478972, 0.579999,  0.0146480],
	[-0.2015100,  1.120649,  0.0531008],
	[-0.0166008,  0.264800,  0.6684799],
];

const mToIzazbz = [
	[0.500000, 0.500000,  0.000000],
	[3.524000, -4.066708, 0.542708],
	[0.199076,  1.096799, -1.295875],
];

const mFromLMS = [
	[ 1.9242264357876067, -1.0047923125953657,  0.037651404030618   ],
	[ 0.35031676209499907, 0.7264811939316552, -0.06538442294808501 ],
	[-0.09098281098284752, -0.3127282905230739,  1.5227665613052603  ],
];

const mFromIzazbz = [
	[1.0,  0.1386050432715393,   0.05804731615611886],
	[1.0, -0.1386050432715393,  -0.05804731615611886],
	[1.0, -0.09601924202631895, -0.8118918960560388 ],
];

const matMul = (m: number[][], v: number[]) =>
	m.map((row) => row.reduce((s, c, i) => s + c * (v[i] ?? 0), 0));

const ABS_SCALE = 203;

function pq(x: number): number {
	const xp = (x / 10000) ** eta;
	return ((c1 + c2 * xp) / (1 + c3 * xp)) ** rho;
}

function pqInv(x: number): number {
	const xp = x ** (1 / rho);
	return 10000 * ((c1 - xp) / (c3 * xp - c2)) ** (1 / eta);
}

function xyzToJzazbz(x: number, y: number, z: number): [number, number, number] {

	const xa = x * ABS_SCALE;
	const ya = y * ABS_SCALE;
	const za = z * ABS_SCALE;

	const xp = b * xa - (b - 1) * za;
	const yp = g * ya - (g - 1) * xa;

	const [l, m, s] = matMul(mToLMS, [xp, yp, za]);
	const lp = pq(l!);
	const mp = pq(m!);
	const sp = pq(s!);

	const [Iz, az, bz] = matMul(mToIzazbz, [lp, mp, sp]);
	const Jz = (1 + d) * Iz! / (1 + d * Iz!) - d0;

	return [Jz, az!, bz!];
}

function jzazbzToXYZ(Jz: number, az: number, bz: number): [number, number, number] {
	const Iz = (Jz + d0) / (1 + d - d * (Jz + d0));

	const [lp, mp, sp] = matMul(mFromIzazbz, [Iz, az, bz]);
	const l = pqInv(lp!);
	const m = pqInv(mp!);
	const s = pqInv(sp!);

	const [xp, yp, za] = matMul(mFromLMS, [l, m, s]);
	const xa = (xp! + (b - 1) * za!) / b;
	const ya = (yp! + (g - 1) * xa) / g;

	return [xa / ABS_SCALE, ya / ABS_SCALE, za! / ABS_SCALE];
}

export interface JzCzhz extends BaseColor {
	type: "JZCZHZ";
	jz: number;
	cz: number;
	hz: number;
	alpha: number;
}

export const JzCzhzSupport: ColorModel<JzCzhz> = {
	type: "JZCZHZ",

	unsupportedOperations: ["lighten", "darken", "luminance", "contrastRatio", "readableOn"],

	parse(input) {
		const m = input.match(
			/^jzczhz\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
		);
		if (!m) return null;
		return {
			type: "JZCZHZ",
			jz: Number(m[1]),
			cz: Number(m[2]),
			hz: Number(m[3]),
			alpha: m[4] !== undefined ? Number(m[4]) : 1,
		};
	},

	toCanonical(color) {
		const hr = (color.hz * Math.PI) / 180;
		const az = color.cz * Math.cos(hr);
		const bz = color.cz * Math.sin(hr);
		const [x, y, z] = jzazbzToXYZ(color.jz, az, bz);
		return { x, y, z, alpha: color.alpha };
	},

	fromCanonical(color) {
		const [jz, az, bz] = xyzToJzazbz(color.x, color.y, color.z);
		const cz = Math.sqrt(az * az + bz * bz);
		let hz    = (Math.atan2(bz, az) * 180) / Math.PI;
		if (hz < 0) hz += 360;
		return { type: "JZCZHZ", jz, cz, hz, alpha: color.alpha };
	},

	toString(color) {
		const jz = Number(color.jz.toFixed(6));
		const cz = Number(color.cz.toFixed(6));
		const hz = Number(color.hz.toFixed(4));
		if (color.alpha === 1) return `jzczhz(${jz} ${cz} ${hz})`;
		return `jzczhz(${jz} ${cz} ${hz} / ${color.alpha})`;
	},
};

Tintly.register(JzCzhzSupport)