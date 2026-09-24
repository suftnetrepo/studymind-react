import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives inside the package repo, which has its own lockfile — pin the root
  // so Turbopack doesn't infer the repo root. @studymind/react is installed as a copy
  // (see .npmrc), so nothing needs resolving outside this directory.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
