// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import nodePolyfills from 'rollup-plugin-polyfill-node';

const isProduction = process.env.BUILD_TYPE === 'production';

export default {
    input: 'src/scripts/index.ts',
    output: {
        dir: 'dist',
        format: 'es',
        sourcemap: !isProduction,
        intro: 'var global = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : undefined;'
    },
    external: [
        '../../../../extensions.js',
        '../../../../RossAscends-mods.js',
        '../../../../../script.js',
        '../../../../../lib.js',
        '../../../../world-info.js',
    ],
    plugins: [
        resolve({
            browser: true,
            preferBuiltins: false
        }),
        commonjs(),
        nodePolyfills({
            include: ['buffer', 'stream']
        }),
        typescript()
    ]
};
