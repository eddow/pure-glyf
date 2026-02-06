# pure-glyf

[![npm version](https://badge.fury.io/js/pure-glyf.svg)](https://badge.fury.io/js/pure-glyf)

**Vite plugin and runtime to compile SVG icons into tree-shakeable CSS masks for modern web applications.**

`pure-glyf` takes a different approach to icon management. Instead of inlining SVGs (bloating your DOM) or using sprites (complexity), it converts your SVGs into CSS classes that inject their styles on demand. The result? Zero runtime overhead for unused icons, perfect tree-shaking, and a developer experience that feels like magic.

---

## Features

- 🌳 **True Tree-Shaking**: Only the icons you actually import end up in your final bundle.
- 🚀 **Zero Runtime Overhead**: Icons are just strings (CSS class names). No heavy JS objects or runtime parsers.
- ⚡ **On-Demand Injection**: CSS for an icon is only injected into the page when you import it.
- 🧩 **Vite Integration**: A dedicated Vite plugin automates the entire process.
- 🎨 **Themable**: Icons automatically inherit `currentColor`.
- 🖥️ **SSR Ready**: Built-in support for server-side rendering (critical CSS extraction).
- 🏷️ **Type-Safe**: Generated TypeScript definitions for your specific icon set.

## Why pure-glyf?

| Method | JS Bundle Size | DOM Size | Tree Shaking | Developer Experience |
| :--- | :--- | :--- | :--- | :--- |
| **Inline SVGs** | ❌ Heavy | ❌ Bloated | ✅ Good | 😐 Verbose JSX |
| **SVG Sprites** | ✅ Light | ✅ Light | ❌ Hard | 😫 Manual Management |
| **Icon Fonts** | ✅ Light | ✅ Light | ❌ None | 😐 FOUT / Accessibility |
| **pure-glyf** | ✅ **Minimal** | ✅ **Minimal** | ✅ **Perfect** | 😍 **Auto-generated** |

## Installation

```bash
npm install pure-glyf
# or
pnpm add pure-glyf
# or
yarn add pure-glyf
```

## Usage

### 1. Structure Your Icons

Place your SVG files in a directory. You can have multiple directories (e.g., for different icon sets).

```
src/
  assets/
    icons/
      home.svg
      user.svg
      settings.svg
```

#### Using Icons from npm
You can also source icons directly from installed packages (e.g., `@tabler/icons`, `@mdi/svg`, `heroicons`). Just install them as dev dependencies!

### 2. Configure Vite

Add `pureGlyfPlugin` to your `vite.config.ts`.

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { pureGlyfPlugin } from 'pure-glyf/plugin';

export default defineConfig({
  plugins: [
    pureGlyfPlugin({
      icons: {
        // 1. Local icons
        // Usage: 'custom' + 'Home' -> customHome
        custom: './src/assets/icons',
        
        // 2. Common Icon Libraries (examples)
        
        // Tabler Icons (Install: pnpm add -D @tabler/icons) - outline
        // Usage: tablerHome, tablerUser
        tabler: './node_modules/@tabler/icons/icons/outline',

        // -- or --

        // Tabler Icons (Install: pnpm add -D @tabler/icons) - all icons
        // Usage: tablerOutlineHome, tablerFilledUser
        tabler: './node_modules/@tabler/icons/icons',
        
        // Material Design Icons (Install: pnpm add -D @mdi/svg)
        // Usage: mdiAccount, mdiHome
        mdi: './node_modules/@mdi/svg/svg',
        
        // Heroicons (Install: pnpm add -D heroicons)
        // Usage: heroHome, heroUser
        hero: './node_modules/heroicons/24/outline',
        
        // Lucide (Install: pnpm add -D lucide-static)
        // Usage: lucHome, lucUser
        luc: './node_modules/lucide-static/icons',
      },
      dts: 'src/pure-glyf-icons.d.ts' 
    })
  ]
});
```

### 3. Configure Rollup (Alternative)

If you are using Rollup without Vite, use the plugin directly.

> **Note**: You must use `@rollup/plugin-node-resolve` so Rollup can resolve the `pure-glyf` runtime.

```javascript
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import { pureGlyfPlugin } from 'pure-glyf/plugin';

export default {
  // ...
  plugins: [
    resolve(), // Required to resolve 'pure-glyf' runtime
    pureGlyfPlugin({
       icons: {
         // ... same configuration as Vite
         myIcon: './src/assets/icons'
       }
    })
  ]
};
```

### Low-Level Injection API

For advanced use cases, you can import directly from `pure-glyf/inject`:

```typescript
import { injectCSS, extractCriticalCSS, sheet, onInject, mount } from 'pure-glyf/inject';

// Manually inject CSS for a custom icon
injectCSS('.my-custom-icon { mask-image: url("..."); }');

// Extract only the CSS needed for a specific HTML chunk
const criticalCSS = extractCriticalCSS(html);
```

**Exports from `pure-glyf/inject`:**
- `mount()` - Injects the base styles into the DOM
- `sheet` - Accumulated CSS string for SSR
- `onInject(callback)` - Subscribe to new style injections
- `injectCSS(css)` - Manually inject CSS for custom icons
- `extractCriticalCSS(html)` - Extract only the CSS needed for a specific HTML chunk

### 3. Mount Styles

In your application's entry point (e.g., `main.tsx` or `index.ts`), call `mount()` to set up the style injection system.

```typescript
// You can import 'mount' from the main package OR the virtual module
import { mount } from 'pure-glyf'; 
// import { mount } from 'pure-glyf/icons'; // Also works!

mount(); // Injects the base styles and prepares the style tag
```

### 4. Use Icons

Import icons from the virtual module `pure-glyf/icons`. The export name is `[Prefix][PascalCaseFilename]`.

```tsx
import { customHome, customUser } from 'pure-glyf/icons';

function App() {
  // 'customHome' is just a string: "pure-glyf-icon glyf-custom-home"
  
  return (
    <nav>
      {/* Use it as a class name on any element (usually <span> or <i>) */}
      <span className={customHome} />
      
      <button>
        <i className={customUser} /> Profile
      </button>
    </nav>
  );
}
```

## Configuration

The `pureGlyfPlugin` accepts the following options:

### `icons` (Required)
A record mapping prefixes to directory paths.
- **Key**: The prefix for the generated variable names (e.g., `tabler` -> `tablerHome`).
- **Value**: The relative path to the directory containing `.svg` files.

### `dts` (Optional)
Path to generate the TypeScript declaration file. 
- **Default**: `pure-glyf.d.ts` in the project root.
- **Recommendation**: Set this to a path included in your `tsconfig.json` (e.g., `src/pure-glyf-icons.d.ts`).

## Programmatic Generation

If you need to generate icon code outside of the Vite plugin (e.g., for custom build tools), use `pure-glyf/generator`:

```typescript
import { generateIconsCode } from 'pure-glyf/generator';

const result = generateIconsCode({
  custom: './src/assets/icons',
  tabler: './node_modules/@tabler/icons/icons/outline'
}, false); // false = production mode

// result.code - JavaScript module code
// result.css - CSS for dev mode
// result.dts - TypeScript declarations
```

**Exports from `pure-glyf/generator`:**
- `generateIconsCode(config, isDev)` - Generate icon code from SVG directories
- `svgToDataUri(svg)` - Encode SVG string to data URI
- `IconDef`, `GeneratorResult` - TypeScript interfaces

## styling

Icons are rendered as CSS masks. They inherit the text color (`currentColor`) by default.

### Default Styles
Every icon comes with the `.pure-glyf-icon` class:

```css
.pure-glyf-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  background-color: currentColor; /* Matches text color */
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
}
```

### Custom Sizing & Coloring
Since they are just elements with a background color, you style them with standard CSS:

```css
.my-huge-icon {
  font-size: 3rem; /* 3x normal text size */
  color: #ff0000;  /* Red icon */
}
```

## Server-Side Rendering (SSR)

`pure-glyf` supports SSR by allowing you to extract the CSS required for the rendered page.

```typescript
import { sheet } from 'pure-glyf';
import { renderToString } from 'react-dom/server';

// 1. Render your app
const html = renderToString(<App />);

// 2. Extract the accumulated CSS
// 'sheet' contains the base styles + styles for all icons used during render
const css = sheet;

// 3. Inject into your HTML template
const fullHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <style>${css}</style>
    </head>
    <body>
      <div id="root">${html}</div>
    </body>
  </ul>
`;
```

## Architecture & Performance

`pure-glyf` uses a hybrid strategy to deliver the best developer experience without compiling performance costs.

### Development Mode: Parallel Parsing
In development, decoding thousands of Data URIs in JavaScript can be slow (blocking the main thread).
- **Mechanism**: The plugin moves all icon CSS into a separate virtual CSS module (`pure-glyf/icons.css`).
- **Benefit**: This offloads parsing to the browser's native CSS engine, which runs in parallel. The main JavaScript module remains tiny and instant to load.
- **Result**: Near-instant HMR and page reloads, even with huge icon sets like Material Design or Tabler.

### Production Mode: Perfect Tree-Shaking
In production, we prioritize bundle size.
- **Mechanism**: Icons are compiled into side-effect-free IIFEs (Immediately Invoked Function Expressions) annotated with `/*#__PURE__*/`.
- **Logic**: 
  ```javascript
  export const myIcon = /*#__PURE__*/ (() => {
      injectCSS("..."); // Only runs if 'myIcon' is actually used
      return "pure-glyf-icon glyf-my-icon";
  })();
  ```
- **Benefit**: If you don't import `myIcon`, your bundler (Vite/Rollup/Esbuild) completely removes the code *and* the associated CSS string.

### The Virtual Module `pure-glyf/icons`
The plugin orchestrates everything by creating a virtual module `pure-glyf/icons`. This module re-exports the core runtime functions for convenience:
- `mount()`: Injects the styles.
- `sheet`: Access the accumulated CSS string.
- `onInject()`: Subscribe to new style injections.

## License

MIT