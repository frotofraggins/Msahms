import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export', // Static export for S3 + CloudFront deployment
  trailingSlash: true, // Produces /areas/mesa/index.html so S3 website hosting serves clean URLs
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
