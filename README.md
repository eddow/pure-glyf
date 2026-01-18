# pure-glyf

A tree-shakeable SVG icon library that uses CSS mask injection.

## Features

- **Tree-Shakeable**: Only the icons you import are included in your bundle.
- **Zero Runtime Overhead**: Icons are just CSS class strings. Styles are injected once on demand.
- **SSR Compatible**: Supports server-side rendering with critical CSS extraction.
- **Vite Integration**: Automatically generates icon exports from your SVG files.
- **Themable**: Icons inherit `color` via `currentColor`.

## Installation

```bash
npm install pure-glyf
# or
pnpm add pure-glyf
```

## Vite Configuration

Add the `pureGlyfPlugin` to your `vite.config.ts`. This plugin generates a virtual module `pure-glyf/icons` based on your SVG directories.

```typescript
import { defineConfig } from 'vite';
import { pureGlyfPlugin } from 'pure-glyf/plugin';

export default defineConfig({
  plugins: [
    pureGlyfPlugin({
      icons: {
        // map 'Prefix' to 'Path/to/icons'
        // Result: tablerHome, tablerUser, etc.
        tabler: 'node_modules/@tabler/icons/icons/outline',
        custom: './src/assets/icons'
      },
      // Optional: Path for generated .d.ts file
      dts: 'src/pure-glyf-icons.d.ts' 
    })
  ]
});
```

## Usage

Import icons directly from the virtual module `pure-glyf/icons`. The export name is constructed as `[prefix][PascalCaseFilename]`.

```tsx
import { mount } from 'pure-glyf'; // or from 'pure-glyf/icons'
import { tablerHome, tablerUser } from 'pure-glyf/icons';

// In your app entry point (e.g. main.tsx)
mount();

// Usage in JSX/TSX
// The import is just a string containing the class names:
// "pure-glyf-icon glyf-tabler-home"
function App() {
  return (
    <div>
       <span className={tablerHome} />
       <button>
         <i className={tablerUser} /> Profile
       </button>
    </div>
  );
}
```

### Styling

Icons automatically get the `.pure-glyf-icon` base class:

```css
.pure-glyf-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  background-color: currentColor;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
}
```

You can size or color them using standard CSS:

```css
.my-icon {
  color: red;
  font-size: 24px; /* Sets width/height via em */
}
```

## How It Works

1.  **Code Generation**: The Vite plugin scans your icon directories and generates a virtual module.
2.  **Pure IIFEs**: Each exported icon is wrapped in a `/*#__PURE__*/` IIFE that calls `injectCSS`.
    ```javascript
    export const tablerHome = /*#__PURE__*/ (() => {
        injectCSS("...");
        return "pure-glyf-icon glyf-tabler-home";
    })();
    ```
3.  **On-Demand Injection**: The `injectCSS` function records the usage. You call `mount()` to inject the consolidated CSS into the `<head>`.
4.  **Tree Shaking**: If an icon is not imported, the IIFE is never executed (and Dead Code Elimination removes it entirely), so its CSS is never included.

## Server-Side Rendering (SSR)

For SSR, you can extract the accumulated CSS using the `sheet` export.

```typescript
import { sheet } from 'pure-glyf';

// In your SSR renderer:
const html = renderToString(<App />);
const styles = `<style>${sheet}</style>`;

// Inject `styles` into your HTML template's <head>
```

# TODO

- [ ] Have it js-compatible
- [ ] Perhaps include some common libraries by default?
- [ ] Make sure it's rollup compatible