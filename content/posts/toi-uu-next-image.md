---
title: "Tối ưu hiệu suất ảnh với Next.js"
description: "Checklist tối ưu Next/Image: định dạng, tối ưu hóa CDN, responsive layout và lazy load để boost Lighthouse."
date: 2024-11-12
tags: []
---

## 1. Chọn định dạng ảnh thông minh

- Ưu tiên AVIF/WebP cho ảnh minh họa, JPEG chất lượng 75+ cho ảnh người.
- Dùng `next/image` sẽ tự động tạo nhiều định dạng, nhưng phải bật `formats` trong `next.config.mjs`.

```js
// next.config.mjs
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
};
export default nextConfig;
```

## 2. Quản lý kích thước & layout

- Dùng `sizes` để trình duyệt biết độ rộng tối đa.
- Với layout responsive, kết hợp `fill` và container có `position: relative`.

```tsx
<div className="relative aspect-[16/9]">
  <Image
    src="/hero.png"
    alt="Demo"
    fill
    sizes="(max-width: 768px) 100vw, 768px"
    priority
  />
</div>
```

## 3. Lazy load & tính toán priority hợp lý

- `next/image` lazy load mặc định, chỉ set `loading="eager"` cho hero đầu trang.
- `priority` chỉ nên dùng cho 1-2 ảnh quan trọng; lạm dụng dễ nghẽn network.

## 4. Tận dụng CDN & cache

- Nếu host trên Vercel, `next/image` đã có CDN. Deploy tự host thì có thể bật `loader` tùy biến, ví dụ Cloudflare Image Resizing.
- Cache header nên đủ dài (7-30 ngày) vì Next thêm hash vào URL.

## 5. Theo dõi bằng Lighthouse & WebPageTest

1. Chạy Lighthouse trong DevTools, xem mục “Serve images in next-gen formats”.
2. Dùng WebPageTest với tốc độ mạng 3G để đảm bảo LCP < 2.5s.
3. Kết hợp `next/script` để defer script không cần thiết, giảm cạnh tranh bandwidth với ảnh.

## Checklist cuối cùng

- [ ] Bật AVIF/WebP trong `next.config.mjs`.
- [ ] Cài `sizes` và `priority` hợp lý cho mọi `<Image>`.
- [ ] Đảm bảo CDN hoặc loader backend hỗ trợ cache dài.
- [ ] Theo dõi LCP sau mỗi lần thêm ảnh mới.
