# Bài 27 - Experiment Design và A/B Testing

Trạng thái bài làm: đã hoàn thành playbook để team biến feedback/adoption
evidence thành giả thuyết kiểm chứng, thiết kế experiment nhỏ, đọc kết quả và
quyết định build, iterate hoặc stop bằng evidence.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 26. Post-launch feedback giúp team thấy user có dùng
tính năng không và họ vướng ở đâu. Nhưng không phải feedback nào cũng nên trở
thành feature ngay. Bước tiếp theo là thiết kế experiment: giả thuyết nào cần
kiểm chứng, đo bằng metric nào, thử với ai, bao lâu, rủi ro gì và quyết định
sau khi có kết quả là gì.

Kết quả cuối cùng của bài là:

- Hypothesis format.
- Experiment types.
- A/B testing setup.
- Audience and sample guardrails.
- Success metrics.
- Risk/ethics checks.
- Decision rules.
- Backlog follow-up rules.
- Sample experiment board.

## 2. Bối cảnh

Team Scrum nhỏ thường xử lý feedback bằng cách build ngay:

- user nói "khó tìm" nên team thêm một nút mới mà không biết nút cũ lỗi ở đâu;
- stakeholder thích một idea nên nó nhảy vào sprint dù evidence yếu;
- A/B test được nhắc tới nhưng không có hypothesis hoặc success metric;
- experiment chạy quá lâu vì không có decision date;
- metric tăng nhẹ nhưng side effect làm support load tăng;
- kết quả experiment không được đưa vào backlog/refinement rõ ràng.

Bài này giúp team học nhanh hơn mà vẫn bảo vệ user và flow delivery.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- viết hypothesis rõ problem, audience, change và expected outcome;
- chọn loại experiment phù hợp với rủi ro và lượng traffic;
- thiết kế A/B test cơ bản có control, variant và metric;
- đặt guardrail để tránh đọc sai sample hoặc gây hại user;
- quyết định success, inconclusive hoặc stop trước khi chạy;
- chuyển kết quả experiment thành backlog action.

## 4. Hypothesis format

| Thành phần | Câu hỏi | Ví dụ |
| --- | --- | --- |
| Problem | User đang vướng gì? | User không tìm thấy template picker. |
| Audience | Nhóm user nào bị ảnh hưởng? | New workspace admins trong 7 ngày đầu. |
| Change | Team sẽ thử thay đổi gì? | Đổi entry point text và đưa lên empty state. |
| Outcome | Kết quả nào sẽ tốt hơn? | Activation tăng từ 35% lên 45%. |
| Risk | Điều gì có thể xấu đi? | User cũ bị nhiễu vì CTA mới quá nổi. |

Hypothesis template:

```text
We believe that [change] for [audience]
will improve [outcome metric]
because [evidence/source].
We will know this is true when [success rule],
while watching [guardrail metric].
```

Hypothesis rule:

- Hypothesis phải bắt đầu từ evidence, không từ solution yêu thích.
- Nếu không có audience rõ, experiment rất dễ bị loãng.
- Nếu không có guardrail, team có thể tối ưu một metric và làm hỏng metric khác.

## 5. Experiment types

| Experiment type | Khi dùng | Output |
| --- | --- | --- |
| Prototype test | Idea còn mơ hồ, cần hiểu user phản ứng. | Learning note + refined story. |
| Concierge/manual test | Muốn kiểm value trước khi tự động hóa. | Demand signal + process learning. |
| Fake door test | Muốn đo interest trước khi build. | Click/intent signal + trust check. |
| A/B test | Có traffic đủ và thay đổi nhỏ có thể so sánh. | Variant decision + metric evidence. |
| Beta cohort test | Cần feedback sâu từ nhóm nhỏ. | Qualitative insight + rollout decision. |

Experiment rule:

- Không phải mọi câu hỏi đều cần A/B test.
- Traffic thấp thường hợp prototype/interview/beta hơn là A/B test.
- Experiment nên nhỏ hơn feature đầy đủ nhưng đủ thật để học.

## 6. A/B testing setup

| Step | Cần định nghĩa | Ví dụ |
| --- | --- | --- |
| Control | Trải nghiệm hiện tại. | Empty state cũ không có template CTA. |
| Variant | Thay đổi cần kiểm chứng. | Empty state mới có CTA "Start with template". |
| Randomization | Ai vào nhóm nào? | New admins chia 50/50 theo workspace. |
| Primary metric | Metric quyết định. | Template activation rate. |
| Guardrail | Metric không được xấu đi. | Board creation completion và support tickets. |
| Duration | Chạy bao lâu hoặc đến khi đủ sample? | 7 ngày hoặc 300 eligible users. |

A/B setup rule:

- Một test nên có một primary metric, không đổi giữa chừng.
- Control và variant chỉ nên khác ở thứ đang kiểm chứng.
- Randomization cần ổn định để user không thấy trải nghiệm nhảy qua lại.

## 7. Audience và sample guardrails

| Guardrail | Vì sao cần | Cách dùng |
| --- | --- | --- |
| Eligibility | Chỉ đo user có cơ hội thấy change. | Exclude users không mở workspace setup. |
| Segment | Tránh average che pain. | Đọc theo new/existing, free/paid, mobile/desktop. |
| Sample size | Tránh kết luận từ số quá nhỏ. | Đặt minimum users/events trước khi đọc. |
| Contamination | Tránh user thấy cả control và variant. | Stickiness theo user/workspace. |
| External noise | Tránh nhầm do campaign/incident. | Ghi release/campaign/incident dates. |

Sample rule:

- Nếu sample quá nhỏ, kết quả có thể là learning định tính, không phải winner.
- Đừng đọc winner quá sớm chỉ vì một ngày đầu đẹp.
- Segment quan trọng có thể cần decision riêng.

## 8. Success metrics

| Metric type | Ví dụ | Cách dùng |
| --- | --- | --- |
| Activation | First meaningful action completed. | Primary metric cho onboarding/entry point. |
| Conversion | User chuyển sang bước giá trị. | Primary metric cho funnel. |
| Retention | User quay lại sau N ngày. | Cần window dài hơn. |
| Efficiency | Time/task steps giảm. | Hữu ích cho workflow productivity. |
| Satisfaction | Feedback, CSAT, support sentiment. | Guardrail hoặc qualitative evidence. |

Metric rule:

- Success metric phải đủ gần với value, không chỉ gần với click.
- Guardrail nên bảo vệ reliability, support load, retention hoặc trust.
- Nếu metric cần thời gian dài, đừng ép decision quá sớm.

## 9. Risk và ethics checks

| Check | Câu hỏi |
| --- | --- |
| User harm | Variant có thể làm user mất data, tiền hoặc quyền truy cập không? |
| Trust | Fake door hoặc copy mới có đánh lừa user không? |
| Fairness | Cohort nào bị trải nghiệm kém quá lâu không? |
| Privacy | Experiment có thu thập data nhạy cảm không? |
| Support readiness | Support có biết variant và workaround không? |

Risk rule:

- Không chạy experiment gây hại chỉ để học nhanh.
- Fake door phải có message trung thực và không làm user mất niềm tin.
- Risk cao cần review trước khi bật, giống release readiness nhỏ.

## 10. Decision rules

| Result | Khi kết luận | Action |
| --- | --- | --- |
| Success | Primary metric đạt target, guardrail khỏe. | Promote variant + cleanup experiment. |
| Partial success | Metric tốt ở một segment hoặc guardrail hơi xấu. | Iterate hoặc target segment hẹp hơn. |
| Inconclusive | Sample thiếu hoặc signal mâu thuẫn. | Extend, redesign test hoặc dùng research. |
| Failure | Metric không cải thiện hoặc guardrail xấu. | Stop variant, record learning. |
| Harmful | Guardrail breach hoặc trust/support risk. | Stop ngay, incident/fix nếu cần. |

Decision rule:

- Decision rules phải viết trước khi chạy.
- Inconclusive không phải thất bại; nó nói rằng evidence chưa đủ.
- Mọi kết quả đều cần learning note để tránh lặp lại cùng assumption.

## 11. Backlog follow-up rules

| Learning | Backlog action | Acceptance evidence |
| --- | --- | --- |
| Variant thắng rõ. | Story to promote/clean up. | Metric lift + guardrail note. |
| Variant chỉ thắng ở segment. | Segment-specific story. | Segment result + rollout scope. |
| Variant thua. | Stop/remove card hoặc new hypothesis. | Learning note + decision log. |
| Feedback mới xuất hiện. | Discovery/interview card. | Questions + target users. |
| Guardrail xấu. | Reliability/support/UX fix. | Guardrail returns healthy. |

Backlog rule:

- Experiment result không tự động thành feature; nó thành decision.
- Backlog item sau experiment phải ghi evidence source và success signal.
- Nếu promote variant, nhớ cleanup flag/test code và docs/support notes.

## 12. Sample experiment board

| Experiment | Hypothesis | Primary metric | Guardrail | Decision | Status |
| --- | --- | --- | --- | --- | --- |
| Template CTA copy | Clearer CTA increases activation. | Template activation | Board creation completion | Run 7 days | Running |
| Mobile setup hint | Hint reduces setup drop-off. | Setup completion | Support tickets | Expand to beta | Watching |
| Export upsell message | New copy increases paid interest. | Trial upgrade click | Trust feedback | Stop if complaints | Ready |
| Checklist empty state | Example checklist improves first use. | First checklist created | Time to board ready | Promote variant | Done |

Sample output:

```text
Evidence source:
Hypothesis:
Audience:
Experiment type:
Control:
Variant:
Primary metric:
Guardrail:
Duration/sample rule:
Decision rule:
Backlog follow-up:
Owner:
```

## 13. Sample output

Nếu experiment design và A/B testing chạy đúng, team sẽ:

- không build mọi feedback như feature ngay lập tức;
- kiểm chứng assumption bằng experiment đủ nhỏ;
- biết metric nào quyết định và metric nào bảo vệ user;
- tránh kết luận sớm từ sample yếu;
- đưa kết quả experiment thành decision/backlog action rõ ràng.

Kết quả xấu cần tránh:

- chạy A/B test không có hypothesis;
- đổi metric giữa chừng để tìm winner;
- bỏ qua guardrail vì primary metric tăng;
- gây mất trust bằng fake door không trung thực;
- để experiment chạy mãi mà không có decision.

## 14. Checklist hoàn thành

- [x] Hypothesis format đã có.
- [x] Experiment types đã có.
- [x] A/B testing setup đã có.
- [x] Audience and sample guardrails đã có.
- [x] Success metrics đã có.
- [x] Risk/ethics checks đã có.
- [x] Decision rules đã có.
- [x] Backlog follow-up rules đã có.
- [x] Sample experiment board đã có.
- [x] Team biết biến feedback thành experiment và backlog decision.

## 15. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `35 Exercise 27 - Experiment Design and A/B Testing`.

Experiment tốt giúp team học nhanh mà không biến mọi ý kiến thành scope mới.
