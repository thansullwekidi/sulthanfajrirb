/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/webp"],
    minimumCacheTTL: 31536000,
    deviceSizes: [440, 640, 828, 1200],
    imageSizes: [32, 48, 68, 96, 176, 220, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**"
      }
    ]
  },
  experimental: {
    serverActions: { bodySizeLimit: "4mb" }
  }
};

export default nextConfig;
