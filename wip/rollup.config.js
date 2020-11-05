import resolve from '@rollup/plugin-node-resolve';
// import { terser } from 'rollup-plugin-terser';

export default {
    input: 'project/scripts/PFTween.js',
    output: {
        file: 'build/PFTween.js',
        format: 'es',
        plugins: [
            // terser({ output: { comments: false, }, keep_classnames:true, keep_fnames:true})
        ]
    },
    plugins: [resolve()]
};