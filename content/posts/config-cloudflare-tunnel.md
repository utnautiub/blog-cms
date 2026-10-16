---
title: "Config Cloudflare Tunnel"
description: "Từng bước cài đặt, cấu hình và vận hành Cloudflare Tunnel cho dự án nội bộ."
date: 2025-11-03
tags: []
---

## 0. Kích hoạt Cloudflare Tunnel (Zero Trust)

![Kích hoạt Cloudflare Tunnel trong Zero Trust](/uploads/config-cloudflare-tunnel/image.png)

## 1. Tải xuống công cụ

- Truy cập trang tải: [Downloads · Cloudflare One docs](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/)
- Chọn đúng nền tảng của bạn.

![Danh sách bản tải Cloudflared](/uploads/config-cloudflare-tunnel/image-1.png)

![Chọn phiên bản Cloudflared cho Windows](/uploads/config-cloudflare-tunnel/image-2.png)

## 2. Thiết lập biến môi trường

1. Đổi tên file `cloudflared-windows-amd64.exe` thành `cloudflared.exe`.
2. Di chuyển file vào `C:\Program Files\Cloudflare\cloudflared\cloudflared.exe`.
3. Thêm đường dẫn vào biến môi trường `PATH` của hệ thống:

```powershell
[Environment]::SetEnvironmentVariable(
  "PATH",
  $env:PATH + ";C:\Program Files\Cloudflare\cloudflared",
  [EnvironmentVariableTarget]::Machine
)
```

## 3. Kiểm tra cài đặt

```powershell
cloudflared --version
```

Ví dụ kết quả thành công:

```powershell
PS C:\WINDOWS\system32> cloudflared --version
cloudflared version 2025.10.1 (built 2025-10-30T14:56 UTC)
```

## 4. Đăng nhập và chọn domain

```powershell
cloudflared login
```

- Lệnh mở trình duyệt để đăng nhập và chọn domain.
- Sau bước này, Cloudflare sinh file `cert.pem` tại `C:\Users\<username>\.cloudflared`.

![Chọn domain trong bước đăng nhập](/uploads/config-cloudflare-tunnel/image-3.png)

![File cert.pem và credential được sinh ra](/uploads/config-cloudflare-tunnel/image-4.png)

Tạo thêm file `config.yml` với nội dung mẫu:

```yaml
tunnel: <tunnel-id>
credentials-file: C:\Users\buituantu\.cloudflared\<tunnel-id>.json

ingress:
  # Backend API (.NET)
  - hostname: api.tinhnguyenvien.io.vn
    service: http://localhost:5000

  # Frontend (Angular)
  - hostname: tinhnguyenvien.io.vn
    service: http://localhost:4200

  # Mặc định:
  - service: http_status:404
```

> Ghi chú: `tunnel-id` sẽ được tạo ở bước tiếp theo và cần điền vào cả `tunnel` lẫn `credentials-file`.

## 5. Tạo tunnel

```powershell
cloudflared tunnel create <TEN_TUNNEL>
```

Ví dụ:

```powershell
cloudflared tunnel create buituantu-tunnel
```

Kết quả mẫu:

```powershell
PS C:\WINDOWS\system32> cloudflared tunnel create buituantu-tunnel
Tunnel credentials written to C:\Users\buituantu\.cloudflared\0bde6ece-b2a0-4f38-be68-6901ed2cfbde.json. cloudflared chose this file based on where your origin certificate was found. Keep this file secret. To revoke these credentials, delete the tunnel.

Created tunnel buituantu-tunnel with id 0bde6ece-b2a0-4f38-be68-6901ed2cfbde
```

Sau khi nhận `tunnel-id`, cập nhật lại file `config.yml`.

## 6. Gắn domain vào tunnel

```powershell
cloudflared tunnel route dns <TEN_TUNNEL> <DOMAIN>
```

Nếu trong `config.yml` có hai domain `api.tinhnguyenvien.io.vn` và `tinhnguyenvien.io.vn`, chạy hai lệnh:

```powershell
cloudflared tunnel route dns tinhnguyenvien-tunnel tinhnguyenvien.io.vn
cloudflared tunnel route dns tinhnguyenvien-tunnel api.tinhnguyenvien.io.vn
```

Cloudflare sẽ trả về thông báo `Added CNAME ...` khi thành công.

## 7. Khởi chạy code và tunnel

- Đảm bảo ứng dụng backend/frontend đang chạy đúng cổng đã khai báo trong `config.yml` (ví dụ 5000 và 4200).
- Sau đó chạy:

```powershell
cloudflared tunnel run tinhnguyenvien-tunnel
```

> Lưu ý: Khi triển khai, hãy cập nhật cấu hình frontend để gọi đúng endpoint backend trên domain public. Nếu frontend vẫn trỏ về `localhost`, người dùng bên ngoài sẽ không gọi được API.

## 8. Các lệnh hữu ích khác

- **Kiểm tra thông tin tunnel**

  ```powershell
  cloudflared tunnel info <TEN_TUNNEL>
  ```

- **Liệt kê toàn bộ tunnel**

  ```powershell
  cloudflared tunnel list
  ```

- **Xóa tunnel (đồng thời xóa file .json)**

  ```powershell
  cloudflared tunnel delete <TEN_TUNNEL>
  ```

- **Cài đặt tunnel chạy như service**

  ```powershell
  cloudflared service install
  ```

- **Cập nhật và kiểm tra phiên bản**

  ```powershell
  cloudflared update
  cloudflared --version
  ```

- **Kiểm tra kết nối DNS**

  ```powershell
  nslookup tinhnguyenvien.io.vn
  ```

- **Xóa cấu hình/credential cũ**

  ```powershell
  rd /s /q "C:\Users\<user>\.cloudflared"
  ```

- **Test nhanh một domain mà không cần tạo tunnel**

  ```powershell
  cloudflared tunnel --url http://localhost:4200
  ```

Chỉ với chuỗi bước trên, bạn đã có thể dựng Cloudflare Tunnel, ánh xạ domain và chia sẻ môi trường nội bộ ra internet một cách an toàn.
