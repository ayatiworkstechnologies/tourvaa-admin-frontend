// CommonJS, not ESM: Turbopack on Windows crashes evaluating an ESM postcss
// config (spawns a Node subprocess and passes the absolute config path
// without wrapping it as a file:// URL, which Node's ESM loader requires -
// a known, unresolved upstream bug: vercel/next.js#63924). require()
// doesn't hit that code path, so this sidesteps it entirely.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

module.exports = config;
