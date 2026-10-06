import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // The app is opened through this local-network address during development.
  // Allow Next's development client to reconnect for HMR after source changes.
  allowedDevOrigins: ["192.168.100.1"],
};

export default nextConfig;
