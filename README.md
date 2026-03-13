[![npm version](https://img.shields.io/npm/v/@henryvilani/tintly.svg?style=flat-square)](https://www.npmjs.com/package/@henryvilani/tintly)
![NPM License](https://img.shields.io/npm/l/%40henryvilani%2Ftintly)


# tintly


A comprehensive, framework-agnostic color model library for JavaScript and TypeScript. Convert between 27 color spaces using CIE XYZ as a canonical intermediate format.

## Features

- 🎨 **27 color spaces** — from sRGB to HDR, broadcast, perceptual, and scientific spaces
- 🔄 **Convert between any two formats** via a single unified API
- 🛠️ **Built-in operations** — mix, scale, lighten, darken, grayscale, invert, harmony, complement, and more
- ♿ **Accessibility helpers** — WCAG 2.1 luminance, contrast ratio, and readable-on checks
- ⚡ **Zero dependencies** — lightweight and fast
- 📦 **Dual format** — ships as both ESM and CommonJS
- 🔒 **Fully typed** — first-class TypeScript support
- 🧩 **Extensible** — register your own custom color models with optional operation restrictions

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
// sRGB
Tintly.parse("rgb(255, 0, 128)");
Tintly.parse("rgba(255, 0, 128, 1)");
Tintly.parse("#ff0080");
Tintly.parse("#f08");
Tintly.parse("hsl(200, 80%, 50%)");
Tintly.parse("hsla(200, 80%, 50%, 0.5)");
Tintly.parse("hsb(79, 100%, 50%)");
Tintly.parse("hwb(200, 10%, 20%)");

// CIE / perceptual
Tintly.parse("lab(50, 20, -30)");
Tintly.parse("lch(50, 35, 300)");
Tintly.parse("oklab(0.6, 0.1, -0.1)");
Tintly.parse("oklch(0.6, 0.15, 260)");
Tintly.parse("luv(50, 20, -30)");
Tintly.parse("lchuv(50, 35, 300)");
Tintly.parse("hsluv(260, 80%, 50%)");
Tintly.parse("okhsl(260, 80%, 50%)");
Tintly.parse("okhsv(260, 80%, 50%)");

// Wide-gamut RGB
Tintly.parse("color(display-p3 0.5 0.3 0.8)");
Tintly.parse("color(srgb-linear 0.5 0.3 0.8)");
Tintly.parse("color(rec2020 0.5 0.3 0.8)");
Tintly.parse("color(a98-rgb 0.5 0.3 0.8)");
Tintly.parse("color(prophoto-rgb 0.5 0.3 0.8)");

// HDR
Tintly.parse("jzazbz(0.5, 0.02, -0.03)");
Tintly.parse("jzczhz(0.5, 0.04, 300)");
Tintly.parse("ictcp(0.5, 0.02, -0.03)");

// Print
Tintly.parse("cmyk(0%, 50%, 100%, 0%)");
Tintly.parse("cmy(0%, 50%, 80%)");

// Broadcast / scientific
Tintly.parse("yiq(0.5, 0.2, -0.1)");
Tintly.parse("ycbcr(0.5, -0.1, 0.2)");
Tintly.parse("xyy(0.3, 0.3, 0.21)");
```

Returns the parsed color object or `null` if the string is unrecognized.

---

## Converting

`Tintly.convert(color, targetType)` converts any parsed color to any registered color space:

```ts
const hex = Tintly.parse("#3498db")!;

const rgb = Tintly.convert(hex, "RGB");
console.log(Tintly.toString(rgb!));
// → "rgb(52 152 219)"

const hsl = Tintly.convert(hex, "HSL");
console.log(Tintly.toString(hsl!));
// → "hsl(204.0123 69.7368% 53.1373%)"

const oklch = Tintly.convert(hex, "OKLCH");
console.log(Tintly.toString(oklch!));
// → "oklch(0.611066 0.131255 237.0451)"

const p3 = Tintly.convert(hex, "DisplayP3");
console.log(Tintly.toString(p3!));
// → "color(display-p3 0.267851 0.592566 0.848223)"

const jz = Tintly.convert(hex, "JzCzhz");
console.log(Tintly.toString(jz!));
// → "jzczhz(0.009471 0.004823 237.1204)"
```

---

## Serializing

`Tintly.toString()` returns a CSS-compatible string for the color:

```ts
const color = Tintly.parse("hsl(120, 100%, 50%)")!;
console.log(Tintly.toString(color));
// → "hsl(120 100% 50%)"

const semi = Tintly.parse("hsla(120, 100%, 50%, 0.5)")!;
console.log(Tintly.toString(semi));
// → "hsl(120 100% 50% / 0.5)"
```

---

## Operations

All operations are methods on the `Tintly` registry instance. They all accept and return the same color type — passing an `HSL` always gives back an `HSL`.

### Alpha

```ts
const color = Tintly.parse("rgba(255, 0, 0, 1)")!;

Tintly.setAlpha(color, 0.5);        // set alpha to exactly 0.5
Tintly.adjustAlpha(color, -0.2);    // decrease alpha by 0.2
Tintly.getAlpha(color);             // → 1
```

### Mix & Scale

```ts
const red  = Tintly.parse("#ff0000")!;
const blue = Tintly.parse("#0000ff")!;

// Mix two colors — weight 0 = all red, 1 = all blue, 0.5 = equal
Tintly.mix(red, blue, 0.5);

// Generate a palette of 5 steps between red and blue
const palette = Tintly.scale(red, blue, 5);
// → [red, ~25%, ~50%, ~75%, blue]
```

### Lightness

```ts
Tintly.lighten(color, 0.1);   // increase luminance by 0.1
Tintly.darken(color, 0.1);    // decrease luminance by 0.1
```

### Transformations

```ts
Tintly.grayscale(color);   // strip chroma, preserve luminance
Tintly.invert(color);      // reflect around the D65 white point
```

### Harmony

Hue rotation operates directly in CIE XYZ space — no dependency on any specific color model.

```ts
// Complementary color (hue + 180°)
Tintly.complement(color);

// Evenly spaced colors around the hue wheel
const [a, b, c]    = Tintly.harmony(color, 3);   // triadic
const [a, b, c, d] = Tintly.harmony(color, 4);   // tetradic
const sixColors    = Tintly.harmony(color, 6);   // hexadic
```

### Accessibility (WCAG 2.1)

```ts
Tintly.luminance(color);              // relative luminance 0–1
Tintly.contrastRatio(fg, bg);         // contrast ratio 1–21 (≥ 4.5 = AA)
Tintly.readableOn(background);        // → "black" | "white"
```

### Utility

```ts
// Sanitize out-of-gamut XYZ values accumulated after multiple operations
Tintly.clamp(color);
```

---

## Operation Restrictions

Some color spaces have inherent semantic limitations. Calling a restricted operation throws an `OperationNotSupported` error.

```ts
import { OperationNotSupported } from "@henryvilani/tintly";

const cmyk = Tintly.parse("cmyk(0%, 50%, 100%, 0%)")!;

// throws: OperationNotSupported — Operation "harmony" is not supported by the "CMYK" model.
Tintly.harmony(cmyk, 3);
```

The built-in restrictions per model are:

| Model     | Restricted operations                                           | Reason |
|-----------|-----------------------------------------------------------------|--------|
| `RGB`     | `alpha`                                                         | No alpha channel in the type |
| `CMYK`    | `alpha`, `lighten`, `darken`, `harmony`, `complement`           | Subtractive print space — no hue axis, no alpha semantics |
| `CMY`     | `alpha`, `lighten`, `darken`, `harmony`, `complement`           | Subtractive print space — same as CMYK |
| `YIQ`     | `harmony`, `complement`                                         | Broadcast signal axes, not perceptual hue |
| `YCbCr`   | `harmony`, `complement`                                         | Video encoding space, not perceptual hue |
| `XYY`     | `lighten`, `darken`, `harmony`, `complement`                    | Scientific chromaticity; Y is absolute luminance |
| `ICtCp`   | `lighten`, `darken`, `luminance`, `contrastRatio`, `readableOn` | HDR absolute scale (PQ), incompatible with WCAG |
| `JzAzBz`  | `lighten`, `darken`, `luminance`, `contrastRatio`, `readableOn` | HDR absolute scale (PQ), incompatible with WCAG |
| `JzCzhz`  | `lighten`, `darken`, `luminance`, `contrastRatio`, `readableOn` | HDR absolute scale (PQ), incompatible with WCAG |

All other models support every operation without restriction.

---

## Alpha Support

All color models carry an alpha channel:

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
// → ["RGB", "RGBA", "HEX", "LAB", "HSL", "LCH", "OKLAB", "OKLCH", "HWB",
//    "CMYK", "CMY", "YIQ", "HSB", "LinearSRGB", "DisplayP3", "Rec2020",
//    "A98RGB", "ProPhotoRGB", "HSLuv", "LUV", "LCHuv", "Okhsl", "Okhsv",
//    "JzAzBz", "JzCzhz", "ICtCp", "XYY", "YCbCr"]

console.log(Tintly.has("OKLCH"));     // → true
console.log(Tintly.has("DisplayP3")); // → true
console.log(Tintly.has("XYZ"));       // → false
```

---

## Extending with Custom Models

You can register your own color model by implementing the `ColorModel<T>` interface.

### Basic example

```ts
import { Tintly } from "@henryvilani/tintly";
import type { BaseColor, ColorModel } from "@henryvilani/tintly";

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
    return { x: 0.9505 * v, y: 1.0 * v, z: 1.0890 * v, alpha: color.a };
  },

  fromCanonical(color) {
    const value = Math.round(color.y * 255);
    return { type: "Grayscale", value: Math.max(0, Math.min(255, value)), a: color.alpha };
  },

  toString(color) {
    return `gray(${color.value})`;
  },
};

Tintly.register(GrayscaleModel);

const g   = Tintly.parse("gray(128)");
const hex = Tintly.convert(g!, "HEX");
console.log(Tintly.toString(hex!)); // → "#808080"
```

### Restricting operations with `unsupportedOperations`

Some models may not support certain operations — for example, a print-oriented CMYK model where hue rotation or harmony make no sense. Declare `unsupportedOperations` on the model and Tintly will throw an `OperationNotSupported` error if they are called.

```ts
import type { Operation } from "@henryvilani/tintly";

const PrintCMYKModel: ColorModel<PrintCMYK> = {
  type: "PrintCMYK",

  unsupportedOperations: ["harmony", "complement"] satisfies Operation[],

  // ... parse, toCanonical, fromCanonical, toString
};
```

Calling a restricted operation throws:

```ts
// throws: OperationNotSupported — Operation "harmony" is not supported by the "PrintCMYK" model.
Tintly.harmony(printColor, 3);
```

The full list of restrictable operations:

| Operation       | Methods affected                              |
|-----------------|-----------------------------------------------|
| `"alpha"`       | `setAlpha`, `adjustAlpha`, `getAlpha`         |
| `"mix"`         | `mix`                                         |
| `"scale"`       | `scale`                                       |
| `"lighten"`     | `lighten`                                     |
| `"darken"`      | `darken`                                      |
| `"grayscale"`   | `grayscale`                                   |
| `"invert"`      | `invert`                                      |
| `"complement"`  | `complement`                                  |
| `"harmony"`     | `harmony`                                     |
| `"luminance"`   | `luminance`                                   |
| `"contrastRatio"` | `contrastRatio`                             |
| `"readableOn"`  | `readableOn`                                  |

---

## API Reference

### Core

#### `Tintly.parse(input: string): BaseColor | null`
Attempts to parse a color string with all registered models. Returns the first match or `null`.

#### `Tintly.convert<To>(color: BaseColor, targetType: string): To | null`
Converts a color to the specified type via the CIE XYZ intermediate. Returns `null` if either model is not registered.

#### `Tintly.toString(color: BaseColor): string`
Serializes a color to its canonical CSS string representation. Throws `ColorNotSupported` if the model is not registered.

#### `Tintly.register(model: ColorModel<T>): this`
Registers a new color model. Chainable.

#### `Tintly.has(type: string): boolean`
Returns `true` if a model with the given type is registered.

#### `Tintly.types(): string[]`
Returns an array of all registered type identifiers.

### Operations

#### `Tintly.setAlpha<T>(color: T, alpha: number): T`
Returns a new color with alpha set to `alpha` (0–1).

#### `Tintly.adjustAlpha<T>(color: T, amount: number): T`
Returns a new color with alpha shifted by `amount` (–1 to 1).

#### `Tintly.getAlpha(color: BaseColor): number`
Returns the alpha value of a color (0–1).

#### `Tintly.mix<T>(colorA: T, colorB: BaseColor, weight?: number): T`
Mixes two colors in XYZ space. `weight` defaults to `0.5`.

#### `Tintly.scale<T>(from: T, to: BaseColor, steps?: number): T[]`
Returns a palette of `steps` colors between `from` and `to`. Defaults to 5 steps.

#### `Tintly.lighten<T>(color: T, amount: number): T`
Increases the Y (luminance) component by `amount` (0–1).

#### `Tintly.darken<T>(color: T, amount: number): T`
Decreases the Y (luminance) component by `amount` (0–1).

#### `Tintly.grayscale<T>(color: T): T`
Strips chroma while preserving luminance.

#### `Tintly.invert<T>(color: T): T`
Reflects XYZ coordinates around the D65 white point. Alpha is preserved.

#### `Tintly.complement<T>(color: T): T`
Returns the complementary color (hue + 180°) in XYZ space.

#### `Tintly.harmony<T>(color: T, count?: number): T[]`
Returns `count` colors evenly spaced around the hue wheel in XYZ space. Defaults to 3 (triadic).

#### `Tintly.luminance(color: BaseColor): number`
Returns the WCAG 2.1 relative luminance (0–1).

#### `Tintly.contrastRatio(colorA: BaseColor, colorB: BaseColor): number`
Returns the WCAG 2.1 contrast ratio (1–21).

#### `Tintly.readableOn(background: BaseColor): "black" | "white"`
Returns which foreground color has the higher contrast against the background.

#### `Tintly.clamp<T>(color: T): T`
Clamps out-of-gamut XYZ values and round-trips the color through its model.

---

## Supported Color Spaces

### sRGB family

| Type    | Example string                            |
|---------|-------------------------------------------|
| `RGBA`  | `rgba(255, 128, 0, 0.5)`                  |
| `RGB`   | `rgb(255, 128, 0)`                        |
| `HEX`   | `#ff8000`, `#f80`, `#ff8000ff`            |
| `HSL`   | `hsl(30, 100%, 50%)`, `hsla(...)`         |
| `HSB`   | `hsb(30, 100%, 50%)`                      |
| `HWB`   | `hwb(30, 0%, 0%)`                         |

### CIE / perceptual

| Type      | Example string                            |
|-----------|-------------------------------------------|
| `LAB`     | `lab(70, 20, -10)`                        |
| `LCH`     | `lch(70, 22, 333)`                        |
| `OKLAB`   | `oklab(0.7, 0.1, -0.05)`                  |
| `OKLCH`   | `oklch(0.7, 0.12, 330)`                   |
| `LUV`     | `luv(70, 20, -10)`                        |
| `LCHuv`   | `lchuv(70, 22, 333)`                      |
| `HSLuv`   | `hsluv(333, 80%, 70%)`                    |
| `Okhsl`   | `okhsl(333, 80%, 70%)`                    |
| `Okhsv`   | `okhsv(333, 80%, 70%)`                    |

### Wide-gamut RGB

| Type          | Example string                            |
|---------------|-------------------------------------------|
| `LinearSRGB`  | `color(srgb-linear 0.5 0.3 0.8)`         |
| `DisplayP3`   | `color(display-p3 0.5 0.3 0.8)`          |
| `Rec2020`     | `color(rec2020 0.5 0.3 0.8)`             |
| `A98RGB`      | `color(a98-rgb 0.5 0.3 0.8)`             |
| `ProPhotoRGB` | `color(prophoto-rgb 0.5 0.3 0.8)`        |

### HDR

| Type      | Example string                            |
|-----------|-------------------------------------------|
| `JzAzBz`  | `jzazbz(0.5, 0.02, -0.03)`               |
| `JzCzhz`  | `jzczhz(0.5, 0.04, 300)`                 |
| `ICtCp`   | `ictcp(0.5, 0.02, -0.03)`                |

### Print

| Type   | Example string                            |
|--------|-------------------------------------------|
| `CMYK` | `cmyk(0%, 50%, 100%, 0%)`                |
| `CMY`  | `cmy(0%, 50%, 80%)`                       |

### Broadcast / scientific

| Type     | Example string                            |
|----------|-------------------------------------------|
| `YIQ`    | `yiq(0.5, 0.2, -0.1)`                    |
| `YCbCr`  | `ycbcr(0.5, -0.1, 0.2)`                  |
| `XYY`    | `xyy(0.3, 0.3, 0.21)`                    |

---

## License

MIT © Henry Vilani