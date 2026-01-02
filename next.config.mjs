/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Disable ESLint during build to fix missing package error
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Enable static export if needed
  output: 'standalone',
  
  // Configure images if you're using next/image
  images: {
    unoptimized: true, // For static export compatibility
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'auto-spare-parts.onrender.com',
        pathname: '/**',
      },
    ],
  },
  
  // Allow CORS for API requests
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  
  // If you're facing dynamic rendering issues
  experimental: {
    // serverActions: true, // Uncomment if using server actions
  }
};

export default nextConfig;