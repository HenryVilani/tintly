import type { BaseColor } from "../core/Color.js";
import type { ColorModel } from "../core/ColorModel.js";
import { Tintly } from "../core/Registry.js";

const c1 = 0.8359375;
const c2 = 18.8515625;
const c3 = 18.6875;
const m1 = 0.1593017578125;
const m2 = 78.84375;

const pq = (x: number): number => {
	const xm1 = Math.abs(x) ** m1;
	return (Math.sign(x) * ((c1 + c2 * xm1) / (1 + c3 * xm1))) ** m2;
};

const pqInv = (x: number): number => {
	const xm2 = Math.abs(x) ** (1 / m2);
	return Math.sign(x) * (Math.max(0, xm2 - c1) / (c2 - c3 * xm2)) ** (1 / m1);
};

const ABS = 203;

const mXYZtoLMS = [
	[0.3592, 0.6976, -0.0358],
	[-0.1922, 1.1004, 0.0755],
	[0.007, 0.0749, 0.8434],
];

const mLMStoICtCp = [
	[0.5, 0.5, 0.0],
	[1.6137, -3.3234, 1.7097],
	[4.378, -4.2455, -0.1325],
];

const mLMStoXYZ = [
	[2.0702, -1.3265, 0.2066],
	[0.365, 0.6806, -0.0456],
	[-0.0496, -0.0494, 1.1881],
];

const mICtCptoLMS = [
	[1.0, 0.008605145693122, 0.111028606951885],
	[1.0, -0.008605145693122, -0.111028606951885],
	[1.0, 0.560048859567802, -0.320632551391207],
];

const matMul = (m: number[][], v: number[]) =>
	m.map((row) => row.reduce((s, c, i) => s + c * (v[i] ?? 0), 0));

function xyzToICtCp(x: number, y: number, z: number): [number, number, number] {
	const [l, m, s] = matMul(mXYZtoLMS, [x * ABS, y * ABS, z * ABS]);
	const lp = pq(l! / 10000);
	const mp = pq(m! / 10000);
	const sp = pq(s! / 10000);
	const [I, Ct, Cp] = matMul(mLMStoICtCp, [lp, mp, sp]);
	return [I!, Ct!, Cp!];
}

function ictcpToXYZ(
	I: number,
	Ct: number,
	Cp: number,
): [number, number, number] {
	const [lp, mp, sp] = matMul(mICtCptoLMS, [I, Ct, Cp]);
	const l = pqInv(lp!) * 10000;
	const m = pqInv(mp!) * 10000;
	const s = pqInv(sp!) * 10000;
	const [x, y, z] = matMul(mLMStoXYZ, [l, m, s]);
	return [x! / ABS, y! / ABS, z! / ABS];
}

export interface ICtCp extends BaseColor {
	type: "ICTCP";
	i: number;
	ct: number;
	cp: number;
	alpha: number;
}

export const ICtCpSupport: ColorModel<ICtCp> = {
	type: "ICTCP",

	unsupportedOperations: ["lighten", "darken", "luminance", "contrastRatio", "readableOn"],

	parse(input) {
		const m = input.match(
			/^ictcp\(\s*([\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
		);
		if (!m) return null;
		return {
			type: "ICTCP",
			i: Number(m[1]),
			ct: Number(m[2]),
			cp: Number(m[3]),
			alpha: m[4] !== undefined ? Number(m[4]) : 1,
		};
	},

	toCanonical(color) {
		const [x, y, z] = ictcpToXYZ(color.i, color.ct, color.cp);
		return { x, y, z, alpha: color.alpha };
	},

	fromCanonical(color) {
		const [i, ct, cp] = xyzToICtCp(color.x, color.y, color.z);
		return { type: "ICTCP", i, ct, cp, alpha: color.alpha };
	},

	toString(color) {
		const i = Number(color.i.toFixed(6));
		const ct = Number(color.ct.toFixed(6));
		const cp = Number(color.cp.toFixed(6));
		if (color.alpha === 1) return `ictcp(${i} ${ct} ${cp})`;
		return `ictcp(${i} ${ct} ${cp} / ${color.alpha})`;
	},
};

Tintly.register(ICtCpSupport);
