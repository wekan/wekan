# Bài 4 - Sprint Review, Retrospective và Feedback Loop

Trạng thái bài làm: đã hoàn thành bản playbook để team kết thúc sprint bằng
feedback thật, quyết định backlog rõ ràng và action cải thiện có owner.

## 1. Bài này nói về gì?

Bài tập này thiết kế cách chạy Sprint Review và Sprint Retrospective cho team
phần mềm mini. Mục tiêu là biến sprint thành vòng học hỏi thật: demo working
increment, ghi feedback, cập nhật Product Backlog, nhìn metric và chọn hành
động cải thiện cho sprint sau.

Kết quả cuối cùng của bài là:

- Agenda Sprint Review.
- Format ghi feedback và quyết định.
- Rule accept/rework item.
- Agenda Retrospective.
- Metric review và improvement actions.
- Sample output sau một sprint.

## 2. Bối cảnh

Từ Bài 3, Sprint 1 có mục tiêu:

```text
Giúp owner của doanh nghiệp nhỏ tạo board đầu tiên, mời teammate và bắt đầu
làm việc với starter workflow trong dưới 10 phút.
```

Team đã hoàn thành một increment có thể demo. Bài 4 trả lời hai câu hỏi:

1. Increment này có thật sự tạo giá trị cho user/stakeholder không?
2. Team cần thay đổi cách làm gì trong sprint tiếp theo?

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- Chạy Sprint Review không biến thành báo cáo status.
- Ghi feedback dưới dạng insight và backlog decision.
- Phân biệt item Done, accepted, rework và follow-up.
- Dùng metric để nhìn flow, không chỉ cảm giác.
- Kết thúc Retrospective bằng 1-2 action có owner và cách đo.

## 4. Sprint Review agenda

| Phần | Thời lượng | Người dẫn | Output |
| --- | ---: | --- | --- |
| Nhắc Sprint Goal | 5 phút | Product Owner | Cả phòng hiểu mục tiêu sprint. |
| Demo increment | 20 phút | Developers/QA | Flow tạo board, invite teammate và starter lists được demo. |
| Stakeholder feedback | 20 phút | Product Owner | Feedback notes được ghi theo format chuẩn. |
| Product decision | 10 phút | Product Owner | Item accepted/rework/follow-up rõ ràng. |
| Backlog update | 15 phút | Product Owner + team | Product Backlog có item mới hoặc reorder. |

Review rule:

- Demo sản phẩm chạy được, không demo slide thay cho increment.
- Người xem phản hồi theo user outcome, không chỉ sở thích UI.
- Mỗi feedback phải có decision: accept, rework, follow-up hoặc discard.
- Product Backlog được cập nhật trong hoặc ngay sau Review.

## 5. Feedback capture format

```text
Feedback:
Source:
Evidence:
Impact:
Decision: accept / rework / follow-up / discard
Backlog action:
Owner:
Due:
```

Ví dụ:

| Feedback | Source | Impact | Decision | Backlog action |
| --- | --- | --- | --- | --- |
| User không hiểu khác nhau giữa invite pending và failed. | Support | Giảm khả năng tự xử lý lỗi invite. | Follow-up | Thêm item "Invite status explanation". |
| Starter lists Todo/Doing/Done đủ cho lần đầu. | 2 users | Giữ onboarding đơn giản. | Accept | Không thêm template trong Sprint 1. |
| Empty state cần CTA lớn hơn trên mobile. | Stakeholder | Ảnh hưởng activation mobile. | Rework | Rework item tạo board đầu tiên trước release. |

## 6. Accept/rework rules

Một item được accept khi:

- Acceptance criteria pass.
- Demo đúng flow user.
- Không có bug critical/high mở.
- Product Owner đồng ý item đạt Sprint Goal.

Một item quay lại rework khi:

- Có acceptance criteria fail.
- User flow chính bị khó hiểu hoặc không hoàn tất được.
- Feedback làm thay đổi điều kiện accept trong phạm vi Sprint Goal.
- Defect ảnh hưởng onboarding hoặc dữ liệu người dùng.

Follow-up backlog item được tạo khi:

- Feedback có giá trị nhưng không cần chặn release.
- Ý tưởng nằm ngoài Sprint Goal.
- Cần thêm discovery trước khi build.

## 7. Retrospective agenda

| Phần | Thời lượng | Câu hỏi |
| --- | ---: | --- |
| Set the stage | 5 phút | Sprint này team muốn học gì? |
| Review facts | 10 phút | Done gì, chưa Done gì, metric nói gì? |
| Generate insight | 20 phút | Bottleneck, waste và pattern nào lặp lại? |
| Decide actions | 15 phút | 1-2 thay đổi nào đáng thử sprint sau? |
| Close | 5 phút | Ai làm gì, đo bằng gì, khi nào check? |

Retrospective rule:

- Nói về hệ thống làm việc, không đổ lỗi cá nhân.
- Dùng evidence từ board, metric và Review feedback.
- Chọn ít action nhưng làm thật.
- Action phải có owner, deadline và success signal.

## 8. Metric review

| Metric | Kết quả Sprint 1 | Insight | Action |
| --- | ---: | --- | --- |
| Throughput | 4/5 item Done | Item invite status bị rework. | Refine negative states sớm hơn. |
| Cycle time | 2.4 ngày trung bình | Code Review ổn, QA hơi dồn cuối sprint. | QA test khi item đầu tiên vào review. |
| WIP aging | 1 card kẹt 4 ngày | Invite email phụ thuộc service ngoài. | Check dependency trong Refinement. |
| Review feedback count | 7 notes | Review có feedback thật. | Giữ format feedback capture. |
| Escaped defects | 0 critical | Release candidate đủ an toàn. | Smoke onboarding trước release. |

## 9. Improvement actions

Action format:

```text
Action:
Why:
Owner:
Due:
Success signal:
```

Action được chọn cho sprint sau:

1. QA tham gia refinement của mọi item có user-facing flow.
   - Owner: QA Engineer.
   - Due: trước Sprint Planning tiếp theo.
   - Success signal: mỗi item Ready có ít nhất một negative test note.
2. PO ghi rõ dependency/service ngoài trong backlog item.
   - Owner: Product Owner.
   - Due: trong Backlog Refinement.
   - Success signal: không card nào bị kẹt quá 3 ngày vì dependency bất ngờ.

## 10. Sample output sau Review và Retro

| Output | Nội dung |
| --- | --- |
| Accepted increment | Create board, starter lists, invite email, failed invite log. |
| Rework before release | Empty state CTA trên mobile. |
| Follow-up backlog | Invite status explanation, resend failed invite, onboarding checklist. |
| Retro action 1 | QA tham gia refinement cho user-facing flow. |
| Retro action 2 | PO ghi dependency/service ngoài trong backlog item. |
| Metric to watch | WIP aging và Review feedback count. |

## 11. Checklist hoàn thành

- [x] Sprint Review agenda đã có.
- [x] Feedback capture format đã có.
- [x] Accept/rework/follow-up rules đã rõ.
- [x] Retrospective agenda đã có.
- [x] Metric review đã có insight và action.
- [x] Improvement actions có owner và success signal.
- [x] Sample output sau Review/Retro đã có.
- [x] Backlog update loop đã rõ.

## 12. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `12 Exercise 4 - Sprint Review and Retrospective Feedback Loop`.

Các feedback notes nên được chuyển thành card mới hoặc checklist trong Product
Backlog ngay sau Sprint Review.
