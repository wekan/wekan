# 04. Đầu Vào, Đầu Ra

## Bảng tổng hợp

| Thành phần | Đầu vào | Đầu ra | Ghi chú |
|---|---|---|---|
| PM | Task, ưu tiên, blocker | `current_task.md`, `final_report.md` | Đầu tàu của dự án |
| Dev/Agent | Yêu cầu, code hiện có, rule | Diff, notes, file mới | Phải giữ phạm vi gọn |
| Tester | Build, feature cần kiểm tra | `test-report.md` | Có pass/fail rõ ràng |
| UX Reviewer | Giao diện, luồng sử dụng | `ux-feedback.md` | Tập trung cảm nhận thật |
| Feedback channel | Phản hồi từ ngoài vào | `responses.md`, `action-plan.md` | Không để rơi mất |

## Input chi tiết

| Loại input | Ví dụ | Mục đích |
|---|---|---|
| Mô tả task | “Tạo workflow quản lý feedback” | Xác định yêu cầu |
| Ràng buộc | “Không ghi đè dữ liệu cũ” | Giữ an toàn thông tin |
| Log/Context | Lỗi, screenshot, note | Tìm nguyên nhân |
| Review khách hàng | UI có khó dùng không | Đánh giá trải nghiệm |

## Output chi tiết

| Loại output | Nội dung |
|---|---|
| Tài liệu | Markdown phân tích, state file |
| Kế hoạch | Task list, priority, ETA |
| Kết quả | Diff, report, quyết định |
| Bàn giao | Summary cuối, next step |

## Điểm hay

- Input và output đều có chỗ lưu rõ ràng.
- Dễ audit lại ai đã làm gì, làm khi nào.
- Hợp cho team nhiều vai trò và nhiều vòng review.
