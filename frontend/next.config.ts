import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // The app is opened through this local-network address during development.
  // Allow Next's development client to reconnect for HMR after source changes.
  allowedDevOrigins: ["192.168.100.1"],
  async redirects() {
    return [
      {
        source: "/tooling-progress",
        destination: "/converting/tooling-progress",
        permanent: false,
      },
      {
        source: "/rubber-order-setting",
        destination: "/converting/rubber-order-setting",
        permanent: false,
      },
      {
        source: "/material-request",
        destination: "/converting/material-request",
        permanent: false,
      },
      {
        source: "/sample",
        destination: "/converting/sample",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
