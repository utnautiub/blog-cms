---
title: "Học Docker trong 7 ngày"
description: "Lộ trình thực hành giúp bạn làm chủ Docker từ cơ bản đến triển khai thực tế."
date: 2024-09-10
tags: []
---

## Vì sao nên học Docker?

Docker giúp bạn đóng gói ứng dụng cùng toàn bộ môi trường, bảo đảm chạy giống nhau từ máy dev tới production. Khi làm việc nhóm, chỉ cần gửi một câu lệnh `docker compose up`, tất cả cùng chung nền tảng.

## Lộ trình 7 ngày

| Ngày | Chủ đề | Ghi chú |
| --- | --- | --- |
| 1 | Khái niệm Container & Images | So sánh với VM, giải thích layered filesystem |
| 2 | Docker CLI cơ bản | `docker run`, `docker ps`, `docker logs`, volume |
| 3 | Tạo Dockerfile | Viết Dockerfile cho ứng dụng Node.js đơn giản |
| 4 | Docker Compose | Dựng ứng dụng gồm web + database |
| 5 | Debug & tối ưu | Multi-stage build, slim images, lint Dockerfile |
| 6 | Triển khai | Đưa image lên Docker Hub & chạy trên VPS |
| 7 | Automation | Kết hợp CI/CD (GitHub Actions) để build & push tự động |

## Viết Dockerfile đầu tiên

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "start"]
```

- **FROM**: chọn base image nhỏ gọn, ưu tiên Alpine.
- **RUN npm ci**: cài đặt sạch, đảm bảo tái lập môi trường.
- **CMD**: câu lệnh mặc định khi container khởi động.

## Docker Compose và database

```yaml
version: "3.9"
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/app
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    volumes:
      - db-data:/var/lib/postgresql/data

volumes:
  db-data:
```

- `depends_on` đảm bảo PostgreSQL chạy trước web.
- Sử dụng volume `db-data` để lưu dữ liệu bền vững.

## Tips tối ưu Image

1. **Multi-stage build**: dùng một stage để build, stage khác để runtime.
2. **.dockerignore**: tránh copy node_modules hoặc file log.
3. **Scan bảo mật**: kết hợp `docker scout` hoặc Trivy vào CI/CD.

## Thử sức với bài tập nhỏ

1. Đóng gói ứng dụng Next.js với Dockerfile multi-stage.
2. Dùng Compose để chạy web + Redis cache + pgvector.
3. Tạo workflow GitHub Actions: build image, push, deploy lên server.

Chỉ cần áp dụng lộ trình trên, sau một tuần bạn đã tự tin đưa sản phẩm lên mọi môi trường với Docker!
