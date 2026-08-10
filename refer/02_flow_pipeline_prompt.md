# 02. Flow, Pipeline, Prompt

## 1) Flow tổng thể

1. Nhận yêu cầu.
2. PM đọc và chuẩn hóa task.
3. Chọn skill và rule phù hợp.
4. Chia nhỏ nếu task lớn.
5. Triển khai thay đổi.
6. Kiểm thử và review.
7. Ghi feedback.
8. Tổng kết và bàn giao.

## 2) Pipeline vận hành

| Giai đoạn | Mục đích | Đầu vào | Đầu ra |
|---|---|---|---|
| Intake | Hiểu task | Mô tả người dùng | `requirements.md` |
| Planning | Chia việc | Yêu cầu + ràng buộc | `current_task.md`, `implementation.md` |
| Split | Giảm độ phức tạp | Task lớn, file dài | Module/file nhỏ hơn |
| Implementation | Sửa đúng phần cần sửa | Kế hoạch, code hiện có | Diff, notes |
| QA | Xác nhận đúng | Code đã sửa | `test-report.md` |
| UX Review | Soi trải nghiệm | Giao diện/chức năng | `ux-feedback.md` |
| Feedback Loop | Đóng vòng lặp | Feedback mới | `responses.md`, `action-plan.md` |
| Handoff | Bàn giao | Tất cả state | `final_report.md` |

## 3) Prompt khung

Prompt vận hành nên đi theo 4 lớp:

| Lớp | Nội dung |
|---|---|
| Vai trò | AI đang là Dev, PM, Tester hay Reviewer |
| Mục tiêu | Task muốn đạt điều gì |
| Ràng buộc | Không phá dữ liệu cũ, không ghi đè, không vượt phạm vi |
| Đầu ra | File nào cần tạo, format nào cần giữ |

## 4) Điểm hay của prompt

- Có bối cảnh rõ nên agent ít đoán mò.
- Có vai trò rõ nên trách nhiệm không chồng chéo.
- Có đầu ra chuẩn nên dễ tự động hóa.
- Có rule split file nên tránh tràn context khi dự án lớn.

## 5) Lưu ý

- Prompt càng cụ thể thì kết quả càng ổn định.
- Nếu task mơ hồ, nên ép ra câu hỏi làm rõ trước khi sửa.
- Nếu task lớn, phải chia pipeline thành nhiều bước nhỏ.
