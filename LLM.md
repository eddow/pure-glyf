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

## CSS Handling
- **Base Class**: `.pure-glyf-icon`.
- **Icon Class**: Sets the `mask-image` to the SVG data URI.
- **Browser**: single `<style>` tag, updated by `injectCSS` (if mounted).
- **SSR**: Exports `sheet` string.
