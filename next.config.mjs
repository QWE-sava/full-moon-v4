/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Workers will serve the API, so we might need rewrites if testing locally
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8787/api/:path*', // Proxy to local Wrangler for dev
      },
    ];
  },
};

export default nextConfig;
