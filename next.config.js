/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Disable TypeScript checks during production build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable ESLint during production build
    ignoreDuringBuilds: true,
  },
  // Silence warnings for WalletConnect
  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  images: {
    remotePatterns: [
      {
        hostname: "**",
      },
    ],
  },
  // Exclude test pages from the build
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  async redirects() {
    return [
      {
        source: '/balances-test',
        destination: '/',
        permanent: false,
      },
      {
        source: '/graphql-test',
        destination: '/',
        permanent: false,
      },
      {
        source: '/rewards-test',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig; 