const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000/";

// Site Configuration (luôn kết thúc bằng dấu "/")
export const SITE_URL = rawUrl.endsWith("/") ? rawUrl : `${rawUrl}/`;
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Nhật ký";
export const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  "Chia sẻ những điều mình học được mỗi ngày.";

// Author Information
export const AUTHOR_NAME = process.env.NEXT_PUBLIC_AUTHOR_NAME || "Tên của bạn";
export const AUTHOR_EMAIL =
  process.env.NEXT_PUBLIC_AUTHOR_EMAIL || "your.email@example.com";
export const AUTHOR_IMAGE_URL = process.env.NEXT_PUBLIC_AUTHOR_IMAGE_URL || "";

// Social Links
export const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL || "";
export const LINKEDIN_URL = process.env.NEXT_PUBLIC_LINKEDIN_URL || "";
export const TWITTER_HANDLE = process.env.NEXT_PUBLIC_TWITTER_HANDLE || "";

// Copyright
export const COPYRIGHT_YEAR = process.env.NEXT_PUBLIC_COPYRIGHT_YEAR || "2025";
