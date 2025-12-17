import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // For better deployment
  compress: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-*",
      "sonner",
      "date-fns",
      "recharts",
      "@hookform/resolvers",
      "clsx",
      "class-variance-authority",
      "tailwind-merge",
      "zod",
    ],
  },
  reactCompiler: true,
  turbopack: {},
  // Add bundle analyzer
  webpack: (config, { dev }) => {
    if (!dev) {
      config.optimization.splitChunks.cacheGroups.vendor = {
        test: /[\\/]node_modules[\\/]/,
        name: "vendors",
        chunks: "all",
      };
    }
    return config;
  },
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.0.0/16"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
