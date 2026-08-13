# Bài 24 - SLOs và Operational Readiness

Trạng thái bài làm: đã hoàn thành playbook để team định nghĩa SLO, đọc error
budget và kiểm operational readiness trước khi launch hoặc mở rộng tính năng.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 23. Incident response giúp team phản ứng và học sau
sự cố. Bước tiếp theo là chủ động đặt mục tiêu reliability: user-facing signal
nào quan trọng, mức tin cậy nào đủ tốt, khi nào reliability work phải thắng
feature work và checklist nào cần pass trước khi launch.

Kết quả cuối cùng của bài là:

- Reliability signals.
- SLI/SLO definitions.
- Error budget rules.
- Operational readiness checklist.
- Launch readiness decision.
- Reliability backlog.
- Sample SLO board.

## 2. Bối cảnh

Team Scrum nhỏ thường nói "ổn định hơn" nhưng không định nghĩa được ổn định là
gì:

- uptime cao nhưng checkout vẫn lỗi;
- latency tăng nhưng chưa ai biết user đã khó chịu;
- incident lặp lại nhưng không có reliability target;
- launch tính năng mới mà monitoring/support/runbook chưa sẵn;
- feature work luôn thắng reliability work vì reliability không có số đo;
- error budget burn không được dùng để quyết định backlog.

Bài này giúp team kết nối reliability với outcome mà user thật sự cảm nhận.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- chọn reliability signals gắn với user journey quan trọng;
- định nghĩa SLI và SLO bằng ngôn ngữ đơn giản;
- đọc error budget để quyết định mức rủi ro còn lại;
- kiểm readiness trước launch hoặc rollout;
- quyết định go/hold bằng evidence;
- tạo reliability backlog từ incident, SLO miss và readiness gap.

## 4. Reliability signals

| Signal | User impact | Ví dụ đo |
| --- | --- | --- |
| Availability | User có dùng được flow chính không? | Success rate của login/checkout. |
| Latency | User có chờ quá lâu không? | P95 response time. |
| Correctness | Kết quả có đúng không? | Order/payment mismatch rate. |
| Freshness | Data có cập nhật đúng lúc không? | Sync delay hoặc stale data age. |

Signal rule:

- Chọn signal theo user journey, không theo metric dễ lấy nhất.
- Một product nhỏ nên bắt đầu với 1-3 signal quan trọng.
- Signal tốt phải giúp team ra quyết định backlog hoặc launch.

## 5. SLI/SLO definitions

| Khái niệm | Cách hiểu | Ví dụ |
| --- | --- | --- |
| SLI | Chỉ số đo reliability. | 99.5% checkout requests thành công. |
| SLO | Mục tiêu team cam kết theo thời gian. | Checkout success >= 99.5% mỗi 30 ngày. |
| Error budget | Phần lỗi còn cho phép trước khi SLO bị miss. | 0.5% requests có thể fail. |
| Measurement window | Khoảng thời gian đọc signal. | 7 ngày hoặc 30 ngày. |

Definition rule:

- SLO phải đo được bằng data mà team có thể lấy hoặc sẽ lấy được.
- SLO quá cao làm team bị đóng băng; quá thấp không bảo vệ user.
- SLO nên được review sau incident hoặc thay đổi product lớn.

## 6. Error budget rules

| Budget state | Ý nghĩa | Team decision |
| --- | --- | --- |
| Healthy | Budget còn nhiều. | Feature work tiếp tục bình thường. |
| Burning fast | Lỗi tăng nhanh trong window. | Điều tra, giảm risk, thêm guard. |
| Near exhausted | Budget gần hết. | Reliability work ưu tiên hơn feature phụ. |
| Exhausted | SLO miss. | Stop risky launch, run recovery/improvement. |

Error budget rule:

- Error budget là công cụ trade-off, không phải bảng phạt.
- Khi burn nhanh, team cần action trước khi incident Sev1/Sev2 xảy ra.
- Nếu budget exhausted, PO và team phải nói rõ feature nào tạm hold.

## 7. Operational readiness checklist

| Readiness area | Câu hỏi |
| --- | --- |
| Monitoring | Có signal user-facing cho flow chính không? |
| Alerting | Team biết khi nào signal xấu trước customer không? |
| Runbook | Có bước xử lý/rollback đủ ngắn không? |
| Support | Support có FAQ, known issue và escalation path không? |
| Ownership | Ai xem dashboard, ai nhận alert, ai quyết định hold? |

Checklist rule:

- Readiness không phải paperwork; nó trả lời "khi lỗi thì ai làm gì".
- Launch thiếu monitoring hoặc rollback phải ghi risk acceptance.
- Readiness gap nên thành backlog item nhỏ, không chỉ note trong review.

## 8. Launch readiness decision

| Decision | Khi chọn | Output |
| --- | --- | --- |
| Go | SLO healthy, readiness đủ, risk nhỏ. | Launch note + monitoring window. |
| Go with watch | Risk chấp nhận được nhưng cần theo dõi sát. | Owner + watch window + rollback trigger. |
| Hold | SLO/budget/readiness không đủ. | Gap backlog + next decision date. |
| Partial rollout | Risk cần giảm bằng cohort nhỏ. | Rollout plan + success/stop criteria. |

Decision rule:

- Go/no-go phải dựa trên SLO, readiness và customer impact.
- "Go with watch" cần rollback trigger rõ, không chỉ hy vọng.
- Hold là quyết định product tốt nếu risk chưa được hiểu đủ.

## 9. Reliability backlog

| Backlog item | Source | Owner | Success signal |
| --- | --- | --- | --- |
| Add checkout success SLI | Payment incident. | Dev + QA | Dashboard shows success rate. |
| Define rollback trigger | Launch risk review. | Dev lead | Trigger documented and tested. |
| Support escalation path | Readiness gap. | Support + PO | Support can route Sev2 within 10 minutes. |
| Latency budget review | P95 trend rising. | Dev team | P95 returns under target for 7 days. |

Backlog rule:

- Reliability item phải có source và success signal.
- Nếu SLO miss, reliability backlog cần được nhìn trong planning.
- Item quá lớn phải split thành dashboard, alert, runbook hoặc fix slice.

## 10. Sample SLO board

| Service/flow | SLI | SLO | Budget state | Decision | Status |
| --- | --- | --- | --- | --- | --- |
| Checkout | Success rate | >= 99.5% / 30d | Burning fast | Add guard + monitor | In progress |
| Login | Availability | >= 99.9% / 30d | Healthy | Continue feature work | Watching |
| Invite email | Freshness | 95% under 5 min | Near exhausted | Hold risky rollout | Ready |
| Mobile API | Latency P95 | < 800ms | Healthy | Go with watch | Done |

Sample output:

```text
User journey:
Reliability signal:
SLI:
SLO:
Budget state:
Readiness gap:
Decision:
Backlog action:
```

## 11. Sample output

Nếu SLO và operational readiness chạy đúng, team sẽ:

- biết reliability nào thật sự quan trọng với user;
- dùng error budget để trade-off feature và reliability;
- launch có monitor, rollback và support path rõ;
- biến incident learning thành reliability backlog;
- tránh tranh luận cảm tính về "ổn định chưa".

Kết quả xấu cần tránh:

- chọn metric đẹp nhưng không giúp decision;
- đặt SLO cao tới mức team không dám ship;
- launch mà không có owner xem signal;
- error budget miss nhưng backlog vẫn chỉ ưu tiên feature mới.

## 12. Checklist hoàn thành

- [x] Reliability signals đã có.
- [x] SLI/SLO definitions đã có.
- [x] Error budget rules đã có.
- [x] Operational readiness checklist đã có.
- [x] Launch readiness decision đã có.
- [x] Reliability backlog đã có.
- [x] Sample SLO board đã có.
- [x] Team biết dùng SLO để quyết định reliability và feature trade-off.

## 13. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `32 Exercise 24 - SLOs and Operational Readiness`.

SLO tốt giúp team không chỉ phản ứng sau incident, mà còn chủ động giữ trải
nghiệm user trong một ngưỡng tin cậy đã được nói rõ.
