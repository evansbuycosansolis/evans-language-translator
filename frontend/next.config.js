/** @type {import('next').NextConfig} */
const extraAllowedDevOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    "192.168.56.1",
    ...extraAllowedDevOrigins,
  ],
};

module.exports = nextConfig;
