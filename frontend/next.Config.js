/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  webpack: (config, { dev, isServer }) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });

    // Suppress VRM colorSpace warnings in development
    if (dev && !isServer) {
      config.ignoreWarnings = [
        { module: /three-vrm/ },
        /colorSpace/,
      ];
    }

    return config;
  },
}

module.exports = nextConfig