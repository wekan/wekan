# 01. Tổng Quan Hệ Thống

## Mục tiêu

Hệ thống này được thiết kế như một “phòng IT” thu nhỏ để vận hành dự án
theo vòng lặp rõ ràng, có vai trò, có trạng thái, có phản hồi và có bàn giao.

## Cấu trúc chính

| Thành phần | Vai trò | Đầu vào | Đầu ra |
|---|---|---|---|
| `.agent/` | Bộ quy ước vận hành | Yêu cầu dự án, nguyên tắc làm việc | Skill, rule, workflow, role |
| `.manager/` | Quản lý trạng thái task | Kết quả làm việc, quyết định PM | State file, báo cáo, lịch sử |
| `.feedback/` | Kênh phản hồi | Feedback từ Antigravity hoặc người dùng | Response, action plan, QA coverage |
| `refer/` | Tài liệu phân tích | Nội dung hệ thống hiện có | Hồ sơ phân tích, preview trình bày |

## Điểm hay

- Có ranh giới rõ giữa quy ước, trạng thái và phản hồi.
- Dễ mở rộng vì mỗi khu vực có nhiệm vụ riêng.
- PM nhìn được tiến độ mà không phải đọc toàn bộ hội thoại.
- Có thể đưa feedback vào luồng xử lý thay vì để rơi rụng.

## Kết luận ngắn

Đây là mô hình hợp cho dự án cần vận hành lâu dài, nhiều vòng lặp,
nhiều người chạm vào và cần giữ tính nhất quán cao.
