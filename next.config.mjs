/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable CDN for static assets
  assetPrefix: process.env.CDN_URL || '',
  
  // Optimize images for CDN delivery
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Enable compression
  compress: true,
  
  // Enable SWC minification
  swcMinify: true,
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|avif|ico|woff|woff2)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Rewrites for API load balancing
  async rewrites() {
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
