# Blog + trang soạn bài Markdown

Blog Next.js giao diện theo phong cách chanhdai.com (Geist, đường kẻ screen-line, dải sọc chéo, command menu ⌘K, sáng/tối, mục lục, nút copy code) kèm **trang `/admin` để soạn bài Markdown và đăng ngay trên web**, không cần sửa code hay `git push` thủ công.

## Cách hoạt động

- Mỗi bài là một file Markdown: `content/posts/<slug>.md` (frontmatter: `title`, `description`, `date`, `tags`, `draft`).
- Ảnh nằm trong `public/uploads/`.
- `/admin` đăng nhập bằng mật khẩu → soạn bài → **Đăng bài**. Trình soạn kiểu Notion: viết trực tiếp, gõ `/` để chèn khối (tiêu đề, danh sách, code, bảng, ảnh, callout…), bôi đen chữ để định dạng, kéo tay nắm ⋮⋮ để đổi vị trí khối, dán/kéo ảnh vào. Có chế độ **Markdown** nếu muốn gõ mã thô. Ctrl+S để lưu.
  - **Chạy local**: file được ghi thẳng vào thư mục `content/posts`.
  - **Chạy trên Vercel**: bài được commit vào repo GitHub qua API, Vercel tự deploy lại (~1 phút là lên site).

## Chạy thử trên máy

```bash
npm install
cp .env.example .env.local   # sửa ADMIN_PASSWORD, SESSION_SECRET; để trống GITHUB_*
npm run dev
```

Mở http://localhost:3000/admin/ để soạn bài.

## Triển khai trên Vercel

1. Push project lên GitHub, import vào Vercel.
2. Tạo GitHub token: Settings → Developer settings → Fine-grained tokens → chọn đúng repo blog → quyền **Contents: Read and write**.
3. Trong Vercel → Settings → Environment Variables, thêm:

| Biến | Giá trị |
| --- | --- |
| `ADMIN_PASSWORD` | mật khẩu vào /admin |
| `SESSION_SECRET` | chuỗi ngẫu nhiên dài |
| `GITHUB_TOKEN` | token ở bước 2 |
| `GITHUB_REPO` | `ten-ban/ten-repo` |
| `GITHUB_BRANCH` | `main` (nhánh Vercel đang deploy) |
| `NEXT_PUBLIC_*` | thông tin site, xem `.env.example` |

4. Redeploy. Vào `https://domain-cua-ban/admin/` là viết được.

## Lưu ý

- Ảnh tối đa 4MB/ảnh (giới hạn body của Vercel).
- Bài **Nháp** không hiện ở site, RSS, sitemap.
- Đổi slug khi sửa bài sẽ đổi URL (file cũ bị xoá).
- Trong Markdown có thể chèn HTML thô, và `// [!code highlight]` ở cuối dòng code để tô sáng dòng đó.
- Có thể sửa bài trực tiếp bằng file `.md` như thường, `/admin` và file luôn đồng bộ vì cùng một nguồn.
