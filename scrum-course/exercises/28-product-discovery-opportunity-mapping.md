# Bài 28 - Product Discovery và Opportunity Mapping

Trạng thái bài làm: đã hoàn thành playbook để team gom learning từ feedback,
experiment và stakeholder input thành opportunity map, assumption map và
discovery backlog trước khi cam kết roadmap scope.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 27. Experiment design giúp team kiểm chứng assumption
thay vì build mọi ý kiến. Nhưng sau nhiều feedback, interview và experiment,
team cần một cách nhìn tổng thể: problem nào thật sự quan trọng, nhóm user nào
bị ảnh hưởng, solution candidate nào có thể giải quyết, assumption nào còn yếu
và quyết định nào nên đi vào roadmap hoặc backlog refinement.

Kết quả cuối cùng của bài là:

- Discovery inputs.
- Opportunity framing.
- Customer segment rules.
- Opportunity solution tree.
- Assumption mapping.
- Evidence strength.
- Discovery backlog rules.
- Decision handoff.
- Sample opportunity board.

## 2. Bối cảnh

Team Scrum nhỏ thường có nhiều learning nhưng thiếu cấu trúc:

- feedback nằm rải rác ở support, sales, review và analytics;
- experiment thắng/thua nhưng không ai kết nối lại với opportunity ban đầu;
- backlog có nhiều solution card nhưng problem statement yếu;
- stakeholder đưa idea mới khiến team nhảy khỏi mục tiêu product;
- team không biết assumption nào cần discovery và assumption nào đủ để build;
- roadmap bị quyết bởi confidence cảm tính thay vì evidence strength.

Bài này giúp team biến learning rời rạc thành bản đồ cơ hội có thể ra quyết
định.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- gom discovery input từ feedback, data, experiment và stakeholder;
- viết opportunity theo user problem và desired outcome;
- phân biệt segment/persona để không đọc average sai;
- dựng opportunity solution tree đơn giản;
- map assumption theo risk và evidence;
- tạo discovery backlog cho điều chưa biết;
- handoff quyết định sang roadmap, refinement hoặc experiment tiếp theo.

## 4. Discovery inputs

| Input | Dùng để hiểu | Ví dụ |
| --- | --- | --- |
| Adoption metrics | User có dùng và quay lại không? | Activation, retention, drop-off. |
| Feedback/support | User đau ở đâu và nói gì? | Tickets, comments, workaround. |
| Experiment results | Assumption nào đã được kiểm chứng? | Variant win/fail/inconclusive. |
| Sales/CS evidence | Segment nào có need rõ? | Objection, churn reason, upsell blocker. |
| Strategy/stakeholder | Business outcome nào quan trọng? | Revenue, retention, reliability, expansion. |

Input rule:

- Discovery input phải giữ source, segment và date.
- Một input lẻ không nên thành opportunity lớn nếu chưa có pattern.
- Experiment result cần nối lại với hypothesis ban đầu.

## 5. Opportunity framing

| Field | Câu hỏi | Ví dụ |
| --- | --- | --- |
| User | Ai đang có problem này? | New workspace admins. |
| Problem | Họ vướng gì? | Không biết bắt đầu board từ template ở đâu. |
| Outcome | Họ muốn đạt điều gì? | Tạo board hữu ích trong 5 phút đầu. |
| Evidence | Team biết từ đâu? | Activation thấp + 12 support comments. |
| Business value | Vì sao đáng ưu tiên? | New account activation ảnh hưởng retention. |

Opportunity template:

```text
For [segment],
we observed [problem/evidence].
This matters because [user outcome + business outcome].
We believe improving this opportunity could move [metric].
```

Framing rule:

- Opportunity không phải solution.
- Câu "thêm nút X" là solution candidate, không phải opportunity.
- Opportunity tốt đủ rõ để sinh nhiều solution khác nhau.

## 6. Customer segment rules

| Segment view | Khi cần đọc riêng | Ví dụ |
| --- | --- | --- |
| New vs existing | Learning/onboarding khác nhau. | New admins không thấy template picker. |
| Free vs paid | Business impact và expectations khác nhau. | Paid teams cần audit/export. |
| Mobile vs desktop | Context sử dụng khác nhau. | Mobile setup drop-off cao. |
| Role/persona | Job-to-be-done khác nhau. | Admin, member, guest, support. |
| Region/language | UX/content/localization khác nhau. | Translation gây hiểu sai CTA. |

Segment rule:

- Không dùng average để quyết định cho segment quan trọng.
- Segment quá nhỏ cần qualitative follow-up thay vì kết luận lớn.
- Opportunity nên ghi segment chính và segment phụ bị ảnh hưởng.

## 7. Opportunity solution tree

| Level | Câu hỏi | Ví dụ |
| --- | --- | --- |
| Outcome | Kết quả product/business cần cải thiện? | Improve new workspace activation. |
| Opportunity | Problem/user need nào cản outcome? | Users cannot find useful starting point. |
| Solution | Cách giải quyết nào có thể thử? | Empty-state CTA, guided setup, template search. |
| Experiment | Assumption nào cần test? | CTA copy increases template activation. |
| Evidence | Kết quả học được là gì? | Variant improved activation without ticket spike. |

Tree rule:

- Một outcome có nhiều opportunity; một opportunity có nhiều solution.
- Không bỏ qua opportunity để nhảy thẳng vào solution.
- Experiment nên gắn vào assumption quan trọng nhất của solution.

## 8. Assumption mapping

| Assumption type | Câu hỏi | Ví dụ |
| --- | --- | --- |
| Desirability | User có muốn điều này không? | User muốn template hơn blank board không? |
| Usability | User có dùng được không? | User có hiểu CTA không? |
| Feasibility | Team có build/operate được không? | Template preview có render đủ nhanh không? |
| Viability | Business có đáng làm không? | Activation lift có đủ ảnh hưởng retention không? |
| Reliability/risk | Có làm xấu SLO/support không? | New flow có tăng error/ticket không? |

Assumption rule:

- Assumption rủi ro cao và evidence yếu cần discovery trước build.
- Không phải assumption nào cũng cần test; chọn assumption có thể làm solution
  fail.
- Assumption đã kiểm chứng cần được ghi lại để tránh test lại.

## 9. Evidence strength

| Strength | Dấu hiệu | Decision |
| --- | --- | --- |
| Strong | Nhiều source đồng ý, segment rõ, metric/support cùng chiều. | Ready for refinement/roadmap. |
| Medium | Có pattern nhưng còn thiếu segment hoặc sample. | Discovery follow-up hoặc small experiment. |
| Weak | Một vài ý kiến hoặc metric chưa rõ. | Park/watch/interview thêm. |
| Conflicting | Metric và feedback không cùng câu chuyện. | Split segment hoặc design deeper research. |
| Stale | Evidence cũ hoặc product đã đổi. | Revalidate trước khi quyết định. |

Evidence rule:

- Evidence strength phải ghi rõ, không giấu dưới chữ "có vẻ".
- Strong evidence vẫn cần acceptance criteria rõ khi vào backlog.
- Weak evidence không bị bỏ; nó vào discovery backlog với câu hỏi rõ.

## 10. Discovery backlog rules

| Backlog item | Khi tạo | Output mong đợi |
| --- | --- | --- |
| Interview task | Cần hiểu why/context. | 5 quotes + insight summary. |
| Data analysis task | Metric/segment chưa rõ. | Segment table + confidence note. |
| Prototype test | Solution còn mơ hồ. | Usability learning + revised solution. |
| Experiment card | Assumption đo được bằng behavior. | Success/guardrail result. |
| Decision card | Evidence đủ, cần alignment. | Go/hold/roadmap/refinement decision. |

Discovery backlog rule:

- Discovery item phải có learning question.
- Không để discovery backlog thành nơi chứa idea không ưu tiên.
- Mỗi discovery item cần owner và review date.

## 11. Decision handoff

| Destination | Khi handoff | Cần kèm theo |
| --- | --- | --- |
| Roadmap | Opportunity lớn, evidence strong, strategic fit. | Outcome, segment, value, confidence. |
| Backlog refinement | Solution slice đủ rõ để build. | Story, acceptance, success signal. |
| Experiment | Assumption còn rủi ro nhưng test được. | Hypothesis, metric, guardrail. |
| Support/docs | Problem giải bằng enablement hơn code. | Known issue, FAQ, owner. |
| Park/watch | Evidence yếu hoặc timing chưa đúng. | Watch signal + revisit date. |

Handoff rule:

- Handoff phải nói decision, không chỉ chuyển note.
- Nếu đưa vào roadmap, cần ghi assumption còn lại.
- Nếu đưa vào refinement, story phải có evidence source và success signal.

## 12. Sample opportunity board

| Opportunity | Segment | Evidence | Solution candidates | Next decision | Status |
| --- | --- | --- | --- | --- | --- |
| Faster first board setup | New admins | Activation 35%, 12 support comments | Empty CTA, guided setup, template search | Prototype guided setup | Discovering |
| Reduce export confusion | Paid admins | 18 tickets, sales objection | Export wizard, better labels, help link | Refine export wizard | Ready |
| Mobile onboarding drop-off | Mobile new users | Drop-off 52%, 9 comments | Shorter setup, mobile hint, defer step | Interview 5 users | Watching |
| Checklist reuse opportunity | Returning teams | Retention 58%, positive quotes | Examples, presets, docs | Roadmap candidate | Ready |

Sample output:

```text
Outcome:
Opportunity:
Segment:
Evidence sources:
Evidence strength:
Solution candidates:
Risky assumptions:
Discovery backlog item:
Decision handoff:
Owner:
Review date:
```

## 13. Sample output

Nếu product discovery và opportunity mapping chạy đúng, team sẽ:

- không lẫn problem với solution;
- nhìn learning từ feedback, data và experiment trong cùng một bản đồ;
- ưu tiên opportunity theo segment, outcome và evidence strength;
- biết assumption nào cần test trước khi build;
- handoff rõ sang roadmap, refinement, experiment hoặc park/watch.

Kết quả xấu cần tránh:

- backlog đầy solution nhưng không biết problem nào đang giải;
- evidence rải rác không có owner tổng hợp;
- average metric che pain của segment quan trọng;
- opportunity map không dẫn tới decision nào;
- roadmap được quyết bằng ý kiến mạnh thay vì evidence strength.

## 14. Checklist hoàn thành

- [x] Discovery inputs đã có.
- [x] Opportunity framing đã có.
- [x] Customer segment rules đã có.
- [x] Opportunity solution tree đã có.
- [x] Assumption mapping đã có.
- [x] Evidence strength đã có.
- [x] Discovery backlog rules đã có.
- [x] Decision handoff đã có.
- [x] Sample opportunity board đã có.
- [x] Team biết biến learning thành opportunity map và decision handoff.

## 15. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `36 Exercise 28 - Product Discovery and Opportunity Mapping`.

Opportunity map tốt giúp team chọn đúng vấn đề trước khi tranh luận giải pháp.
