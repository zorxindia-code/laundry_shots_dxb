import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [
      {
        // Unversioned static images (logo, product PNGs, scene JPGs): cache for
        // a day, then revalidate in the background. Not immutable — the files
        // can be replaced under the same name. Also sets the floor for their
        // optimised /_next/image variants.
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      {
        // Journey frames: always requested with a content version (`?v=<hash of
        // the frame manifest>`, see LaundryFrameSequence), so a regenerated
        // sequence gets new URLs — safe to cache as immutable for a year.
        // Listed last so it overrides the rule above for these files.
        source: "/images/laundry-frames/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Optimised frame variants: requested with `?v=<content hash of the
        // variant>` (src/config/video-frames-optimized.ts) — immutable.
        source: "/images/laundry-frames-optimized/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  turbopack: {
    // Pin the workspace root to this project so lockfiles in parent
    // directories are never picked up.
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
