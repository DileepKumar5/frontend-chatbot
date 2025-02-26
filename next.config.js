/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*', // This applies to all routes
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate', // Prevent caching
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
