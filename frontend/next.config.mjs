/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // YEH IMPORTANT HAI - Static Export disable karo
  output: 'standalone',
  // Force dynamic rendering
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;