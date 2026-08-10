# Bài 6 - Metrics và Improvement Loop

Trạng thái bài làm: đã hoàn thành bản playbook để team biến dữ liệu sau release
thành action cải tiến có thể theo dõi được qua sprint sau.

## 1. Bài này nói về gì?

Bài tập này nối vòng sau Bài 5. Khi release đã xong, team không chỉ “xong việc”
mà cần xem dữ liệu thực tế, chọn metric đúng, đặt target, tạo experiment nhỏ và
đưa action cải tiến quay lại backlog.

Kết quả cuối cùng của bài là:

- Bộ metric cốt lõi.
- Cách đọc baseline và target.
- Trend review format.
- Experiment design.
- Action owner và backlog feedback.
- Checklist hoàn thành cho sprint sau.

## 2. Bối cảnh

Team vừa release onboarding flow đầu tiên:

- tạo board;
- starter lists;
- mời teammate;
- failed invite log;
- empty state được rework trước release.

Sau 1-2 tuần, dữ liệu bắt đầu đủ để hỏi:

1. Onboarding có tốt hơn không?
2. Phần nào làm người dùng kẹt?
3. Team nên thử thay đổi gì ở sprint sau?

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- Chọn metric ít nhưng đúng.
- Phân biệt baseline, target và signal nhiễu.
- Đọc trend thay vì nhìn một con số lẻ.
- Đề xuất experiment nhỏ có owner và thời điểm review.
- Chuyển insight thành backlog action cụ thể.

## 4. Chọn metric

| Metric | Vì sao chọn | Baseline | Target |
| --- | --- | ---: | ---: |
| Board creation success rate | Đo step đầu của onboarding. | 78% | 88% |
| Invite email failure rate | Biết luồng invite có ổn không. | 7% | < 4% |
| Mobile empty-state activation | Đo CTA mobile có đủ rõ không. | 32% | 45% |
| Support ticket count | Biết user có cần help nhiều hơn không. | 18 | < 12 |
| Escaped defects | Đo chất lượng release. | 2 | 0 |

Rule:

- Không chọn quá nhiều metric.
- Mỗi metric phải gắn với user outcome hoặc delivery risk.
- Nếu team không thể tác động metric bằng action cụ thể, đừng chọn.

## 5. Trend review

| Loại tín hiệu | Cách đọc | Hành động |
| --- | --- | --- |
| Tăng bền vững | 3 điểm đo liên tiếp cùng chiều tốt/xấu. | Giữ hoặc đổi experiment. |
| Spike nhất thời | Một lần tăng giảm rồi trở lại. | Kiểm tra có release/event bất thường. |
| Nhiễu | Số nhảy nhưng không có pattern. | Chờ thêm dữ liệu hoặc tách segment. |
| Regression | Metric xấu đi sau release. | Triage, rollback/hotfix hoặc rework. |

Question khi nhìn trend:

- Có thay đổi gì trong sprint/release vừa rồi không?
- Có segment nào bị ảnh hưởng nhiều hơn không?
- Có support ticket hoặc feedback nào giải thích con số không?

## 6. Experiment design

Mỗi experiment phải có:

```text
Hypothesis:
Change:
Owner:
Window:
Success signal:
Rollback/stop signal:
```

Ví dụ:

| Hypothesis | Change | Owner | Window | Success signal |
| --- | --- | --- | --- | --- |
| CTA mobile chưa rõ làm activation thấp. | Tăng size CTA và đổi copy. | UX/UI | 1 tuần | Activation tăng ít nhất 8%. |
| Invite email failure do copy hoặc retry flow. | Thêm resend hint và status rõ hơn. | Product Owner + Dev | 1 sprint | Failure rate giảm dưới 4%. |
| Support ticket cao vì FAQ thiếu. | Thêm FAQ và support macro. | Support lead | 1 tuần | Ticket count giảm ít nhất 20%. |

Experiment rule:

- Mỗi experiment chỉ thay một vài thứ có kiểm soát.
- Không đổi quá nhiều thứ cùng lúc.
- Nếu signal xấu rõ ràng, dừng sớm.

## 7. Backlog feedback

Insight từ metric phải quay lại backlog:

| Insight | Backlog action |
| --- | --- |
| Mobile CTA vẫn thấp. | Tạo item rework empty state CTA/copy. |
| Invite failure cao ở một domain. | Tạo item improve email retry + diagnostics. |
| Support ticket lặp lại câu hỏi giống nhau. | Tạo FAQ card và in-app explanation. |
| Escaped defects tăng sau release. | Tăng smoke test trước release sau. |

Backlog action format:

```text
Problem:
Evidence:
Action:
Owner:
Expected impact:
Review date:
```

## 8. Review cadence

| Cadence | Cần xem gì | Người chịu trách nhiệm |
| --- | --- | --- |
| 24 giờ | Defect, support spike, broken flow. | Release owner. |
| 1 tuần | Trend của metric chính. | PO + QA + UX. |
| 1 sprint | Experiment result và backlog update. | Scrum team. |

## 9. Sample output

| Output | Nội dung |
| --- | --- |
| Metric set | 5 metric cốt lõi, không chọn thêm. |
| One good trend | Board creation success rate tăng từ 78% lên 86%. |
| One bad trend | Invite failure rate tăng ở một domain cụ thể. |
| One experiment | Sửa retry flow và copy invite status. |
| One backlog action | Tạo card “Explain invite states better”. |
| One review date | Đánh giá lại sau sprint sau. |

## 10. Checklist hoàn thành

- [x] Metric cốt lõi đã được chọn.
- [x] Baseline và target đã rõ.
- [x] Trend review format đã có.
- [x] Experiment design có hypothesis, owner và stop signal.
- [x] Backlog feedback action đã có format.
- [x] Review cadence đã có.
- [x] Sample output đã có.
- [x] Team biết khi nào phải dừng hoặc đổi experiment.

## 11. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `14 Exercise 6 - Metrics and Improvement Loop`.

Insight từ metric nên sinh card mới hoặc checklist improvement ở Product
Backlog, không chỉ nằm trong note.
