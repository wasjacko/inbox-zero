// @ts-check
import { serwist } from "@serwist/next/config";

// Built by `serwist build` after `next build` (see the build scripts).
// The service worker precaches only build assets and the neutral offline shell.
// Authenticated application data always remains network-only.
export default serwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
  // The webpack plugin this replaces never precached prerendered HTML.
  precachePrerendered: false,
});
