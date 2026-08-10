# Bài 30 - Example Mapping và Acceptance Criteria

Trạng thái bài làm: đã hoàn thành playbook để team biến story từ user story
map thành rules, examples, questions, edge cases, acceptance criteria và
testable scenarios trước khi build.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 29. User story mapping giúp team chọn story trong
journey, walking skeleton, MVP slice và release slice. Nhưng story sẵn sàng
refine chưa có nghĩa là team đã hiểu đúng behavior. Bước tiếp theo là example
mapping: story này có business rule nào, ví dụ cụ thể nào chứng minh rule,
case nào dễ sai, câu hỏi nào còn mở và acceptance criteria nào đủ testable.

Kết quả cuối cùng của bài là:

- Example mapping inputs.
- Story rule discovery.
- Concrete examples.
- Open questions.
- Edge and negative cases.
- Acceptance criteria formats.
- Testable scenarios.
- DoR and DoD alignment.
- Sample example map board.

## 2. Bối cảnh

Team Scrum nhỏ thường refine story bằng mô tả quá rộng:

- story có title đẹp nhưng rule ẩn nằm trong đầu Product Owner;
- developer build happy path, QA tìm ra edge case quá muộn;
- acceptance criteria viết như checklist mơ hồ, không test được;
- stakeholder tưởng một hành vi khác với điều team đang build;
- bug xuất hiện vì exception và permission case chưa được nói ra;
- DoR nói "rõ rồi" nhưng team không có examples để chứng minh.

Bài này giúp team làm rõ behavior bằng ví dụ cụ thể trước khi estimate hoặc
commit vào sprint.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- lấy story từ story map và xác định scope cần clarify;
- tách business rules khỏi examples;
- viết examples cụ thể cho happy path, alternate path và edge case;
- ghi open questions thay vì giả định im lặng;
- chuyển examples thành acceptance criteria/test scenarios;
- nối acceptance criteria với DoR, DoD và success signal;
- biết khi nào story cần split hoặc quay lại discovery.

## 4. Example mapping inputs

| Input | Cần lấy từ đâu | Dùng để làm gì |
| --- | --- | --- |
| Selected story | Bài 29 story map/refinement handoff. | Giữ user, need và outcome. |
| Evidence source | Opportunity, metric, quote, experiment result. | Biết vì sao story tồn tại. |
| Slice placement | Walking skeleton, MVP, Release 1/2. | Biết depth cần build. |
| Assumptions left | Assumption map hoặc handoff note. | Tìm câu hỏi còn mở. |
| Success signal | Outcome metric hoặc observable behavior. | Viết acceptance có ý nghĩa. |

Input rule:

- Không example map story nếu user/outcome chưa rõ.
- Nếu story quá lớn để có examples gọn, split trước khi estimate.
- Evidence yếu cần ghi confidence thay vì biến thành rule chắc chắn.

## 5. Story rule discovery

| Rule type | Câu hỏi | Ví dụ |
| --- | --- | --- |
| Eligibility | Ai được dùng behavior này? | Chỉ workspace admin tạo board từ template. |
| Required data | Data nào bắt buộc? | Template phải có name và ít nhất một list. |
| Permission | Ai được xem/sửa/xóa? | Member không được đổi template mặc định. |
| State transition | Trạng thái thay đổi ra sao? | Draft template thành created board. |
| Limit | Có giới hạn số lượng/thời gian không? | Tối đa 20 lists từ một template. |

Rule rule:

- Rule là điều luôn đúng trong scope story.
- Nếu rule chỉ đúng cho một segment hoặc plan, ghi rõ điều kiện.
- Rule chưa chắc phải thành open question, không ghi như sự thật.

## 6. Concrete examples

| Rule | Example | Expected result |
| --- | --- | --- |
| Admin can create from template. | Admin chọn Project Kickoff template. | Board mới có lists và sample cards. |
| Template requires a name. | Template name trống. | Save bị chặn với message rõ. |
| Member cannot manage template. | Member mở template settings. | Manage action bị ẩn hoặc disabled. |
| Large template has a limit. | Template có 25 lists. | System cảnh báo và không tạo quá limit. |
| Success hint appears after create. | Board tạo xong lần đầu. | First action checklist hiển thị. |

Example rule:

- Example phải cụ thể: actor, input/state và expected result.
- Mỗi rule nên có ít nhất một example chứng minh.
- Example không cần bao phủ mọi thứ, nhưng phải lộ case dễ hiểu sai.

## 7. Open questions

| Question | Ai trả lời? | Decision cần |
| --- | --- | --- |
| Free plan có được dùng template không? | Product/Business | Scope theo plan. |
| Template sample cards có assign member không? | Product/UX | Default content rule. |
| Mobile có cần cùng flow trong Release 1 không? | Product/Design | Segment/release scope. |
| Nếu template import lỗi một card thì rollback hay partial create? | Engineering/QA | Failure behavior. |
| Support cần log nào để debug template create? | Support/Engineering | Observability requirement. |

Question rule:

- Open question có owner và decision date.
- Nếu câu hỏi ảnh hưởng acceptance, không estimate story như Ready.
- Question nhỏ có thể để trong story; question lớn có thể tách discovery card.

## 8. Edge and negative cases

| Case type | Ví dụ | Expected behavior |
| --- | --- | --- |
| Missing data | Template thiếu name/list. | Block save/create với error rõ. |
| Permission denied | Non-admin cố tạo org template. | Không cho phép, không leak data. |
| Duplicate | User double-click create. | Chỉ tạo một board hoặc idempotent handling. |
| Network/server error | Create request timeout. | Show retry, không mất selection. |
| Limit exceeded | Template vượt list/card limit. | Explain limit and recovery path. |

Negative rule:

- Negative case không phải bi quan; nó là cách bảo vệ behavior.
- Permission, duplicate và error state nên được hỏi sớm.
- Nếu edge case quá hiếm và không thuộc slice, ghi out-of-scope rõ.

## 9. Acceptance criteria formats

| Format | Khi dùng | Ví dụ |
| --- | --- | --- |
| Given/When/Then | Behavior cần test rõ. | Given admin chọn template, when create, then board exists. |
| Checklist | Artifact hoặc policy đơn giản. | Template page has name, preview, create CTA. |
| Rule + examples | Behavior có nhiều condition. | Rule: only admin can manage templates. |
| Metric acceptance | Story gắn adoption/success signal. | Template activation can be measured. |
| Non-functional | Reliability/security/performance. | Create handles duplicate request safely. |

Criteria rule:

- Acceptance criteria phải verify được.
- Criteria không nên chỉ nói "UI đẹp" hoặc "works as expected".
- Mỗi criterion nên nối với rule, example, risk hoặc success signal.

## 10. Testable scenarios

| Scenario | Test type | Evidence |
| --- | --- | --- |
| Admin creates board from valid template. | UI/e2e or integration. | Board created with expected lists. |
| Non-admin cannot manage template. | Permission negative test. | Forbidden/hidden action verified. |
| Empty template name is rejected. | Unit/form validation. | Error message and no save. |
| Duplicate create request is safe. | API/integration. | One board or idempotent response. |
| Create success emits metric. | Instrumentation/unit. | Event includes template id and segment. |

Scenario rule:

- Không phải mọi scenario cần browser test; chọn test level phù hợp.
- Negative tests pin rule dễ regression.
- Nếu success signal cần analytics, acceptance phải nói event nào cần có.

## 11. DoR and DoD alignment

| Gate | Cần kiểm | Outcome |
| --- | --- | --- |
| Definition of Ready | Rules, examples, questions resolved or owned. | Story có thể estimate. |
| Sprint Planning | Scope, split, risk và acceptance rõ. | Team commit với hiểu biết chung. |
| Definition of Done | Acceptance tests pass, docs/support notes done. | Increment thật sự done. |
| Review | Demo theo examples chính. | Stakeholder thấy behavior đúng. |
| Retro | Bug/ambiguity nào thoát qua refinement? | Improve example mapping next time. |

Alignment rule:

- DoR không yêu cầu biết mọi thứ, nhưng phải biết risk còn lại là gì.
- DoD phải bao gồm acceptance evidence, không chỉ code merged.
- Review demo nên dùng examples đã thống nhất để tránh lệch kỳ vọng.

## 12. Sample example map board

| Story | Rules | Examples | Questions | Acceptance/Test |
| --- | --- | --- | --- | --- |
| Create board from template | Admin only; template needs name/list | Valid Project Kickoff creates board | Free plan allowed? | GWT create success |
| Preview template | Preview shows lists/cards summary | 3-list template renders summary | Mobile Release 1? | UI preview test |
| Customize before create | Rename board before save | Admin changes board name | Invite members now or later? | Form validation test |
| Handle create failure | No duplicate boards on retry | Timeout then retry | Rollback or partial create? | API negative test |
| Track activation | Emit metric after create | Event has template id | Analytics owner? | Instrumentation check |

Sample output:

```text
Story:
Outcome:
Rules:
Examples:
Open questions:
Edge/negative cases:
Acceptance criteria:
Testable scenarios:
DoR status:
DoD evidence:
Owner:
```

## 13. Sample output

Nếu example mapping và acceptance criteria chạy đúng, team sẽ:

- nhìn thấy rule ẩn trước khi code;
- dùng examples để thống nhất behavior giữa PO, dev, QA và design;
- biết câu hỏi nào còn mở thay vì đoán;
- có acceptance criteria đủ testable;
- giảm bug do permission, edge case và expectation mismatch.

Kết quả xấu cần tránh:

- acceptance criteria chỉ là câu "works correctly";
- chỉ có happy path, không có negative case;
- open question bị biến thành assumption ngầm;
- test scenario không nối với rule hoặc outcome;
- story vào sprint dù DoR chưa rõ.

## 14. Checklist hoàn thành

- [x] Example mapping inputs đã có.
- [x] Story rule discovery đã có.
- [x] Concrete examples đã có.
- [x] Open questions đã có.
- [x] Edge and negative cases đã có.
- [x] Acceptance criteria formats đã có.
- [x] Testable scenarios đã có.
- [x] DoR and DoD alignment đã có.
- [x] Sample example map board đã có.
- [x] Team biết biến story thành examples, criteria và test scenarios.

## 15. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `38 Exercise 30 - Example Mapping and Acceptance Criteria`.

Example map tốt giúp team build đúng behavior đã thống nhất, không chỉ build
đúng title của story.
