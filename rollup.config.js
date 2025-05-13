import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser'; 

const input = 'src/timelog.js'; 
const outputName = 'mormotTimeLog';

export default [
  {
    input: input,
    output: {
      file: 'dist/mormot2-timelog.esm.js',
      format: 'es',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({ babelHelpers: 'bundled' }) ,
      terser()
    ]
  },

  {
    input: input,
    output: {
      file: 'dist/mormot2-timelog.umd.js',
      format: 'umd',
      name: outputName, 
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({ babelHelpers: 'bundled' }),
      terser()
    ]
  },

  {
    input: input,
    output: {
      file: 'dist/mormot2-timelog.umd.min.js',
      format: 'umd',
      name: outputName,
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({ babelHelpers: 'bundled' }),
      terser() 
    ]
  }
];