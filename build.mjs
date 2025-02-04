import * as esbuild from "esbuild"

await esbuild.build({
  entryPoints: ["src/index.ts"],
  outdir: "dist",
  bundle: true,
  minify: true,
  format: "cjs",
  platform: "node",
  external: ["@node-rs/argon2"],
})
