import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Compression for smaller transfer sizes
  compress: true,

  // Optimize images (even though we don't have many, good practice)
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Experimental optimizations
  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
