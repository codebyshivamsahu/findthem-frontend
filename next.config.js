/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost', 'via.placeholder.com', 'ui-avatars.com'],
  },
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

module.exports = nextConfig;