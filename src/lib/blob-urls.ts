/**
 * Ảnh vừa upload (đường dẫn /uploads/... -> blob URL tạm trong trình duyệt).
 * Trên Vercel, ảnh chỉ có mặt trên site sau khi deploy xong (~1 phút),
 * nên trong lúc soạn ta hiển thị bản tạm để thấy ảnh ngay.
 */
export const blobUrls: Record<string, string> = {};
