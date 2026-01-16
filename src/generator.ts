
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

export function generateIconsCode(config: Record<string, string>): GeneratorResult {
    const icons: IconDef[] = [];

    for (const [prefix, dirPath] of Object.entries(config)) {
        if (!fs.existsSync(dirPath)) {
            console.warn(`[pure-glyf] Warning: Icon directory not found: ${dirPath}`);
            continue;
        }

        const files = scanDirectory(dirPath, dirPath);

        files.forEach(relPath => {
            const fullPath = path.join(dirPath, relPath);
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

            const css = `
.${className} {
    mask: url("${dataUri}") no-repeat center / contain;
    -webkit-mask: url("${dataUri}") no-repeat center / contain;
}`;
            icons.push({ name: varName, css });
        });
    }

    // --- Generate Code ---
    
    const codeLines = [
        `import { injectCSS, mount, sheet, onInject } from 'pure-glyf';`,
        `export { mount, sheet, onInject };`,
        ``
    ];

    // Loop removed (refactored below)
    
    // START REFACTOR of loop for clarity
    const exportStatements = icons.map(icon => {
         // Extract classname from the CSS to be safe/DRY
         const match = icon.css.match(/^\s*\.(\S+)\s/);
         const className = match ? match[1] : 'error-class';
         return `export const ${icon.name} = /*#__PURE__*/ (() => {
    injectCSS(\`${icon.css}\`);
    return "pure-glyf-icon ${className}";
})();`;
    });

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

    return { code, dts };
}
