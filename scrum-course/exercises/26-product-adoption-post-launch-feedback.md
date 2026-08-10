# Bài 26 - Product Adoption và Post-launch Feedback

Trạng thái bài làm: đã hoàn thành playbook để team đo adoption sau rollout,
triage feedback sau launch và biến evidence thành backlog/refinement input
thay vì chỉ hỏi "release có lỗi không".

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 25. Progressive rollout giúp team launch theo phase,
đọc signal và rollback khi rủi ro tăng. Nhưng rollout thành công về kỹ thuật
chưa chắc đã tạo giá trị. Bước tiếp theo là đo user có thật sự dùng tính năng
không, họ vướng ở đâu, feedback nào cần xử lý ngay và insight nào nên đưa vào
backlog cho sprint sau.

Kết quả cuối cùng của bài là:

- Adoption signals.
- Activation/usage/retention measures.
- Feedback intake channels.
- Friction triage rules.
- Qualitative/quantitative synthesis.
- Backlog update rules.
- Stakeholder communication.
- Sample adoption board.

## 2. Bối cảnh

Team Scrum nhỏ thường dừng lại sau khi rollout xong:

- deployment xanh nhưng user không khám phá hoặc không quay lại dùng;
- support ticket tăng nhưng team chỉ xử lý từng ticket rời rạc;
- stakeholder hỏi "release có hiệu quả không" nhưng team chỉ có cảm giác;
- metric usage cao nhưng feedback định tính lại cho thấy user đang workaround;
- feedback từ sales/support/customer success không vào backlog đúng cách;
- backlog sprint sau vẫn ưu tiên feature mới mà chưa học từ release vừa ra.

Bài này giúp team đóng vòng học sau launch bằng adoption evidence.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- định nghĩa adoption signal gắn với outcome của release;
- phân biệt activation, usage, retention và satisfaction;
- gom feedback từ nhiều channel mà không mất context;
- triage friction theo impact, urgency và evidence;
- kết hợp số liệu định lượng với câu chuyện định tính;
- cập nhật backlog bằng learning rõ ràng, không chỉ bằng ý kiến lớn tiếng;
- giao tiếp post-launch status cho stakeholder.

## 4. Adoption signals

| Signal | Câu hỏi | Ví dụ |
| --- | --- | --- |
| Discovery | User có thấy tính năng không? | 60% target cohort mở entry point. |
| Activation | User có hoàn thành hành động đầu tiên không? | 35% tạo board template đầu tiên. |
| Usage | User có dùng trong workflow thật không? | 120 weekly active users dùng checklist mới. |
| Retention | User có quay lại dùng không? | 45% quay lại trong 7 ngày. |
| Satisfaction | User có thấy hữu ích không? | CSAT, NPS comment, support sentiment. |

Signal rule:

- Adoption signal phải gắn với release goal, không chỉ đo click dễ lấy.
- Một release nhỏ nên chọn 2-4 signal đủ đọc được trong watch window.
- Signal tốt phải trả lời "giữ, sửa, mở rộng hay bỏ".

## 5. Activation, usage và retention measures

| Measure | Khi đọc | Decision gợi ý |
| --- | --- | --- |
| Activation thấp | User biết có tính năng nhưng không bắt đầu. | Sửa onboarding, copy hoặc entry point. |
| Usage thấp | User bắt đầu nhưng không dùng trong workflow thật. | Kiểm tra value proposition hoặc fit. |
| Drop-off cao | User rời giữa flow. | Tìm friction, bug, permission hoặc latency. |
| Retention thấp | User thử một lần rồi không quay lại. | Kiểm tra value lặp lại hoặc reminder. |
| Satisfaction thấp | User dùng nhưng khó chịu. | Ưu tiên usability/support fix. |

Measurement rule:

- Không dùng vanity metric để chứng minh release thành công.
- Nếu usage tăng nhưng support pain tăng, release chưa thật sự khỏe.
- Nếu signal cần baseline, ghi rõ baseline trước khi so sánh.

## 6. Feedback intake channels

| Channel | Dữ liệu lấy | Cần giữ context |
| --- | --- | --- |
| Support tickets | Pain, bug, confusion, workaround. | User type, plan, feature state, severity. |
| Sales/CS notes | Objection, promise, adoption blocker. | Account segment, deal/customer impact. |
| In-app feedback | Comment gần thời điểm user gặp vấn đề. | Screen/flow, timestamp, cohort. |
| Analytics | Funnel, drop-off, retry, repeated action. | Release version, flag state, segment. |
| Sprint Review | Stakeholder/customer interpretation. | Decision needed, owner, follow-up. |

Intake rule:

- Feedback không có context rất khó ưu tiên.
- Một feedback channel cần owner lọc noise và merge duplicate.
- Feedback quan trọng phải vào backlog hoặc decision log, không nằm trong chat.

## 7. Friction triage rules

| Triage bucket | Khi dùng | Action |
| --- | --- | --- |
| Critical blocker | User không thể hoàn thành flow chính. | Incident/fix card ngay. |
| High-friction adoption gap | Nhiều user mắc cùng một bước. | Sprint candidate hoặc fast follow. |
| Confusing but recoverable | User tự xử lý được nhưng mất thời gian. | UX copy/help/backlog improvement. |
| Segment-specific pain | Chỉ một cohort/plan bị ảnh hưởng. | Segment analysis + targeted fix. |
| Low-signal request | Ít evidence hoặc chỉ là ý kiến. | Park, watch, ask for more evidence. |

Triage rule:

- Triage cần impact, frequency và evidence, không chỉ độ ồn.
- Bug/blocker đi theo path khác với feature request.
- Duplicate feedback nên merge để thấy pattern thay vì tạo nhiều card nhỏ.

## 8. Qualitative và quantitative synthesis

| Evidence pair | Cách đọc | Kết luận có thể |
| --- | --- | --- |
| Usage thấp + feedback "không thấy" | Discovery problem. | Cải thiện entry point/onboarding. |
| Usage cao + ticket tăng | Value có nhưng friction cao. | Sửa UX/bug trước khi thêm scope. |
| Activation cao + retention thấp | First try ổn, repeat value yếu. | Kiểm tra habit loop hoặc reminder. |
| Nhiều request cùng theme | Market/user need rõ hơn. | Gom thành opportunity/backlog slice. |
| Metric healthy + comment tiêu cực | Segment pain bị che bởi average. | Đọc theo cohort/plan/persona. |

Synthesis rule:

- Metric nói "cái gì đang xảy ra"; feedback nói "vì sao có thể xảy ra".
- Average metric có thể che pain của nhóm user quan trọng.
- Kết luận phải ghi confidence: strong, medium hoặc weak evidence.

## 9. Backlog update rules

| Learning | Backlog output | Acceptance evidence |
| --- | --- | --- |
| User không tìm thấy entry point. | Improve navigation/copy card. | Discovery rate tăng trong cohort. |
| Drop-off ở permission step. | Permission UX fix card. | Completion rate tăng, ticket giảm. |
| Request lặp lại từ target segment. | New story hoặc epic discovery. | Problem statement + sample quotes. |
| Support workaround quá dài. | Support/admin tooling card. | Time-to-resolution giảm. |
| Feature không tạo adoption. | Pivot/remove/hold decision. | Decision log + follow-up metric. |

Backlog rule:

- Mỗi backlog update phải ghi source evidence.
- Không biến mọi feedback thành feature; có feedback chỉ cần support/help/copy.
- Item sau launch nên có success signal để biết fix có hiệu quả không.

## 10. Stakeholder communication

| Audience | Cần biết | Format |
| --- | --- | --- |
| Product/leadership | Release tạo value không? | Adoption summary + decision. |
| Support/CS | User đang vướng gì? | Known issues + workaround + owner. |
| Sales | Có điểm mới/pain nào ảnh hưởng khách hàng? | Segment insight + talking points. |
| Engineering/QA | Fix nào quan trọng nhất? | Prioritized friction board. |
| Team | Học gì cho sprint sau? | Review/retro learning notes. |

Communication rule:

- Post-launch update nên nói decision, không chỉ liệt kê metric.
- Nếu evidence còn yếu, nói rõ cần thêm data gì và khi nào review lại.
- Stakeholder communication phải giúp backlog/refinement tốt hơn.

## 11. Sample adoption board

| Item | Evidence | Triage | Backlog decision | Status |
| --- | --- | --- | --- | --- |
| Template picker hidden | 42% cohort không mở entry point | High-friction adoption gap | Improve navigation copy | Ready |
| Export timeout | 18 support tickets, enterprise users | Critical blocker | Fix timeout + incident follow-up | In progress |
| Mobile setup confusing | 9 comments, low mobile activation | Confusing but recoverable | UX copy + help note | Ready |
| Advanced filter request | 3 sales notes, no usage pattern yet | Low-signal request | Park + interview 5 users | Watching |
| Checklist reuse strong | Retention 58%, positive quotes | Success learning | Expand docs and examples | Done |

Sample output:

```text
Release item:
Adoption goal:
Primary signal:
Feedback channels:
Top friction:
Evidence strength:
Backlog decision:
Stakeholder update:
Owner:
Review date:
```

## 12. Sample output

Nếu product adoption và post-launch feedback loop chạy đúng, team sẽ:

- biết release có tạo value thật hay chỉ deploy thành công;
- thấy adoption friction trước khi nó thành churn hoặc support load lớn;
- dùng feedback có context để cập nhật backlog;
- nói chuyện với stakeholder bằng evidence và decision;
- đưa learning sau launch vào planning, review và retro.

Kết quả xấu cần tránh:

- chỉ đo "release không lỗi" rồi bỏ qua adoption;
- gom feedback trong chat nhưng không triage;
- để opinion lớn tiếng thắng evidence;
- tạo quá nhiều feature request nhỏ từ cùng một pattern;
- không báo cho support/sales biết user đang vướng gì.

## 13. Checklist hoàn thành

- [x] Adoption signals đã có.
- [x] Activation/usage/retention measures đã có.
- [x] Feedback intake channels đã có.
- [x] Friction triage rules đã có.
- [x] Qualitative/quantitative synthesis đã có.
- [x] Backlog update rules đã có.
- [x] Stakeholder communication đã có.
- [x] Sample adoption board đã có.
- [x] Team biết biến post-launch feedback thành backlog evidence.

## 14. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `34 Exercise 26 - Product Adoption and Post-launch Feedback`.

Adoption loop tốt giúp team nhìn release như một vòng học sản phẩm, không chỉ
là một lần deploy đã qua.
