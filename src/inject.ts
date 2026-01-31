/**
 * CSS injection utility for pure-glyf icons.
 * 
 * Uses a deduplication set to ensure each CSS rule is only injected once.
 * Exports `sheet` for SSR usage.
 * styles are NOT injected automatically. You must call `mount()` to inject them into the DOM.
 */

const injectedStyles = new Map<string, string>();
const subscribers = new Set<(css: string) => void>();
let styleElement: HTMLStyleElement | null = null;

const baseSheet = `
.pure-glyf-icon {
    display: inline-block;
    width: 1em;
    height: 1em;
    background-color: currentColor;
    mask-repeat: no-repeat;
    mask-position: center;
    mask-size: contain;
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-position: center;
    -webkit-mask-size: contain;
}`;

/**
 * Accumulated CSS string for Server-Side Rendering (SSR).
 * Contains all injected styles.
 */
export let sheet = baseSheet;

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

export function onInject(callback: (css: string) => void): void {
    subscribers.add(callback);
}

export function injectCSS(css: string): void {
    // Extract class name from CSS to use as key
    // matches .classname { ... }
    const match = css.match(/^\.([\w-]+)/);
    const className = match ? match[1] : css;

    if (injectedStyles.has(className)) return;

    injectedStyles.set(className, css);
    sheet += css;

    // Only update the DOM if we are already mounted
    if (styleElement) {
        styleElement.textContent = sheet;
    }

    // Notify subscribers
    subscribers.forEach(cb => cb(css));
}

/**
 * Scans the provided HTML for usage of injected icons and returns 
 * a critical CSS string containing only the necessary styles.
 * 
 * @param html The full HTML string to scan
 */
export function extractCriticalCSS(html: string): string {
    const usedClasses = new Set<string>();
    
    for (const [className, css] of injectedStyles.entries()) {
        if (html.includes(className)) {
            usedClasses.add(css);
        }
    }

    return baseSheet + Array.from(usedClasses).join('');
}
