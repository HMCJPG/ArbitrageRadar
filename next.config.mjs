/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint is run separately in CI; never let a stylistic lint rule break a
  // production deploy on Vercel. Type-checking remains fully enabled below.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Keep strict type-checking on during builds — real type errors should fail.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
