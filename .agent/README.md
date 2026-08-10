# .agent

Mục tiêu của thư mục này là giữ bộ quy ước vận hành dự án ở một nơi thống nhất:
vai trò, kỹ năng, rule, workflow và cách chia nhỏ công việc để agent làm việc
ổn định, dễ bảo trì và dễ bàn giao.

## Cấu trúc

- `skills/` - các năng lực lõi mà agent có thể dùng trong dự án.
- `rules/` - quy tắc vận hành bắt buộc và khuyến nghị.
- `workflows/` - luồng làm việc chuẩn theo vòng đời task.
- `roles/` - vai trò đầu dự án và vai trò đánh giá từ góc nhìn khách hàng.

## Vai trò chính

- `Project Manager` là người đứng đầu dự án, chịu trách nhiệm ưu tiên, điều phối
  task, xác nhận phạm vi và tổng hợp trạng thái.
- `Customer Reviewer` đại diện góc nhìn khách hàng, tập trung đánh giá giao diện,
  tính dễ dùng, và mức độ đúng chức năng.

## Cách vận hành

1. Đọc rule trước khi làm việc.
2. Chọn skill và workflow phù hợp với task.
3. Cập nhật state vào `.manager/`.
4. Nếu có phản hồi, đẩy vào `.feedback/` theo luồng inbox -> response ->
   action plan.
