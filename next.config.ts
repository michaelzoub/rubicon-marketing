import type { NextConfig } from "next";
import path from "node:path";

const mintlifySubdomain = process.env.MINTLIFY_SUBDOMAIN?.trim();

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async redirects() {
    if (process.env.NODE_ENV !== "development" || mintlifySubdomain) return [];
    return [
      { source: "/docs", destination: "http://localhost:3002", permanent: false },
      { source: "/docs/:path*", destination: "http://localhost:3002/:path*", permanent: false },
    ];
  },
  async rewrites() {
    if (!mintlifySubdomain) return [];

    const docsOrigin = `https://${mintlifySubdomain}.mintlify.dev`;
    return {
      beforeFiles: [
        { source: "/docs", destination: `${docsOrigin}/docs` },
        { source: "/docs/:path*", destination: `${docsOrigin}/docs/:path*` },
        { source: "/mintlify-assets/:path*", destination: `${docsOrigin}/mintlify-assets/:path*` },
        { source: "/_mintlify/:path*", destination: `${docsOrigin}/_mintlify/:path*` },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
