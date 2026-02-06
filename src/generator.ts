
import fs from 'node:fs';
import path from 'node:path';

// --- Utils ---

function toPascalCase(str: string): string {
    return str
        .replace(/[-_./\\]+(.)/g, (_, c) => c.toUpperCase())
        .replace(/^./, c => c.toUpperCase());
}

// Optimized SVG encoder for CSS
function svgToDataUri(svg: string): string {
    const encoded = svg
        .replace(/"/g, "'")
        .replace(/%/g, '%25')
        .replace(/#/g, '%23')
        .replace(/{/g, '%7B')
        .replace(/}/g, '%7D')
        .replace(/</g, '%3C')
        .replace(/>/g, '%3E')
        .replace(/\s+/g, ' ');
    return `data:image/svg+xml,${encoded}`;
}

export interface IconDef {
    name: string;
    css: string;
}

export interface GeneratorResult {
    code: string;
    css: string;
    dts: string;
}

// --- Logic ---

function scanDirectory(dir: string, rootDir: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(scanDirectory(filePath, rootDir));
        } else if (file.endsWith('.svg')) {
             // Store relative path from the rootDir provided to the config
             results.push(path.relative(rootDir, filePath));
        }
    });
    return results;
}

export function generateIconsCode(config: Record<string, string>, isDev = false): GeneratorResult {
    const icons: IconDef[] = [];

    for (const [prefix, dirPath] of Object.entries(config)) {
        const absolutePath = path.resolve(process.cwd(), dirPath);
        if (!fs.existsSync(absolutePath)) {
            console.warn(`[pure-glyf] Warning: Icon directory not found: ${absolutePath}`);
            continue;
        }

        const files = scanDirectory(absolutePath, absolutePath);

        files.forEach(relPath => {
            const fullPath = path.join(absolutePath, relPath);
            const content = fs.readFileSync(fullPath, 'utf-8');
            
            // Naming: Prefix + RelativePath (sanitized)
             // Remove extension
            const cleanRelPath = relPath.replace(/\.svg$/, '');
            // User requested lower-case-first (camelCase)
            // We reuse toPascalCase but lower-case the first letter
            const pascal = toPascalCase(cleanRelPath);
            const varName = prefix + pascal;
            const className = `glyf-${prefix.toLowerCase()}-${cleanRelPath.replace(/[^a-zA-Z0-9-]/g, '-')}`;
            
            const dataUri = svgToDataUri(content);

            // Optimized CSS: only mask-image since common props are in .pure-glyf-icon
            const css = `.${className}{mask-image:url("${dataUri}");-webkit-mask-image:url("${dataUri}");}`;
            icons.push({ name: varName, css });
        });
    }

    // --- Generate Code ---
    
    const codeLines = [
        `import { injectCSS, mount, sheet, onInject, extractCriticalCSS } from 'pure-glyf';`,
        `export { mount, sheet, onInject, extractCriticalCSS };`,
        ``
    ];

    let allCSS = '';
    let exportStatements: string[];

    if (isDev) {
        // Dev mode: Offload CSS to a separate virtual module for parallel parsing
        codeLines.unshift(`import 'pure-glyf/icons.css';`);
        allCSS = icons.map(i => i.css).join('');
        exportStatements = icons.map(icon => {
            const match = icon.css.match(/^\s*\.(\S+)\{/);
            const className = match ? match[1] : 'error-class';
            return `export const ${icon.name} = "pure-glyf-icon ${className}";`;
        });
    } else {
        // Prod mode: Keep IIFEs for tree-shaking
        exportStatements = icons.map(icon => {
            const match = icon.css.match(/^\s*\.(\S+)\{/);
            const className = match ? match[1] : 'error-class';
            return `export const ${icon.name} = /*#__PURE__*/ (() => {
    injectCSS(\`${icon.css}\`);
    return "pure-glyf-icon ${className}";
})();`;
        });
    }

    const code = codeLines.concat(exportStatements).join('\n');

    // --- Generate DTS ---
    
    const dtsLines = [
        `declare module 'pure-glyf/icons' {`,
        `    export function mount(): void;`,
        `    export const sheet: string;`,
        `    export function onInject(callback: (css: string) => void): void;`,
    ];
    icons.forEach(icon => {
        dtsLines.push(`    export const ${icon.name}: string;`);
    });
    dtsLines.push(`}`);
    
    const dts = dtsLines.join('\n');

    return { code, css: allCSS, dts };
}
