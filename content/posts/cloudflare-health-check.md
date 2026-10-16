---
title: "Giám sát uptime với Cloudflare Health Check"
description: "Thiết lập health check, alert và failover DNS trên Cloudflare để bảo đảm dịch vụ luôn sẵn sàng."
date: 2024-11-14
tags: []
---

## 1. Chuẩn bị endpoint health

- Tạo endpoint `/healthz` trả về HTTP 200, nội dung nhẹ.
- Kết hợp kiểm tra DB/queue nếu cần, nhưng giữ thời gian phản hồi < 200 ms.

```ts
export const GET = () => {
  return Response.json({ status: "ok" }, { status: 200 });
};
```

## 2. Tạo Health Check trong Cloudflare

1. Vào **Traffic → Health Checks → Create**.
2. Điền URL cần giám sát, interval 1 phút, timeout 5 giây.
3. Bật “Follow redirects” nếu endpoint trả 301/302.
4. Ghi chú team, tag dịch vụ để dễ lọc báo cáo.

## 3. Thiết lập Alert

- Trong **Notifications → Create**, chọn điều kiện “Health Check status equals Down”.
- Gửi qua email, Slack hoặc webhook (ví dụ Discord).
- Có thể đặt rule “báo lại sau 5 phút nếu vẫn Down”.

## 4. Failover với Load Balancer (tùy chọn)

- Tạo Load Balancer gồm hai origin: primary (Hà Nội), secondary (Singapore).
- Áp health check vừa tạo cho pool primary.
- Khi primary lỗi, Cloudflare tự chuyển lưu lượng sang secondary trong vài giây.

## 5. Quan sát & tối ưu

- Dùng tab **Analytics** trong Health Checks để xem tỉ lệ thất bại theo khu vực.
- Xuất dữ liệu ra `workers logs` hoặc Datadog qua webhook để lưu lịch sử dài hạn.
- Thực hiện chaos test: tắt service chính vài phút để xác nhận alert + failover hoạt động.

## Tóm lại

Bằng cách thêm endpoint health nhẹ, cấu hình Health Check + Alert và (tùy chọn) Load Balancer, bạn đã có lớp giám sát uptime ngay ở biên Cloudflare mà không cần dựng công cụ mới.
