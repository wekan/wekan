# Bài 31 - Test Strategy và Automation Planning

Trạng thái bài làm: đã hoàn thành playbook để team biến acceptance criteria và
testable scenarios thành test strategy, automation plan, regression coverage và
CI signal policy trước khi implementation đi xa.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 30. Example mapping giúp team biết rule, example,
question, edge case và acceptance criteria nào cần verify. Nhưng không phải
scenario nào cũng nên thành UI test, cũng không phải behavior nào chỉ cần unit
test. Bước tiếp theo là lập test strategy: risk nào cần bảo vệ, test level nào
phù hợp, case nào nên automate, case nào cần exploratory, data/environment nào
cần chuẩn bị và CI signal nào đủ nhanh để team tin được.

Kết quả cuối cùng của bài là:

- Test strategy inputs.
- Risk-based test planning.
- Test pyramid selection.
- Automation candidates.
- Negative and regression coverage.
- Test data and environment plan.
- CI signal policy.
- Exploratory testing.
- Coverage gaps.
- Sample test strategy board.

## 2. Bối cảnh

Team Scrum nhỏ thường rơi vào hai cực đoan khi test:

- automate quá nhiều UI flows nên test chậm, flaky và khó maintain;
- chỉ test happy path nên permission, edge case và regression lọt production;
- QA nhận story muộn, không biết scenario nào quan trọng nhất;
- developer viết unit test nhưng behavior người dùng vẫn sai;
- CI đỏ nhưng team không biết đó là signal thật hay flaky noise;
- test data/environment không giống condition acceptance criteria yêu cầu.

Bài này giúp team chọn test đúng chỗ, đủ tin cậy và đủ nhanh cho delivery.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- đọc acceptance criteria và scenario từ Bài 30 để lập test plan;
- phân loại risk theo user impact, business impact và regression chance;
- chọn đúng test level: unit, integration, API, UI/e2e hoặc manual;
- quyết định scenario nào cần automate và scenario nào để exploratory;
- ghi negative/regression coverage cho rule quan trọng;
- chuẩn bị test data, environment và ownership;
- định nghĩa CI signal policy để team hành động khi test fail.

## 4. Test strategy inputs

| Input | Cần lấy từ đâu | Dùng để làm gì |
| --- | --- | --- |
| Acceptance criteria | Bài 30 criteria/testable scenarios. | Xác định behavior phải verify. |
| Rules and examples | Example map. | Tách happy path, alternate path, edge case. |
| Risk notes | Assumption, reliability, permission, data risk. | Ưu tiên coverage. |
| Slice placement | Walking skeleton/MVP/release slice. | Biết depth và regression scope. |
| CI constraints | Runtime, browser, database, test speed. | Chọn test level thực tế. |

Input rule:

- Không lập test strategy từ title story; phải dùng criteria và examples.
- Test plan cần nói rõ what to test và what not to test.
- Nếu acceptance criteria chưa testable, quay lại Bài 30 trước.

## 5. Risk-based test planning

| Risk | Tín hiệu | Test response |
| --- | --- | --- |
| User cannot complete main flow | Walking skeleton hoặc MVP path. | E2E/API integration smoke. |
| Permission/security mistake | Admin/member/guest khác behavior. | Negative permission tests. |
| Data loss/duplicate | Create/update/delete hoặc retry. | Integration/idempotency tests. |
| Business rule regression | Rule đã từng lỗi hoặc nhiều condition. | Unit + regression cases. |
| UX confusion | User cần hiểu copy/flow. | Exploratory/usability checklist. |

Risk rule:

- Risk cao cần test sớm hơn và gần source behavior hơn.
- UI e2e dùng cho confidence trên flow, không thay thế mọi unit/integration test.
- Risk thấp hoặc one-off có thể kiểm manual nếu automate không đáng.

## 6. Test pyramid selection

| Test level | Khi dùng | Ví dụ |
| --- | --- | --- |
| Unit | Rule nhỏ, pure logic, validation. | Empty template name is rejected. |
| Integration | API/database/service interaction. | Create board from template persists lists/cards. |
| API/contract | Endpoint behavior và permission. | Non-admin create template returns forbidden. |
| UI/e2e | Critical user path và wiring. | Admin creates board from template in browser. |
| Exploratory/manual | Visual feel, copy, ambiguous workflow. | User understands first action checklist. |

Pyramid rule:

- Đẩy rule xuống test level thấp nhất vẫn chứng minh behavior.
- E2E ít nhưng đại diện cho paths quan trọng nhất.
- Manual exploratory nên có charter, không chỉ "click around".

## 7. Automation candidates

| Candidate | Vì sao automate | Suggested level |
| --- | --- | --- |
| Valid template creates board structure. | Core value path, regression risk cao. | Integration + one UI smoke. |
| Invalid template is rejected. | Fast validation rule. | Unit/form test. |
| Non-admin cannot manage template. | Permission/security. | API/contract + UI visibility check. |
| Duplicate create is safe. | Data integrity. | Integration/API negative test. |
| Activation event is emitted. | Success metric dependency. | Unit/instrumentation test. |

Automation rule:

- Automate case có regression value cao hoặc chạy nhiều lần.
- Không automate một visual judgment mơ hồ khi exploratory tốt hơn.
- Mỗi automated test cần owner khi nó fail: product rule, frontend, backend,
  data, infra hoặc analytics.

## 8. Negative and regression coverage

| Coverage type | Example | Why it matters |
| --- | --- | --- |
| Permission negative | Member cannot edit org template. | Bảo vệ trust/security. |
| Validation negative | Missing name/list rejects save. | Tránh bad data. |
| Retry/duplicate | Double-click create creates one board. | Tránh data duplication. |
| Boundary | Template at list/card limit. | Tránh hidden scale bug. |
| Previous bug | Old regression case. | Giữ bug đã fix không quay lại. |

Coverage rule:

- Negative tests nên pin rule quan trọng, không chỉ tăng số lượng test.
- Regression case cần ghi bug/risk mà nó bảo vệ.
- Boundary case nên có expected behavior rõ, không chỉ "does not crash".

## 9. Test data and environment plan

| Need | Data/environment | Owner |
| --- | --- | --- |
| Admin success path | Admin user + valid Project Kickoff template. | QA/Dev. |
| Permission negative | Member user without admin rights. | QA/Dev. |
| Boundary case | Template with max allowed lists/cards. | Backend/QA. |
| Failure simulation | Timeout/error stub or controlled API failure. | Engineering. |
| Analytics verification | Test event sink or captured payload. | Analytics/Engineering. |

Data rule:

- Test data should be explicit and resettable.
- If environment cannot simulate a case, record the nearest proof and residual risk.
- Shared fixtures need naming and cleanup rules to avoid flaky tests.

## 10. CI signal policy

| Signal | Runs when | Team action |
| --- | --- | --- |
| Unit/fast guards | Every commit/PR. | Fix before merge. |
| Integration/API | PR and main branch. | Block if core behavior fails. |
| UI smoke | PR or nightly depending speed. | Investigate wiring/regression. |
| Full e2e/browser matrix | Nightly/release candidate. | Release readiness signal. |
| Flaky quarantine | When test is unstable. | Keep owner and fix date, do not ignore silently. |

CI rule:

- A red required check needs clear owner and expected action.
- Flaky tests are product risk because they teach team to ignore red.
- Slow tests should move to scheduled/release gates only when fast signal still
  protects core behavior.

## 11. Exploratory testing

| Charter | Focus | Notes to capture |
| --- | --- | --- |
| First-time admin setup | Does flow feel clear? | Confusing copy, hesitation, missing hint. |
| Template preview trust | Does preview match created board? | Mismatch, surprise, expectation. |
| Error recovery | Can user retry after failure? | Lost input, unclear message, stuck state. |
| Mobile quick check | Is core path usable enough? | Layout, tap targets, missing controls. |
| Support/debug view | Can support explain failures? | Logs, error codes, user-facing message. |

Exploratory rule:

- Exploratory testing needs a charter, timebox and notes.
- Findings become bug, story, docs/support note or accepted risk.
- Exploratory does not replace automated regression for stable business rules.

## 12. Coverage gaps

| Gap | Why it remains | Follow-up |
| --- | --- | --- |
| Browser matrix not available locally. | Environment lacks Playwright/browser setup. | Run in CI/release gate. |
| Production analytics not observable in sandbox. | Event sink unavailable. | Verify payload locally and monitor after release. |
| Large template performance uncertain. | Fixture too small. | Add load/performance follow-up. |
| Mobile UX not automated. | Visual behavior needs inspection. | Exploratory mobile charter. |
| Third-party integration missing. | External dependency unavailable. | Contract stub + owner handoff. |

Gap rule:

- A gap is acceptable only when recorded with risk and follow-up.
- Do not claim "tested" when only a narrower proof exists.
- Coverage gaps should feed release readiness or backlog follow-up.

## 13. Sample test strategy board

| Scenario | Risk | Test level | Automation | CI signal | Owner |
| --- | --- | --- | --- | --- | --- |
| Admin creates board from valid template | Core flow | Integration + UI smoke | Yes | Required PR/API, nightly UI | Dev/QA |
| Empty template name rejected | Validation | Unit/form | Yes | Required PR | Frontend |
| Member cannot manage template | Permission | API + UI visibility | Yes | Required PR | Backend/QA |
| Duplicate create request safe | Data integrity | Integration/API | Yes | Required PR | Backend |
| User understands first action hint | UX clarity | Exploratory | No | Review checklist | Product/Design |

Sample output:

```text
Story:
Critical scenarios:
Risk ranking:
Test levels:
Automation candidates:
Negative/regression coverage:
Test data/environment:
CI signal:
Exploratory charter:
Coverage gaps:
Owner:
```

## 14. Sample output

Nếu test strategy và automation planning chạy đúng, team sẽ:

- chọn đúng test level cho từng behavior;
- automate case có regression value thật;
- giữ UI tests ít nhưng có ý nghĩa;
- biết CI fail thì ai làm gì;
- ghi coverage gap thật thay vì giả vờ đã kiểm hết.

Kết quả xấu cần tránh:

- mọi scenario đều thành UI test chậm và flaky;
- chỉ có unit test nhưng core user flow vẫn hỏng;
- negative/permission case bị bỏ qua;
- flaky test bị ignore không owner;
- coverage gap không được ghi nên release tự tin quá mức.

## 15. Checklist hoàn thành

- [x] Test strategy inputs đã có.
- [x] Risk-based test planning đã có.
- [x] Test pyramid selection đã có.
- [x] Automation candidates đã có.
- [x] Negative and regression coverage đã có.
- [x] Test data and environment plan đã có.
- [x] CI signal policy đã có.
- [x] Exploratory testing đã có.
- [x] Coverage gaps đã có.
- [x] Sample test strategy board đã có.
- [x] Team biết biến criteria thành test strategy và automation plan.

## 16. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `39 Exercise 31 - Test Strategy and Automation Planning`.

Test strategy tốt giúp team có confidence đúng chỗ: nhanh ở rule nhỏ, sâu ở
integration quan trọng và đủ thật ở user flow cốt lõi.
