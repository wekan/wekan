# Bài 23 - Incident Response và Production Learning

Trạng thái bài làm: đã hoàn thành playbook để team xử lý sự cố production
bình tĩnh, khôi phục service, giao tiếp rõ ràng và biến root cause thành cải
tiến backlog.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 22. Quality gates và CI giúp bắt lỗi sớm, nhưng không
có gate nào bắt được mọi rủi ro. Team Scrum cần biết phản ứng khi production
vẫn gặp sự cố: phân loại severity, chia vai trò, chọn mitigation/rollback,
thông báo stakeholder và học lại sau incident.

Kết quả cuối cùng của bài là:

- Severity levels.
- Incident roles.
- Response workflow.
- Communication rules.
- Mitigation and rollback decisions.
- Post-incident review.
- Learning backlog.
- Sample incident board.

## 2. Bối cảnh

Incident thường trở nên tệ hơn vì team thiếu nhịp phản ứng:

- mọi người cùng nhảy vào nhưng không ai lead;
- severity không rõ nên stakeholder nhận thông tin quá muộn;
- người sửa lỗi cũng phải trả lời khách hàng;
- rollback bị tranh luận khi đang áp lực;
- root cause review biến thành đổ lỗi;
- incident xong nhưng không có follow-up backlog item.

Bài này giúp team giữ bình tĩnh bằng rule rõ, owner rõ và evidence rõ.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- phân loại incident theo severity và customer impact;
- chọn incident roles đủ nhỏ cho team Scrum;
- chạy response workflow từ detect tới resolved;
- giao tiếp status update theo cadence rõ;
- quyết định mitigate, rollback hoặc hotfix bằng risk;
- tổ chức post-incident review không đổ lỗi;
- đưa learning action vào backlog có owner và success signal.

## 4. Severity levels

| Severity | Signal | Response |
| --- | --- | --- |
| Sev1 | Service chính down hoặc mất dữ liệu. | Incident lead ngay, update liên tục. |
| Sev2 | Flow quan trọng lỗi với nhiều user. | Mitigate/hotfix trong ngày. |
| Sev3 | Bug production có workaround. | Triage, schedule fix, monitor. |
| Sev4 | Cosmetic hoặc low-impact issue. | Backlog bình thường. |

Severity rule:

- Severity dựa trên customer impact, không dựa trên ai báo lỗi to hơn.
- Có thể hạ/nâng severity khi evidence đổi.
- Mỗi severity cần response cadence và owner rõ.

## 5. Incident roles

| Role | Trách nhiệm |
| --- | --- |
| Incident lead | Điều phối, giữ timeline và quyết định next action. |
| Fix owner | Điều tra và sửa/mitigate technical cause. |
| Communicator | Gửi status update cho stakeholder/support/customer. |
| Verifier | Kiểm fix, monitor signal và xác nhận resolved. |
| Scribe | Ghi timeline, decision, evidence và follow-up. |

Role rule:

- Một người có thể giữ nhiều role nếu team nhỏ, nhưng role phải được nói rõ.
- Người đang fix không nên là người duy nhất giao tiếp ra ngoài.
- Scribe giúp post-incident review dựa trên evidence thay vì trí nhớ.

## 6. Response workflow

| Step | Action | Output |
| --- | --- | --- |
| 1 | Detect và confirm impact. | Incident record + severity. |
| 2 | Assign roles. | Lead, fix owner, communicator, verifier. |
| 3 | Stabilize hoặc mitigate. | Customer impact giảm. |
| 4 | Decide hotfix/rollback/track. | Decision note rõ. |
| 5 | Verify recovery. | Monitoring/test evidence. |
| 6 | Close incident và schedule review. | Timeline + review slot. |

Incident record format:

```text
Incident:
Severity:
Customer impact:
Detected at:
Roles:
Current status:
Next update:
Recovery decision:
```

Rule:

- Không bắt đầu bằng blame; bắt đầu bằng impact và next action.
- Mỗi update phải nói trạng thái hiện tại, việc đang làm và update kế tiếp.
- Resolved chỉ khi verifier thấy evidence, không chỉ khi fix được deploy.

## 7. Communication rules

| Audience | Cần biết gì | Cadence |
| --- | --- | --- |
| Scrum team | Impact, owner, next action. | Ngay khi incident mở. |
| Stakeholder | Severity, user impact, ETA hoặc next update. | Theo severity. |
| Support | Workaround, known issue, customer message. | Khi có mitigation. |
| Customer-facing note | Vấn đề, ảnh hưởng, trạng thái, next update. | Nếu policy yêu cầu. |

Communication rule:

- Đừng hứa ETA khi chưa có evidence; hứa thời điểm update tiếp theo.
- Status update ngắn, rõ, không có jargon thừa.
- Nếu impact thay đổi, communicator cập nhật severity và audience ngay.

## 8. Mitigation and rollback decisions

| Option | Khi chọn | Risk |
| --- | --- | --- |
| Mitigation | Có workaround giảm impact nhanh. | Có thể để lại manual step. |
| Hotfix | Root cause rõ, fix nhỏ, test được nhanh. | Regression nếu gate thiếu. |
| Rollback | Release mới gây lỗi và rollback an toàn hơn fix. | Mất feature mới. |
| Track as bug | Impact thấp hoặc có workaround ổn. | Cần review date rõ. |

Decision rule:

- Chọn cách giảm customer impact trước, tối ưu code đẹp sau.
- Hotfix vẫn cần quality gate tối thiểu.
- Rollback không phải thất bại; nó là một recovery option nếu rủi ro thấp hơn.

## 9. Post-incident review

| Review area | Câu hỏi |
| --- | --- |
| Detection | Team phát hiện bằng monitor, customer hay tình cờ? |
| Response | Role và communication có rõ không? |
| Recovery | Mitigation/rollback/hotfix có đúng trade-off không? |
| Prevention | Gate, test, docs hoặc workflow nào cần đổi? |
| Learning | Follow-up item nào vào backlog và owner là ai? |

Review rule:

- Blameless không có nghĩa là vague; vẫn phải nói rõ system gap.
- Review nên diễn ra sớm khi timeline còn mới.
- Mỗi action phải có owner, success signal và due/review date.

## 10. Learning backlog

| Learning item | Source | Owner | Success signal |
| --- | --- | --- | --- |
| Add payment smoke check | Sev2 payment incident. | QA + dev | Smoke catches failed payment path. |
| Update rollback runbook | Rollback decision chậm. | Dev lead | Rollback dry run under 15 minutes. |
| Support status template | Customer comms lúng túng. | Support | Template used in next incident. |
| Monitor invite failures | Detection by customer only. | Dev + ops | Alert fires before customer report. |

Backlog rule:

- Incident action không được nằm trong meeting note mãi.
- Preventive action phải đủ nhỏ để sprint sau làm được.
- Nếu action quá lớn, split thành first slice và decision item.

## 11. Sample incident board

| Incident | Severity | Lead | Recovery decision | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Payment timeout | Sev2 | Linh | Mitigate + hotfix | Error rate down. | Monitoring |
| Invite email fail | Sev3 | Minh | Track bug + workaround | Support note sent. | Ready |
| Release config error | Sev1 | Nam | Rollback | Service restored. | Review scheduled |
| Mobile crash spike | Sev2 | QA An | Hotfix | Crash rate normal. | Resolved |

Sample output:

```text
Incident:
Severity:
Timeline:
Roles:
Recovery decision:
Customer/status updates:
Root cause:
Learning backlog:
```

## 12. Checklist hoàn thành

- [x] Severity levels đã có.
- [x] Incident roles đã có.
- [x] Response workflow đã có.
- [x] Communication rules đã có.
- [x] Mitigation and rollback decisions đã có.
- [x] Post-incident review đã có.
- [x] Learning backlog đã có.
- [x] Sample incident board đã có.
- [x] Team biết biến incident thành cải tiến không đổ lỗi.

## 13. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `31 Exercise 23 - Incident Response and Production Learning`.

Incident response tốt giúp team không chỉ chữa cháy nhanh hơn, mà còn học cách
giảm xác suất lặp lại cùng một loại sự cố.
