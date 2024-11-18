/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/health",
        destination: "http://143.198.84.214:3000/health",
      },
      {
        source: "/api/servers/:id/metrics",
        destination: "http://143.198.84.214:3000/api/servers/:id/metrics",
      },
      {
        source: "/api/servers/:id/health",
        destination: "http://143.198.84.214:3000/api/servers/:id/health",
      },
      {
        source: "/api/servers/:id/processes",
        destination: "http://143.198.84.214:3000/api/servers/:id/processes",
      },
      {
        source: "/api/servers",
        destination: "http://143.198.84.214:3000/api/servers",
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
