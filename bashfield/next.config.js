// next.config.js
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Alias the missing module to our local shim
    config.resolve.alias["next-i18next/serverSideTranslations"] = path.resolve(
      __dirname,
      "lib/i18n-server.js"
    );
    return config;
  },
};

module.exports = nextConfig;
