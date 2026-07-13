import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Compression for smaller transfer sizes
  compress: true,

  // Enable PWA features
  output: "standalone",

  // Optimize images
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Experimental optimizations
  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: ["lucide-react"],
  },

  // Security headers for enhanced protection
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
        ],
      },
    ];
  },

  // Additional security and performance settings
  poweredByHeader: false,

  // Enable modern image formats
  images: {
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;