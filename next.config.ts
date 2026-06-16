import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // typedRoutes intentionally off until route groups exist (Phase 1+);
  // nav targets are placeholders during Phase 0.
};

export default nextConfig;
