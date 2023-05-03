/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  staticPageGenerationTimeout: 300,
  experimental: {
    appDir: true,
  },
};

module.exports = nextConfig;
