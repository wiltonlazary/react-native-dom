import svelte from "rollup-plugin-svelte";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import babel from "rollup-plugin-babel";
import { terser } from "rollup-plugin-terser";

import pjson from "./package.json";

const production = !process.env.ROLLUP_WATCH;

const baseConfig = {
  input: "src/index.svelte",
  plugins: [
    svelte({
      // enable run-time checks when not in production
      dev: !production,
      customElement: true
    }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration —
    // consult the documentation for details:
    // https://github.com/rollup/rollup-plugin-commonjs
    resolve(),
    commonjs(),

    // If we're building for production (npm run build
    // instead of npm run dev), transpile and minify
    production &&
      babel({
        exclude: "node_modules/**",
        runtimeHelpers: true,
        presets: [
          [
            "module:metro-react-native-babel-preset",
            { disableImportExportTransform: true }
          ]
        ],
        plugins: ["@babel/transform-runtime"]
      }),
    production && terser()
  ]
};

const baseOutput = {
  sourcemap: true,
  name: "RNDomSwitch"
};

const entryPoints = ["main", "umd:main", "module"];

const formats = {
  main: "cjs",
  "umd:main": "umd",
  module: "es"
};

const createConfig = (format, file) => ({
  ...baseConfig,
  output: {
    ...baseOutput,
    format,
    file
  }
});

export default entryPoints
  .map((entry) => {
    const path = pjson[entry];
    if (path) {
      return createConfig(formats[entry], path);
    }
    return null;
  })
  .concat([createConfig("iife", "public/bundle.js")]);
