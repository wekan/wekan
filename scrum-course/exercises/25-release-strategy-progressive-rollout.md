# Bài 25 - Release Strategy và Progressive Rollout

Trạng thái bài làm: đã hoàn thành playbook để team chọn release strategy,
thiết kế progressive rollout, theo dõi signal và quyết định expand/rollback
bằng evidence thay vì launch một lần quá rủi ro.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 24. SLO và operational readiness giúp team biết sản
phẩm đã đủ điều kiện launch hay chưa. Bước tiếp theo là chọn cách launch: mở
cho ai trước, bật bằng feature flag nào, theo dõi signal nào, lúc nào mở rộng
và lúc nào rollback.

Kết quả cuối cùng của bài là:

- Rollout strategies.
- Feature flag rules.
- Canary/phased rollout plan.
- Rollback triggers.
- Launch cohort rules.
- Monitoring cadence.
- Go/expand/rollback decision rules.
- Sample rollout board.

## 2. Bối cảnh

Team Scrum nhỏ thường release theo kiểu "xong thì bật cho tất cả" nên rủi ro
dồn vào một thời điểm:

- tính năng mới ảnh hưởng user thật trước khi monitor đủ tốt;
- rollout không có cohort nên khi lỗi xảy ra khó khoanh vùng;
- feature flag tồn tại nhưng không có owner hoặc điều kiện tắt;
- canary thành hình thức vì không ai đọc signal sau khi bật;
- rollback trigger mơ hồ, chỉ quyết khi đã có customer phàn nàn;
- support, sales và stakeholder không biết nhóm user nào đã được mở.

Bài này giúp team biến readiness evidence thành kế hoạch rollout có kiểm soát.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- chọn release strategy phù hợp với mức rủi ro;
- dùng feature flag để giảm blast radius;
- thiết kế canary hoặc phased rollout có cohort rõ;
- đặt rollback trigger trước khi launch;
- theo dõi SLO, support signal và product metric trong rollout window;
- quyết định go, expand, hold hoặc rollback bằng rule đã thống nhất.

## 4. Rollout strategies

| Strategy | Khi dùng | Lưu ý |
| --- | --- | --- |
| Dark launch | Backend/path mới cần chạy trước UI. | Monitor technical signal, chưa tạo user impact. |
| Feature flag | Cần bật/tắt nhanh theo cohort. | Flag phải có owner và cleanup date. |
| Canary | Rủi ro cao, cần thử với nhóm nhỏ. | Canary phải có success/stop criteria. |
| Phased rollout | Cần mở rộng theo phần trăm hoặc nhóm user. | Mỗi phase cần review signal trước khi expand. |
| Big bang | Thay đổi nhỏ, rollback rõ, blast radius thấp. | Vẫn cần release note và monitoring window. |

Strategy rule:

- Strategy phải khớp với risk, không chọn vì thói quen.
- Rủi ro càng cao thì blast radius ban đầu càng nhỏ.
- Nếu rollback khó, rollout phải chậm hơn và monitor nhiều hơn.

## 5. Feature flag rules

| Rule | Câu hỏi kiểm tra |
| --- | --- |
| Owner | Ai có quyền bật/tắt flag trong rollout window? |
| Default state | User chưa vào cohort sẽ thấy behavior nào? |
| Kill switch | Tắt flag có đủ nhanh và an toàn không? |
| Cleanup | Khi nào xóa flag để tránh nợ kỹ thuật? |
| Audit | Team ghi lại ai bật, lúc nào, vì sao không? |

Feature flag rule:

- Flag là công cụ release, không phải chỗ giấu work chưa xong.
- Flag nguy hiểm phải fail closed hoặc có fallback rõ.
- Mỗi flag cần cleanup backlog item nếu tồn tại sau rollout.

## 6. Canary và phased rollout plan

| Phase | Cohort | Success signal | Decision |
| --- | --- | --- | --- |
| Canary 1 | Internal users | No Sev2, SLO healthy trong 2 giờ. | Expand hoặc fix. |
| Canary 2 | 5% beta users | Error rate không tăng quá threshold. | Expand 25% nếu healthy. |
| Phase 3 | 25% normal users | Support tickets không tăng bất thường. | Expand 50% hoặc hold. |
| Phase 4 | 100% users | SLO healthy trong watch window. | Finish rollout + cleanup flag. |

Planning rule:

- Mỗi phase cần cohort, watch window, owner và decision time.
- Không expand nếu signal chưa đủ dữ liệu.
- Nếu phase bị hold, backlog phải ghi gap cụ thể cần xử lý.

## 7. Rollback triggers

| Trigger | Ví dụ | Action |
| --- | --- | --- |
| SLO breach | Checkout success dưới 99.5%. | Disable flag hoặc rollback release. |
| Error spike | Error rate tăng gấp 2 lần baseline. | Hold expansion, start incident triage. |
| Support spike | Ticket cùng pattern tăng nhanh. | Pause rollout, update support note. |
| Data mismatch | Payment/order mismatch xuất hiện. | Rollback ngay, protect data. |
| Manual confidence drop | Owner không còn hiểu risk. | Stop expansion, review evidence. |

Rollback rule:

- Trigger phải viết trước launch, không viết khi đang hoảng.
- Rollback là một decision bình thường, không phải thất bại cá nhân.
- Nếu rollback không thể nhanh, cần mitigation plan thay thế.

## 8. Launch cohort rules

| Cohort type | Cách chọn | Risk |
| --- | --- | --- |
| Internal | Team/support/stakeholder dùng trước. | Ít user impact nhưng tín hiệu hạn chế. |
| Beta users | Nhóm chấp nhận thử sớm. | Feedback tốt nhưng có thể không đại diện. |
| Low-risk segment | User ít phụ thuộc flow critical. | Giảm damage nếu lỗi. |
| Geography/timezone | Mở theo khu vực hoặc giờ support trực. | Cần tránh thiên lệch data. |
| Paid/high-value users | Chỉ dùng khi value/risk đã rất rõ. | Blast radius business cao. |

Cohort rule:

- Cohort phải giúp học điều gì đó, không chỉ chia nhỏ cho có.
- Không chọn cohort làm team hiểu sai risk thật.
- Support phải biết cohort nào đã được bật.

## 9. Monitoring cadence

| Moment | Ai xem | Cần xem gì |
| --- | --- | --- |
| T-30 phút | Release owner | Readiness, flag state, rollback path. |
| T+15 phút | Dev + QA | Error, latency, logs, smoke path. |
| T+1 giờ | PO + support | Support signal, product metric, user feedback. |
| Mỗi phase | Whole team hoặc đại diện | SLO, trigger, expand/hold decision. |
| T+24 giờ | Team | Cleanup, follow-up backlog, learning note. |

Cadence rule:

- Monitoring window phải có người thật chịu trách nhiệm.
- Signal technical và customer/support đều cần được đọc.
- Nếu không ai đọc signal, rollout chưa thật sự được kiểm soát.

## 10. Go/expand/rollback decision rules

| Decision | Khi chọn | Output |
| --- | --- | --- |
| Go | Readiness đủ, phase đầu có owner và trigger. | Start phase + timestamp. |
| Expand | Watch window healthy và không có stop trigger. | Mở phase kế tiếp + note evidence. |
| Hold | Signal chưa đủ hoặc risk chưa hiểu rõ. | Gap item + next review time. |
| Rollback | Stop trigger xảy ra hoặc data/user risk cao. | Disable/rollback + incident or fix card. |
| Finish | 100% healthy qua watch window. | Cleanup flag + release summary. |

Decision rule:

- Decision phải để lại evidence trên card hoặc release board.
- Không expand bằng cảm giác "có vẻ ổn".
- Nếu decision không rõ, chọn hold để lấy thêm evidence.

## 11. Sample rollout board

| Item | Strategy | Cohort | Signal | Decision | Status |
| --- | --- | --- | --- | --- | --- |
| New checkout flow | Feature flag + canary | 5% beta users | Success rate, payment mismatch | Hold until T+1h | Watching |
| Invite email redesign | Phased rollout | 25% free users | Delivery freshness, support tickets | Expand to 50% | In progress |
| API cache change | Dark launch | Internal traffic shadow | Latency P95, error rate | Go with watch | Ready |
| Billing export | Big bang | All admins | Smoke test, support channel | Finish + monitor 24h | Done |

Sample output:

```text
Release item:
Strategy:
Initial cohort:
Feature flag:
Watch window:
Success signal:
Rollback trigger:
Decision rule:
Next phase:
Owner:
```

## 12. Sample output

Nếu release strategy và progressive rollout chạy đúng, team sẽ:

- launch thay đổi lớn bằng các bước nhỏ có evidence;
- giảm blast radius khi lỗi xuất hiện;
- biết rõ ai đang được bật tính năng;
- expand khi signal khỏe, hold khi evidence thiếu và rollback khi trigger xảy ra;
- dọn feature flag sau rollout để tránh debt.

Kết quả xấu cần tránh:

- rollout nhiều phase nhưng không ai đọc signal;
- feature flag không có owner hoặc cleanup;
- chọn cohort không đại diện rồi hiểu sai risk;
- rollback trigger mơ hồ khiến team tranh luận khi áp lực cao;
- mở 100% chỉ vì deadline, bỏ qua SLO/readiness evidence.

## 13. Checklist hoàn thành

- [x] Rollout strategies đã có.
- [x] Feature flag rules đã có.
- [x] Canary/phased rollout plan đã có.
- [x] Rollback triggers đã có.
- [x] Launch cohort rules đã có.
- [x] Monitoring cadence đã có.
- [x] Go/expand/rollback decision rules đã có.
- [x] Sample rollout board đã có.
- [x] Team biết launch theo phase và quyết định bằng evidence.

## 14. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `33 Exercise 25 - Release Strategy and Progressive Rollout`.

Progressive rollout tốt giúp team ship đều hơn vì rủi ro được chia nhỏ, đo
được và có đường quay lại rõ ràng.
