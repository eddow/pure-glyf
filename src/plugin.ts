
import type { Plugin, ViteDevServer } from 'vite';
import { generateIconsCode, type GeneratorResult } from './generator';
import fs from 'node:fs';
import path from 'node:path';

export interface PureGlyfConfig {
    /**
     * Map of Prefix -> Directory Path
     * Example: { 'Tabler': './icons/tabler', 'MyIcon': './src/assets' }
     */
    icons: Record<string, string>;
    
    /**
     * Path to write the d.ts file to.
     * Defaults to 'pure-glyf.d.ts' in the project root.
     */
    dts?: string;
}

export function pureGlyfPlugin(config: PureGlyfConfig): Plugin {
    const virtualModuleId = 'pure-glyf/icons';
    const resolvedVirtualModuleId = '\0' + virtualModuleId;
    const dtsPath = config.dts || 'pure-glyf.d.ts';

    let lastResult: GeneratorResult | null = null;
    let server: ViteDevServer | null = null;

    function regenerate() {
        try {
            lastResult = generateIconsCode(config.icons);
            // Write generated types to disk for IDE support
            fs.writeFileSync(path.resolve(process.cwd(), dtsPath), lastResult.dts);
            
            // Invalidate module if server exists
            if (server) {
                const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
                if (mod) {
                    server.moduleGraph.invalidateModule(mod);
                    server.ws.send({
                        type: 'full-reload',
                        path: '*'
                    });
                }
            }
        } catch (e) {
            console.error('[pure-glyf] Generation failed:', e);
        }
    }

    return {
        name: 'vite-plugin-pure-glyf',
        enforce: 'pre',
        
        configureServer(_server) {
            server = _server;

            // Watch icon directories
            Object.values(config.icons).forEach(dir => {
                server?.watcher.add(path.resolve(dir));
            });
            
            server?.watcher.on('change', (file) => {
               if (file.endsWith('.svg')) regenerate();
            });
            server?.watcher.on('add', (file) => {
                if (file.endsWith('.svg')) regenerate();
            });
            server?.watcher.on('unlink', (file) => {
                if (file.endsWith('.svg')) regenerate();
            });
        },

        buildStart() {
            // Generate on start (dev or build)
            regenerate();
        },

        resolveId(id) {
            if (id === virtualModuleId) {
                return resolvedVirtualModuleId;
            }
        },

        load(id) {
            if (id === resolvedVirtualModuleId) {
                // Return cached result. 
                // We assume buildStart has already populated lastResult.
                return lastResult!.code;
            }
        }
    };
}
