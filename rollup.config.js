import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import sass from "rollup-plugin-sass";
import manifest from "rollup-plugin-output-manifest";
import clear from "rollup-plugin-clear";
import { writeFileSync, mkdirSync } from "fs";
import { env } from "process";
import { terser } from "rollup-plugin-terser";
import crypto from "crypto";

const sha256 = str => crypto.createHash("sha256").update(str);
const mode = env.NODE_ENV || "development";
const origin = mode === "development" ? "/" : "//skalt.github.io/";
const outputDir = "assets/dist/";
const publicPath = `${origin}${outputDir}`;
const manifestSeed = {};

export default {
  input: ["assets/src/toggle_project_toc.js"],
  output: {
    entryFileNames: "[name]-[hash].js",
    format: "esm",
    dir: outputDir,
    manualChunks(id) {
      console.log({ id });
      // from https://philipwalton.com/articles/using-native-javascript-modules-in-production-today/
      if (id.includes("node_modules")) {
        // Return the directory name following the last `node_modules` Usually
        // this is the package, but it could also be the scope.
        const dirs = id.split(path.sep);
        return dirs[dirs.lastIndexOf("node_modules") + 1];
      }
    }
  },
  plugins: [
    clear({
      targets: [outputDir],
      watch: true
    }),
    resolve(),
    commonjs(),
    sass({
      output: styles => {
        const hashB64 = sha256(styles).digest("base64");
        const hashHex = sha256(styles).digest("hex");
        const file = `styles-${hashHex.substring(0, 8)}.css`;
        mkdirSync(outputDir, { recursive: true });
        writeFileSync(`${outputDir}/${file}`, styles);
        manifestSeed["styles.css"] = {
          path: `${publicPath}/${file}`,
          integrity: `sha256-${hashB64}`
        };
      },
      // `output: true` should output a bunch of split `.css` files in dist, but
      // it doesn't. In any case, it's a great excuse to roll our own integrity
      // hash, and use that in the filename.
      options: {
        // for https://github.com/sass/dart-sass#javascript-api
        outputStyle: "compressed"
      }
    }),
    manifest({
      outputPath: "_data",
      fileName: "manifest.json",
      publicPath,
      generate: keyValueDecorator => chunks =>
        chunks.reduce((manifest, entry) => {
          const { name, fileName, code } = entry;
          const hash = sha256(code).digest("base64");
          const [[_name, path]] = Object.entries(
            keyValueDecorator(name, fileName)
          );
          return {
            ...manifest,
            ...{ [_name]: { path, integrity: `sha256-${hash}` } }
          };
        }, manifestSeed)
    }),
    terser()
  ]
};
