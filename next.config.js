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
  // Silence warnings for WalletConnect and fix Wagmi worker issues
  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
  webpack: (config, { isServer }) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    // Resolve fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // Temporarily disable minification to fix HeartbeatWorker issue
    config.optimization.minimize = false;
    
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