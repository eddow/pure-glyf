# pure-glyf Documentation

## Overview
Tree-shakeable SVG icon library. Each icon is a CSS class name injected on-demand via the `/*#__PURE__*/` IIFE pattern, enabling bundlers to eliminate unused icons and their CSS.

## Architecture
- **Core**: `inject.ts` manages a deduplicated set of styles. Styles are injected ONLY when `mount()` is called.
- **Generator**: `generator.ts` converts SVGs into data URIs and wraps them in generated TypeScript code.
- **Plugin**: `plugin.ts` (Vite) watches file changes and creates the virtual module `pure-glyf/icons`.

## Usage Pattern
```typescript
import { tablerHome, mount } from 'pure-glyf/icons';

// Initialize styles (call once, e.g. in main.ts or root component)
mount();

// Use icon (returns class string)
// tablerHome = "pure-glyf-icon glyf-tabler-home"
```
The side-effect (CSS recording) happens at import time within the side-effect-free IIFE. `mount()` applies recorded styles to the DOM.

## Virtual Module `pure-glyf/icons`
The plugin generates this module in memory.
Exports:
- `mount()`: Function to inject styles.
- `sheet`: String containing all injected CSS.
- `onInject(cb)`: Subscribe to incremental CSS updates.
- Icon constants: Strings for every icon found (e.g. `TablerHome`).

## Exports
- `.` (main): Exports `mount`, `sheet`, `onInject`.
- `./plugin`: Vite plugin.
- `./inject`: Internal injection utility (exposed for generated code).

## Performance Optimization

The library uses a hybrid strategy to handle large icon sets (like Tabler/MDI).

### Development Mode
- **Mechanism**: All icon styles are moved to a virtual CSS module (`pure-glyf/icons.css`).
- **Parallel Parsing**: Offloads Data URI parsing to the browser's CSS engine, making the main JS module near-instant.
- **Implementation**: The JS module exports simple string class-name mapping constants.

### Production Mode
- **Mechanism**: Icons are bundled as tree-shakeable constants using IIFEs and `/*#__PURE__*/` annotations.
- **Tree-Shaking**: Ensures only used icons (and their CSS strings) are included in the final bundle.
- **Implementation**: `injectCSS` is called lazily when an icon is first used.

## Usage Details
- **Mount Requirements**: `mount()` must be called once (typically in your App's entry point) to inject the styles into the DOM.
- **Base Class**: `.pure-glyf-icon` for shared styles (size, display, mask resets).
- **SSR**: Access `sheet` to get the accumulated CSS.
- **Critical CSS**: Use `extractCriticalCSS(html)` in SSR to get specific CSS for the rendered HTML.

## SSR Integration
For optimal performance, avoid injecting the entire stylesheet. Instead, use `extractCriticalCSS`:

```typescript
import { renderToString } from 'your-framework';
import { extractCriticalCSS } from 'pure-glyf';

const html = renderToString(<App />);
const css = extractCriticalCSS(html);

const finalHtml = html.replace('</head>', `<style>${css}</style></head>`);
```

## Configuration Patterns

### Vite
```typescript
// vite.config.ts
import { pureGlyfPlugin } from 'pure-glyf/plugin';

export default defineConfig({
  plugins: [
    pureGlyfPlugin({
      icons: {
        prefix: './path/to/icons' // e.g. prefix="icon" -> iconHome
      }
    })
  ]
});
```

### Rollup
Requires `@rollup/plugin-node-resolve` to handle runtime imports.

```javascript
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import { pureGlyfPlugin } from 'pure-glyf/plugin';

export default {
  plugins: [
    resolve(), 
    pureGlyfPlugin({
      icons: {
        prefix: './path/to/icons'
      }
    })
  ]
};
```
