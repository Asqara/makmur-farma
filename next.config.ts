import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // pdfmake and pdfkit use __dirname-based file reads (data.trie, fonts).
  // Bundling them breaks the paths — keep them as runtime requires.
  serverExternalPackages: [
    "pdfmake",
    "pdfkit",
    "@foliojs-fork/fontkit",
    "@foliojs-fork/linebreak",
  ],
};

export default nextConfig;
