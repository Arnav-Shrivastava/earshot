import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  transpilePackages: ["@earshot/core", "@earshot/db"],
  reactStrictMode: true,
};

export default config;
