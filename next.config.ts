import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: [
    "@prisma/adapter-pg",
    "pg",
    "better-auth",
    "@electric-sql/pglite",
  ],
};

export default nextConfig;
