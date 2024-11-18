/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/servers",
        destination: "http://143.198.84.214:3000/api/servers",
      },
      {
        source: "/api/servers/:id/health",
        destination: "http://143.198.84.214:3000/api/servers/:id/health",
      },
      {
        source: "/api/:path*",
        destination: "http://143.198.84.214:3000/api/:path*",
      },
    ];
  },
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
