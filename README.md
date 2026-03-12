[![npm version](https://img.shields.io/npm/v/@henryvilani/tintly.svg?style=flat-square)](https://www.npmjs.com/package/@henryvilani/tintly)
![NPM License](https://img.shields.io/npm/l/%40henryvilani%2Ftintly)


# tintly


A comprehensive, framework-agnostic color model library for JavaScript and TypeScript. Convert between 12 color spaces using CIE XYZ as a canonical intermediate format.

## Features

- 🎨 **13 color spaces** — RGB, RGBA, HEX, HSL, HSB, HWB, LAB, LCH, OKLAB, OKLCH, CMYK, CMY, YIQ
- 🔄 **Convert between any two formats** via a single unified API
- ⚡ **Zero dependencies** — lightweight and fast
- 📦 **Dual format** — ships as both ESM and CommonJS
- 🔒 **Fully typed** — first-class TypeScript support
- 🧩 **Extensible** — register your own custom color models

---

## Installation

```bash
npm install @henryvilani/tintly
```

---

## Quick Start

```ts
import { Tintly } from "@henryvilani/tintly";

// Parse any supported color string
const color = Tintly.parse("rgb(255, 100, 50)");

// Convert to another color space
const hsl = Tintly.convert(color!, "HSL");

// Serialize back to a CSS string
console.log(Tintly.toString(hsl!));
// → "hsl(16.0816 100% 59.8039%)"
```

---

## Parsing

`Tintly.parse()` automatically detects the format:

```ts
Tintly.parse("rgb(255, 0, 128)");
Tintly.parse("rgba(255, 0, 128, 1)");
Tintly.parse("#ff0080");
Tintly.parse("#f08");
Tintly.parse("hsb(79, 100%, 50%)");
Tintly.parse("hsl(200, 80%, 50%)");
Tintly.parse("hsla(200, 80%, 50%, 0.5)");
Tintly.parse("hwb(200, 10%, 20%)");
Tintly.parse("lab(50, 20, -30)");
Tintly.parse("lch(50, 35, 300)");
Tintly.parse("oklab(0.6, 0.1, -0.1)");
Tintly.parse("oklch(0.6, 0.15, 260)");
Tintly.parse("cmyk(0%, 50%, 100%, 0%)");
Tintly.parse("cmy(0%, 50%, 80%)");
Tintly.parse("yiq(0.5, 0.2, -0.1)");
```

Returns the parsed color object or `null` if the string is unrecognized.

---

## Converting

`Tintly.convert(color, targetType)` converts any parsed color to any registered color space:

```ts
const hex = Tintly.parse("#3498db")!;

// To RGB
const rgb = Tintly.convert(hex, "RGB");
console.log(Tintly.toString(rgb!));
// → "rgb(52 152 219)"

// To RGBA
const rgba = Tintly.convert(hex, "RGBA");
console.log(Tintly.toString(rgba!));
// → "rgba(52 152 219, 1)"

// To HSL
const hsl = Tintly.convert(hex, "HSL");
console.log(Tintly.toString(hsl!));
// → "hsl(204.0123 69.7368% 53.1373%)"

// To OKLCH (great for design systems)
const oklch = Tintly.convert(hex, "OKLCH");
console.log(Tintly.toString(oklch!));
// → "oklch(0.611066 0.131255 237.0451)"

// To CMYK (useful for print)
const cmyk = Tintly.convert(hex, "CMYK");
console.log(Tintly.toString(cmyk!));
// → "cmyk(76.2557% 30.5936% 0% 14.1176%)"
```

---

## Serializing

`Tintly.toString()` returns a CSS-compatible string for the color:

```ts
const color = Tintly.parse("hsl(120, 100%, 50%)")!;

console.log(Tintly.toString(color));
// → "hsl(120 100% 50%)"

// Colors with alpha
const semi = Tintly.parse("hsla(120, 100%, 50%, 0.5)")!;
console.log(Tintly.toString(semi));
// → "hsl(120 100% 50% / 0.5)"
```

---

## Alpha Support

All color models support an alpha channel:

```ts
const color = Tintly.parse("rgba(255, 0, 0, 0.5)")!;
const oklab = Tintly.convert(color, "OKLAB")!;

console.log(Tintly.toString(oklab));
// → "oklab(0.627955 0.224863 0.125846 / 0.5)"
```

---

## Checking Available Types

```ts
console.log(Tintly.types());
// → ["RGB", "RGBA", "HEX", "LAB", "HSL", "LCH", "OKLAB", "OKLCH", "HWB", "CMYK", "CMY", "YIQ"]

console.log(Tintly.has("OKLCH")); // → true
console.log(Tintly.has("XYZ"));   // → false
```

---

## Extending with Custom Models

You can register your own color model by implementing the `ColorModel<T>` interface:

```ts
import { Tintly } from "@henryvilani/tintly";
import type { BaseColor } from "@henryvilani/tintly";
import type { ColorModel } from "@henryvilani/tintly";

interface Grayscale extends BaseColor {
  type: "Grayscale";
  value: number; // 0–255
  a: number;
}

const GrayscaleModel: ColorModel<Grayscale> = {
  type: "Grayscale",

  parse(input) {
    const m = input.match(/^gray\((\d+)(?:,\s*([\d.]+))?\)$/i);
    if (!m) return null;
    return { type: "Grayscale", value: Number(m[1]), a: m[2] ? Number(m[2]) : 1 };
  },

  toCanonical(color) {
    const v = color.value / 255;
    // Gray: R = G = B = v
    return { x: 0.9505 * v, y: 1.0 * v, z: 1.0890 * v, a: color.a };
  },

  fromCanonical(color) {
    const value = Math.round(color.y * 255);
    return { type: "Grayscale", value: Math.max(0, Math.min(255, value)), a: color.a };
  },

  toString(color) {
    return `gray(${color.value})`;
  },
};

Tintly.register(GrayscaleModel);

// Now it works like any built-in model
const g = Tintly.parse("gray(128)");
const hex = Tintly.convert(g!, "HEX");
console.log(Tintly.toString(hex!)); // → "#808080"
```

---

## API Reference

### `Tintly.parse(input: string): BaseColor | null`
Attempts to parse a color string with all registered models. Returns the first match or `null`.

### `Tintly.convert<To>(color: BaseColor, targetType: string): To | null`
Converts a color to the specified type via the CIE XYZ intermediate. Returns `null` if either model is not registered.

### `Tintly.toString(color: BaseColor): string`
Serializes a color to its canonical CSS string representation. Throws `ColorNotSupported` if the model is not registered.

### `Tintly.register(model: ColorModel<T>): this`
Registers a new color model. Chainable.

### `Tintly.has(type: string): boolean`
Returns `true` if a model with the given type is registered.

### `Tintly.types(): string[]`
Returns an array of all registered type identifiers.

---

## Supported Tintly Spaces

| Type    | Example string                          
|---------|----------------------------------
| `RGBA`  | `rgba(255, 128, 0, 1)`			
| `RGB`  | `rgb(255, 128, 0)`			
| `HEX`   | `#ff8000`, `#f80`, `#ff8000ff`			
| `HSL`   | `hsl(30, 100%, 50%)`, `hsla(...)`			
| `HSB`   | `hsb(30, 100%, 50%)`		
| `HWB`   | `hwb(30, 0%, 0%)`			
| `LAB`   | `lab(70, 20, -10)`			
| `LCH`   | `lch(70, 22, 333)`			
| `OKLAB` | `oklab(0.7, 0.1, -0.05)`			
| `OKLCH` | `oklch(0.7, 0.12, 330)`			
| `CMYK`  | `cmyk(0%, 50%, 100%, 0%)`			
| `CMY`   | `cmy(0%, 50%, 80%)`			
| `YIQ`   | `yiq(0.5, 0.2, -0.1)`			

---

## License

MIT © Henry Vilani