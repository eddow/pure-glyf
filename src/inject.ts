/**
 * CSS injection utility for pure-glyf icons.
 * 
 * Uses a deduplication set to ensure each CSS rule is only injected once.
 * Exports `sheet` for SSR usage.
 * styles are NOT injected automatically. You must call `mount()` to inject them into the DOM.
 */

const injectedStyles = new Set<string>();

/**
 * Accumulated CSS string for Server-Side Rendering (SSR).
 * Reset it if needed between requests in a server environment.
 */
export let sheet = `
.pure-glyf-icon {
    display: inline-block;
    width: 1em;
    height: 1em;
    background-color: currentColor;
}`;

let styleElement: HTMLStyleElement | null = null;

/**
 * Mounts the styles to the DOM.
 * If the style tag already exists, it does nothing.
 * If not, it creates it and populates it with the current accumulated CSS.
 */
export function mount(): void {
    if (typeof document === 'undefined') return;
    if (styleElement) return;

    styleElement = document.createElement('style');
    styleElement.textContent = sheet;
    document.head.appendChild(styleElement);
}

// Subscribers for reactive injection
const subscribers = new Set<(css: string) => void>();

export function onInject(callback: (css: string) => void): void {
    subscribers.add(callback);
}

export function injectCSS(css: string): void {
    if (injectedStyles.has(css)) return;

    injectedStyles.add(css);
    sheet += css;

    // Only update the DOM if we are already mounted
    if (styleElement) {
        styleElement.textContent = sheet;
    }

    // Notify subscribers
    subscribers.forEach(cb => cb(css));
}
