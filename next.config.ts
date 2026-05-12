import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    // Allow preview panel cross-origin requests from sandbox
    "preview-chat-ecc789cc-74a2-44f0-94cf-27ff15321fcd.space-z.ai",
    ".space-z.ai",
    ".chatglm.cn",
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
  ],
};

export default nextConfig;
