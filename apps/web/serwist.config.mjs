// @ts-check
import { serwist } from "@serwist/next/config";

// Built by `serwist build` after `next build` (see the build scripts).
// Only the neutral offline shell (declared in app/sw.ts) is precached.
// Downloading every route's chunks on installation competes with mail loading.
// Versioned build assets keep using the browser's normal HTTP cache on demand.
// Authenticated application data always remains network-only.
export default serwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  globPatterns: [],
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
  // The webpack plugin this replaces never precached prerendered HTML.
  precachePrerendered: false,
});
