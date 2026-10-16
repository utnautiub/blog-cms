---
title: "Chuyển CRLF ↔ LF giữa Windows và Linux"
description: "Hướng dẫn chuẩn hóa newline bằng Git: chuyển đổi CRLF ↔ LF cho toàn bộ repo hoặc cục bộ."
date: 2024-11-17
tags: []
---

## Vì sao phải chuẩn hóa newline?

- Windows dùng cặp ký tự `CRLF` (`\r\n`), Linux/macOS dùng `LF` (`\n`).
- Khi cộng tác đa hệ điều hành, Git có thể tự động đổi newline dẫn tới diff ảo.
- Chuẩn hóa giúp tránh xung đột, CI chạy ổn định và tooling hoạt động nhất quán.

## Kiểm tra nhanh newline hiện tại

```bash
git ls-files -z | xargs -0 file | grep -E "CRLF|with CRLF line terminators"
```

hoặc mở file trong VS Code: góc dưới phải sẽ hiển thị `CRLF` / `LF`.

## Phần 1: Windows → Linux (CRLF sang LF)

### 1. Vô hiệu hóa chuyển đổi tự động

```bash
git config --global core.autocrlf false
git config --global core.eol lf
```

> Nếu chỉ áp dụng cho repo hiện tại thì thay `--global` bằng `--local`.

### 2. Làm sạch cache và áp newline mới

```bash
git rm --cached -r .
git reset --hard
```

<aside>
💡

- `git rm --cached -r .` xóa toàn bộ file khỏi index nhưng giữ nguyên trên disk.
- `git reset --hard` đưa lại file vào index với newline đúng theo cấu hình `core.eol`.
</aside>

### 3. Khóa theo từng loại file (khuyến nghị)

Thêm `.gitattributes`:

```gitattributes
*.sh text eol=lf
*.ts text eol=lf
*.md text eol=lf
```

Những file cần CRLF (ví dụ `.bat`) có thể thiết lập riêng:

```gitattributes
*.bat text eol=crlf
```

## Phần 2: Linux → Windows (LF sang CRLF)

Nếu dự án chạy trên Windows thuần (ví dụ batch script), làm ngược lại:

```bash
git config --global core.autocrlf true
git config --global core.eol crlf
```

Sau đó áp dụng lại quy trình cache:

```bash
git rm --cached -r .
git reset --hard
```

> `core.autocrlf true` khiến Git tự chuyển file text sang CRLF khi checkout, nhưng giữ LF trong repo. Chỉ bật nếu chắc chắn app cần CRLF lúc chạy.

## Checklist triển khai an toàn

1. Đảm bảo working tree sạch (`git status`).
2. Thiết lập `.gitattributes` trước để tránh người khác revert newline.
3. Chạy lệnh chuyển đổi trên branch riêng, kiểm tra diff chỉ chứa newline.
4. Thông báo cho team sau khi merge để họ `git pull --rebase` hoặc reclone nếu cần.

Chuẩn hóa newline ngay từ đầu giúp repo của bạn đồng nhất khi build trên Linux, chạy script trên Windows và tránh diff khó đọc trong tương lai.
