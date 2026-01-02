/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  // YEH IMPORTANT HAI
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;