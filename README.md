# tintly

A comprehensive, framework-agnostic color model library for JavaScript and TypeScript. Convert between 12 color spaces using CIE XYZ as a canonical intermediate format.

## Features

- 🎨 **12 color spaces** — RGB, RGBA, HEX, HSL, HWB, LAB, LCH, OKLAB, OKLCH, CMYK, CMY, YIQ
- 🔄 **Convert between any two formats** via a single unified API
- 📦 **Dual format** — ships as both ESM and CommonJS
- 🔒 **Fully typed** — first-class TypeScript support
- 🧩 **Extensible** — register your own custom color models

---

## Installation

```bash
npm install tintly
```

---

## Quick Start

```ts
import { Color } from "tintly";

// Parse any supported color string
const color = Color.parse("rgb(255, 100, 50)");

// Convert to another color space
const hsl = Color.convert(color!, "HSL");

// Serialize back to a CSS string
console.log(Color.toString(hsl!));
// → "hsl(16.0816 100% 59.8039%)"
```

---

## Parsing

`Color.parse()` automatically detects the format:

```ts
Color.parse("rgb(255, 0, 128)");
Color.parse("#ff0080");
Color.parse("#f08");
Color.parse("hsl(200, 80%, 50%)");
Color.parse("hsla(200, 80%, 50%, 0.5)");
Color.parse("hwb(200, 10%, 20%)");
Color.parse("lab(50, 20, -30)");
Color.parse("lch(50, 35, 300)");
Color.parse("oklab(0.6, 0.1, -0.1)");
Color.parse("oklch(0.6, 0.15, 260)");
Color.parse("cmyk(0%, 50%, 100%, 0%)");
Color.parse("cmy(0%, 50%, 80%)");
Color.parse("yiq(0.5, 0.2, -0.1)");
```

Returns the parsed color object or `null` if the string is unrecognized.

---

## Converting

`Color.convert(color, targetType)` converts any parsed color to any registered color space:

```ts
const hex = Color.parse("#3498db")!;

// To RGB
const rgb = Color.convert(hex, "RGBA");
console.log(Color.toString(rgb!));
// → "rgb(52 152 219)"

// To HSL
const hsl = Color.convert(hex, "HSL");
console.log(Color.toString(hsl!));
// → "hsl(204.0123 69.7368% 53.1373%)"

// To OKLCH (great for design systems)
const oklch = Color.convert(hex, "OKLCH");
console.log(Color.toString(oklch!));
// → "oklch(0.611066 0.131255 237.0451)"

// To CMYK (useful for print)
const cmyk = Color.convert(hex, "CMYK");
console.log(Color.toString(cmyk!));
// → "cmyk(76.2557% 30.5936% 0% 14.1176%)"
```

---

## Serializing

`Color.toString()` returns a CSS-compatible string for the color:

```ts
const color = Color.parse("hsl(120, 100%, 50%)")!;

console.log(Color.toString(color));
// → "hsl(120 100% 50%)"

// Colors with alpha
const semi = Color.parse("hsla(120, 100%, 50%, 0.5)")!;
console.log(Color.toString(semi));
// → "hsl(120 100% 50% / 0.5)"
```

---

## Alpha Support

All color models support an alpha channel:

```ts
const color = Color.parse("rgba(255, 0, 0, 0.5)")!;
const oklab = Color.convert(color, "OKLAB")!;

console.log(Color.toString(oklab));
// → "oklab(0.627955 0.224863 0.125846 / 0.5)"
```

---

## Checking Available Types

```ts
console.log(Color.types());
// → ["RGBA", "HEX", "LAB", "HSL", "LCH", "OKLAB", "OKLCH", "HWB", "CMYK", "CMY", "YIQ"]

console.log(Color.has("OKLCH")); // → true
console.log(Color.has("XYZ"));   // → false
```

---

## Extending with Custom Models

You can register your own color model by implementing the `ColorModel<T>` interface:

```ts
import { Color } from "tintly";
import type { BaseColor } from "tintly";
import type { ColorModel } from "tintly";

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

Color.register(GrayscaleModel);

// Now it works like any built-in model
const g = Color.parse("gray(128)");
const hex = Color.convert(g!, "HEX");
console.log(Color.toString(hex!)); // → "#808080"
```

---

## API Reference

### `Color.parse(input: string): BaseColor | null`
Attempts to parse a color string with all registered models. Returns the first match or `null`.

### `Color.convert<To>(color: BaseColor, targetType: string): To | null`
Converts a color to the specified type via the CIE XYZ intermediate. Returns `null` if either model is not registered.

### `Color.toString(color: BaseColor): string`
Serializes a color to its canonical CSS string representation. Throws `ColorNotSupported` if the model is not registered.

### `Color.register(model: ColorModel<T>): this`
Registers a new color model. Chainable.

### `Color.has(type: string): boolean`
Returns `true` if a model with the given type is registered.

### `Color.types(): string[]`
Returns an array of all registered type identifiers.

---

## Supported Color Spaces

| Type    | Example string                          |
|---------|-----------------------------------------|
| `RGBA`  | `rgb(255, 128, 0)`                      |
| `HEX`   | `#ff8000`, `#f80`, `#ff8000ff`          |
| `HSL`   | `hsl(30, 100%, 50%)`, `hsla(...)`       |
| `HWB`   | `hwb(30, 0%, 0%)`                       |
| `LAB`   | `lab(70, 20, -10)`                      |
| `LCH`   | `lch(70, 22, 333)`                      |
| `OKLAB` | `oklab(0.7, 0.1, -0.05)`               |
| `OKLCH` | `oklch(0.7, 0.12, 330)`                |
| `CMYK`  | `cmyk(0%, 50%, 100%, 0%)`              |
| `CMY`   | `cmy(0%, 50%, 80%)`                     |
| `YIQ`   | `yiq(0.5, 0.2, -0.1)`                  |

---

## License

MIT © Henry Vilani