# Bài 22 - Quality Gates và Continuous Integration

Trạng thái bài làm: đã hoàn thành playbook để team thiết kế quality gates và
continuous integration policy nhẹ, rõ, giúp phát hiện lỗi sớm mà không biến
delivery thành một chuỗi xin phép nặng nề.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 21. Sau khi team biết map technical debt và chọn
quality investment, team cần biến những quyết định đó thành gate chạy đều:
check nào phải pass trước merge, check nào chỉ cảnh báo, check nào block
release, và ai xử lý khi CI đỏ.

Kết quả cuối cùng của bài là:

- Quality gate types.
- CI signal policy.
- Merge rules.
- Flaky check handling.
- Release gate checklist.
- Gate ownership.
- Sample CI board.

## 2. Bối cảnh

Quality gate thường thất bại theo hai hướng:

- quá lỏng, lỗi lọt qua vì mọi check chỉ là cảnh báo;
- quá nặng, team chờ approval và merge chậm không cần thiết;
- CI đỏ nhưng không ai owner;
- flaky test bị rerun mãi thay vì sửa root cause;
- release gate không rõ, cuối sprint mới phát hiện thiếu evidence;
- quality rule nằm trong đầu người review, không nằm trên board hay pipeline.

Bài này giúp team chọn gate đủ mạnh để bảo vệ chất lượng, nhưng đủ rõ để không
làm nghẽn flow.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- phân biệt gate bắt buộc, warning và release gate;
- viết CI signal policy rõ pass/fail/unstable;
- đặt merge rules phù hợp với risk của work;
- xử lý flaky check bằng owner và deadline;
- tạo release gate checklist có evidence;
- gắn ownership cho từng gate để khi đỏ không bị bỏ mặc.

## 4. Quality gate types

| Gate type | Khi dùng | Ví dụ |
| --- | --- | --- |
| Merge gate | Bắt buộc trước khi code vào main. | Unit test, lint, security guard. |
| Review gate | Cần người đọc hoặc quyết định domain. | Reviewer, PO acceptance note. |
| Release gate | Bắt buộc trước khi ship. | Smoke test, rollback, support handoff. |
| Warning gate | Báo rủi ro nhưng chưa block. | Coverage trend, performance warning. |

Rule:

- Gate phải bảo vệ một risk cụ thể.
- Gate không có owner sẽ thành noise.
- Warning gate cần review cadence; nếu không, nó chỉ là đèn vàng bị bỏ qua.

## 5. CI signal policy

| Signal | Ý nghĩa | Team response |
| --- | --- | --- |
| Green | Required checks pass. | Có thể merge nếu review/AC đủ. |
| Red | Required check fail. | Không merge, owner xử lý root cause. |
| Unstable | Flaky hoặc fail không ổn định. | Tạo flaky item và timebox fix. |
| Skipped | Check không chạy. | Xác định lý do trước khi merge/release. |

Policy rule:

- Red không được bỏ qua bằng rerun vô hạn.
- Skipped check không được xem là pass.
- Nếu check hay unstable, team phải quyết định fix, quarantine có deadline,
  hoặc thay check bằng guard đáng tin hơn.

## 6. Merge rules

| Work type | Required before merge |
| --- | --- |
| Low-risk UI copy | Review + targeted preview/check. |
| Business rule change | Unit/guard test + PO acceptance example. |
| Integration change | Unit + integration/smoke evidence. |
| Security or permission change | Security guard + reviewer with domain context. |
| Release tooling change | Script test + rollback note. |

Merge rule:

- Merge rule theo risk của work, không theo thói quen một size fits all.
- PR/card phải ghi evidence, không chỉ nói "tests pass".
- Nếu merge rule làm chậm flow quá mức, retro cần xem gate nào thiếu giá trị.

## 7. Flaky check handling

| Flaky case | Action | Stop rule |
| --- | --- | --- |
| Test fail/pass ngẫu nhiên | Tạo flaky card có owner. | Không quá 2 sprint không owner. |
| External dependency chập chờn | Mock/stub hoặc tách contract check. | Không dùng làm required gate nếu không ổn định. |
| Timing-sensitive UI test | Fix wait/signal hoặc giảm scope test. | Không rerun thủ công quá 2 lần. |
| CI resource issue | Ghi infra evidence và escalation. | Gate quay lại required khi ổn định. |

Flaky rule:

- Flaky test là product risk vì nó làm team mất niềm tin vào signal.
- Quarantine phải có owner, reason và review date.
- Không xóa check chỉ để pipeline xanh nếu risk vẫn còn.

## 8. Release gate checklist

| Gate | Evidence cần có | Owner |
| --- | --- | --- |
| Smoke test | Main flows pass trên build/release candidate. | QA |
| Migration/data risk | Backup/rollback note hoặc dry run. | Dev lead |
| Support readiness | FAQ, known issues, escalation path. | Support + PO |
| Monitoring | Metric/log/dashboard cần xem sau release. | Dev + ops |
| Go/no-go | Decision note ghi risk còn lại. | PO + team |

Release gate rule:

- Release gate phải được chuẩn bị trước ngày release, không chờ cuối sprint.
- Gate thiếu evidence là "not ready", không phải "nhớ là đã làm".
- Nếu bỏ qua gate, phải ghi explicit risk acceptance.

## 9. Gate ownership

| Gate | Owner giữ rule | Owner khi fail |
| --- | --- | --- |
| Unit/lint | Dev team | Author + reviewer |
| Acceptance examples | PO | PO + author |
| Smoke test | QA | QA + dev helper |
| Release handoff | Support + PO | Support owner |
| Security guard | Dev lead | Domain reviewer |

Ownership rule:

- Owner giữ rule khác với owner sửa fail.
- Khi gate đỏ, Daily Scrum phải thấy owner và next action.
- Gate lâu không fail hoặc không ai dùng vẫn cần review để tránh ceremony dư.

## 10. Sample CI board

| Gate item | Signal | Owner | Decision | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Invite unit tests | Red | Dev Minh | Fix now | Failed test log. | In progress |
| Mobile smoke | Green | QA An | Release gate passed | Smoke checklist. | Done |
| Coverage trend | Warning | Dev team | Track later | Trend note. | Watching |
| Payment flaky test | Unstable | QA + backend | Quarantine with deadline | Flaky card. | Ready |
| Support FAQ | Skipped | Support Vy | Block release until attached | FAQ link missing. | Blocked |

Sample output:

```text
Gate:
Signal:
Required or warning:
Owner:
Decision:
Evidence:
Next review:
```

## 11. Sample output

Nếu quality gates chạy đúng, team sẽ:

- phát hiện lỗi sớm hơn;
- merge/release dựa trên evidence thay vì cảm giác;
- xử lý flaky check như một risk thật;
- biết check nào block và check nào chỉ cảnh báo;
- giữ flow nhanh hơn vì rule rõ, owner rõ.

Kết quả xấu cần tránh:

- gate quá nhiều nhưng không bảo vệ risk cụ thể;
- CI đỏ nhưng mọi người chỉ rerun;
- skipped check bị xem như pass;
- release gate chỉ xuất hiện khi đã sát giờ ship.

## 12. Checklist hoàn thành

- [x] Quality gate types đã có.
- [x] CI signal policy đã có.
- [x] Merge rules đã có.
- [x] Flaky check handling đã có.
- [x] Release gate checklist đã có.
- [x] Gate ownership đã có.
- [x] Sample CI board đã có.
- [x] Team biết dùng gate để bảo vệ chất lượng mà không làm nghẽn flow.

## 13. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `30 Exercise 22 - Quality Gates and Continuous Integration`.

Quality gates tốt giúp team tin vào pipeline, tin vào release và dành ít thời
gian hơn cho những lỗi đáng ra đã bị bắt sớm.
