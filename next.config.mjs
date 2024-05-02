/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    output: 'export', // This enables static export of your Next.js project
    images: {
      domains: ['firebasestorage.googleapis.com'],
    },
  };
module.exports=nextConfig;