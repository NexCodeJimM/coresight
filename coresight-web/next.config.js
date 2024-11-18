/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://143.198.84.214:3000/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
