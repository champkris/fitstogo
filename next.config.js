/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.lazada.co.th',
      },
      {
        protocol: 'https',
        hostname: '*.shopee.co.th',
      },
      {
        protocol: 'https',
        hostname: '*.digitaloceanspaces.com',
      },
      {
        protocol: 'https',
        hostname: 'cf.shopee.co.th',
      },
      {
        protocol: 'https',
        hostname: 'tempfile.aiquickdraw.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
