import type { NextConfig } from "next";
import path from "node:path";

const mintlifySubdomain = process.env.MINTLIFY_SUBDOMAIN?.trim();

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async redirects() {
    if (process.env.NODE_ENV !== "development" || mintlifySubdomain) return [];
    return [
      { source: "/docs", destination: "http://localhost:3002", permanent: false },
      {
        source: "/docs/:path((?!onboarding-for-agents\\.md$).*)",
        destination: "http://localhost:3002/:path",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    // Raw markdown for agents; must win over the Mintlify /docs proxy below.
    const agentGuide = {
      source: "/docs/onboarding-for-agents.md",
      destination: "/agent-docs/onboarding-for-agents.md",
    };
    if (!mintlifySubdomain) return { beforeFiles: [agentGuide], afterFiles: [], fallback: [] };

    const docsOrigin = `https://${mintlifySubdomain}.mintlify.dev`;
    return {
      beforeFiles: [
        agentGuide,
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
