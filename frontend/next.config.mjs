/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // IMPORTANT: Static generation disable
  output: 'standalone',
  
  // Force dynamic for all
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  
  // Cache control
  headers: async () => {
    return [
      {
        source: '/my-parts',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;