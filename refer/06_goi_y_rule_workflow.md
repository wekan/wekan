# 06. Gợi Ý Rule Và Workflow Thông Dụng

## Rule thông dụng nên có thêm

| Rule | Công dụng |
|---|---|
| `Single Responsibility` | Mỗi file chỉ làm một việc chính |
| `No Silent Change` | Không âm thầm đổi logic quan trọng |
| `Trace Every Decision` | Quyết định nào cũng có ghi chú |
| `Verify Before Merge` | Kiểm tra trước khi chốt |
| `Keep Notes Short` | Ghi chú ngắn, dễ đọc |
| `Ask When Blocked` | Tắc thì hỏi ngay, không đoán bừa |

## Workflow thông dụng nên có thêm

| Workflow | Khi dùng | Đầu ra |
|---|---|---|
| Intake -> Clarify -> Plan | Khi task còn mơ hồ | Yêu cầu rõ hơn |
| Split -> Implement -> Verify | Khi task lớn | Diff an toàn hơn |
| Review -> Feedback -> Action | Khi có review từ khách hàng | Kế hoạch xử lý |
| QA -> Fix -> Recheck | Khi bug phát sinh | Kết quả ổn định hơn |
| Handoff -> Archive | Khi task xong | Báo cáo cuối |

## Kết luận

- Rule giúp giữ kỷ luật vận hành.
- Workflow giúp biến kỷ luật thành nhịp làm việc đều.
- Hai phần này càng rõ thì dự án càng dễ scale.
