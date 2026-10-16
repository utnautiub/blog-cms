/** @type {import('next').NextConfig} */
const nextConfig = {
  // Giữ URL dạng /blog/slug/ như blog cũ để không mất SEO.
  trailingSlash: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "github.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
