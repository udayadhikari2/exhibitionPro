/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['bcryptjs', 'mongoose', 'qrcode'],
};


export default nextConfig;
