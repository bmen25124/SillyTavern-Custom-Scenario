// rollup.config.js
import typescript from '@rollup/plugin-typescript';

const isProduction = process.env.BUILD_TYPE === 'production';

export default {
    input: 'src/scripts/index.ts',
    output: {
        dir: 'dist',
        format: 'es',
        sourcemap: !isProduction
    },
    external: [
        '../../../../extensions.js',
        '../../../../RossAscends-mods.js',
        '../../../../../script.js',
        '../../../../utils.js'
    ],
    plugins: [
        typescript()
    ]
};
