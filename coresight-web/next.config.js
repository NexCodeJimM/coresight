/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost", "143.198.84.214"],
  },
  experimental: {
    // Remove serverActions since it's now enabled by default
  },
};

module.exports = nextConfig;
