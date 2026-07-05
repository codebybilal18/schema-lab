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
    "nodemailer",
  ],
  // The SQL sandbox loads PGlite (and its separate .wasm/.data assets) inside an
  // eval'd worker thread, which the file tracer cannot follow. Force the whole
  // package into the serverless function bundle so it exists at runtime.
  outputFileTracingIncludes: {
    "/**": [
      // Whole package dir, not just dist/: Node needs package.json to resolve
      // the bare specifier. Both the symlink path and the real pnpm store path
      // so the package exists and is resolvable from /var/task at runtime.
      "./node_modules/@electric-sql/pglite/**",
      "./node_modules/.pnpm/@electric-sql+pglite@*/node_modules/@electric-sql/pglite/**",
    ],
  },
};

export default nextConfig;
