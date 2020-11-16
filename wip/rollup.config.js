import resolve from '@rollup/plugin-node-resolve';

export default {
    input: 'project/scripts/PFTween.js',
    output: {
        file: 'build/PFTween.js',
        format: 'es',
    },
    plugins: [resolve()]
};