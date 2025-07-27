/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    reactCompiler: true,
    optimizePackageImports: ['lucide-react'],
  },
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.0.0/16'],
}

export default nextConfig


