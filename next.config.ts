import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
        source: "/:path*",
      },
    ];
  },
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
