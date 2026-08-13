# Bài 5 - Release Readiness và Handoff

Trạng thái bài làm: đã hoàn thành bản checklist và playbook để team chuyển
increment đã được accept ở Sprint Review sang trạng thái release/deployable có
kiểm soát.

## 1. Bài này nói về gì?

Bài tập này giúp team không dừng ở "Done trong sprint" mà biết cách chuẩn bị
release: kiểm chất lượng, quyết định go/no-go, viết release note, chuẩn bị
rollback, bàn giao cho support và theo dõi sau khi release.

Kết quả cuối cùng của bài là:

- Release readiness checklist.
- Go/no-go decision format.
- Risk và rollback plan.
- Release note ngắn.
- Support handoff.
- Post-release monitoring loop.

## 2. Bối cảnh

Từ Bài 4, Sprint Review đã accept phần lớn increment cho onboarding:

- Create board.
- Starter lists.
- Invite teammate.
- Failed invite log.

Còn một rework nhỏ: empty state CTA trên mobile. Sau khi rework pass, team cần
quyết định có release được không và bàn giao thông tin cho support.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- Biết item nào đủ release và item nào chỉ mới Done nội bộ.
- Chạy go/no-go meeting ngắn, có evidence.
- Có rollback plan trước khi deploy.
- Viết release note mà user/support hiểu được.
- Theo dõi metric sau release và phản hồi nhanh nếu có incident.

## 4. Release readiness checklist

| Nhóm | Checklist | Evidence |
| --- | --- | --- |
| Product | Sprint Goal đạt hoặc có decision chấp nhận scope. | PO accepted Review output. |
| Quality | Acceptance criteria pass, không có blocker critical/high. | QA checklist và bug list. |
| UX | Empty state và invite flow kiểm desktop/mobile. | Screenshot hoặc QA note. |
| Tech | Code reviewed, test liên quan pass, deploy script sẵn sàng. | PR/check logs. |
| Data/privacy | Không expose email/token/log nhạy cảm. | Security/privacy review note. |
| Support | Known issues, FAQ và escalation path rõ. | Support handoff note. |
| Rollback | Có cách revert hoặc disable feature. | Rollback owner và command/runbook. |
| Monitoring | Metric và alert cần xem sau release đã chọn. | Monitoring checklist. |

## 5. Go/no-go decision meeting

Timebox: 20 phút.

| Phần | Câu hỏi | Output |
| --- | --- | --- |
| Goal check | Increment có đạt Sprint Goal không? | Go / conditional go / no-go. |
| Risk check | Risk nào còn mở, impact ra sao? | Risk owner và mitigation. |
| Support check | Support có đủ context chưa? | Handoff accepted hoặc thiếu gì. |
| Rollback check | Nếu release lỗi, rollback thế nào? | Rollback path được xác nhận. |
| Decision | Ai chốt quyết định? | Release decision note. |

Decision format:

```text
Decision: go / conditional go / no-go
Reason:
Scope included:
Known issues:
Rollback owner:
Monitoring owner:
Decision by:
Time:
```

## 6. Risk và rollback plan

| Risk | Trigger | Rollback/mitigation |
| --- | --- | --- |
| Invite email không gửi được | Email failure rate tăng sau release. | Disable invite email, giữ failed invite log và resend sau. |
| Empty state gây nhầm trên mobile | Activation mobile giảm hoặc support ticket tăng. | Revert CTA layout hoặc bật copy cũ. |
| Starter lists tạo sai | Board mới thiếu Todo/Doing/Done. | Hotfix default list creation, script audit board mới. |
| Support thiếu context | Ticket lặp lại cùng câu hỏi. | Publish FAQ nhanh và update support macro. |

Rollback rule:

- Rollback owner phải online trong release window.
- Rollback path phải được đọc trước khi deploy.
- Nếu metric xấu vượt threshold, không tranh luận dài trong incident; rollback
  trước, phân tích sau.

## 7. Release note mẫu

```text
New onboarding flow for small business owners

Owners can now create their first board, start with Todo/Doing/Done lists, and
invite teammates by email. Failed invites are logged so support can help faster.

Known issue:
- On small mobile screens, the empty-state CTA has been adjusted and should be
  monitored for activation impact.
```

## 8. Support handoff

Support cần nhận:

- What changed: flow tạo board đầu tiên và invite teammate.
- Who is affected: owner mới của doanh nghiệp nhỏ.
- Expected behavior: board mới có Todo/Doing/Done; invite email có CTA rõ.
- Known issues: lỗi email hiển thị trạng thái failed và có log để kiểm tra.
- Escalation: Product Owner cho UX/content, DevOps cho email delivery.
- Links: release note, rollback note, dashboard monitoring.

Support macro mẫu:

```text
Bạn có thể tạo board đầu tiên từ màn hình bắt đầu. Sau khi tạo board, hệ thống
tự thêm Todo, Doing và Done để bạn bắt đầu ngay. Nếu lời mời email bị lỗi, hãy
gửi lại invite hoặc liên hệ support với email người nhận.
```

## 9. Post-release monitoring

| Metric | Window | Threshold | Action |
| --- | --- | --- | --- |
| Board creation success rate | 24 giờ đầu | Giảm hơn 10% so với baseline. | Điều tra logs, cân nhắc rollback. |
| Invite email failure rate | 24 giờ đầu | Tăng trên 5%. | Check email provider và failed invite log. |
| Mobile empty-state activation | 3 ngày | Giảm hơn 15%. | Rework CTA/copy hoặc revert layout. |
| Support ticket count | 3 ngày | Tăng hơn 20%. | Update FAQ, add in-app copy. |
| Escaped defects | 1 tuần | Có bug high/critical. | Incident response và RCA. |

Monitoring loop:

1. Release owner kiểm dashboard sau 1 giờ, 24 giờ và 3 ngày.
2. Support gửi top questions mỗi ngày trong 3 ngày đầu.
3. PO tạo follow-up backlog items từ metric/feedback thật.
4. Retrospective sprint sau xem release có đạt outcome không.

## 10. Incident response nhẹ

Khi có incident sau release:

- Triage severity.
- Ghi user impact và thời điểm bắt đầu.
- Chọn rollback/hotfix/monitor.
- Cập nhật support message.
- Sau khi ổn định, tạo RCA ngắn: nguyên nhân, phát hiện, xử lý, phòng ngừa.

## 11. Checklist hoàn thành

- [x] Release readiness checklist đã có.
- [x] Go/no-go decision format đã có.
- [x] Risk và rollback plan đã rõ.
- [x] Release note mẫu đã có.
- [x] Support handoff đã có.
- [x] Post-release monitoring metrics đã có threshold/action.
- [x] Incident response nhẹ đã có.
- [x] Monitoring loop quay lại Product Backlog đã rõ.

## 12. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `13 Exercise 5 - Release Readiness and Handoff`.

Các release decision, known issues và monitoring actions nên nằm trong card
release để Review/Retro sprint sau có evidence thật.
