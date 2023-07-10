/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  staticPageGenerationTimeout: 600,
  experimental: {
    appDir: true,
  },
};

module.exports = nextConfig;
