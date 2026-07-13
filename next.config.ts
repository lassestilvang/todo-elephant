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

  // Production router middleware for custom logging
  productionRouterMiddleware: [
    (req, { fetch }) => {
      // Custom logging middleware
      require('@monosnap/cli').middleware({
        name: "todo-elephant",
        types: "request_lambda",
        handler: async (req) => {
          console.log(`Request: ${req.url}`);
          return fetch(req);
        }
      });
    },
  ],
};

export default nextConfig;