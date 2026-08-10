# Bài 15 - Working Agreement và Team Operating Rules

Trạng thái bài làm: đã hoàn thành playbook để team tạo working agreement rõ
ràng, giúp Scrum events, board policies và collaboration rules được vận hành
nhất quán mỗi ngày.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 14. Sau khi team đã biết estimate bằng cùng một thang
size, team cần một bộ luật vận hành chung để các cam kết trong sprint không bị
phụ thuộc vào thói quen riêng của từng người.

Kết quả cuối cùng của bài là:

- Working agreement principles.
- Meeting rules.
- Communication rules.
- WIP and blocker policies.
- Quality agreements.
- Decision and escalation rules.
- Sample working agreement.

## 2. Bối cảnh

Scrum không tự chạy tốt chỉ vì team có đủ event. Nếu không có agreement:

- Daily Scrum dễ thành báo cáo cá nhân;
- refinement kéo dài nhưng không ra item Ready;
- blocker bị nhắc miệng rồi trôi mất;
- code review và QA bị dồn về cuối sprint;
- quyết định nhỏ phải chờ quá lâu;
- conflict bị né tránh thay vì xử lý sớm.

Bài này biến các kỳ vọng ngầm thành luật vận hành rõ để team có thể nhắc nhau
mà không biến mọi thứ thành cảm tính.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- viết working agreement ngắn, cụ thể và có thể dùng hằng ngày;
- thống nhất luật cho Scrum events;
- đặt communication rules cho async và sync work;
- giới hạn WIP và xử lý blocker đúng lúc;
- chốt quality agreement trước khi vào Done;
- biết khi nào tự quyết, khi nào escalate.

## 4. Working agreement principles

| Principle | Ý nghĩa |
| --- | --- |
| Observable | Rule phải nhìn thấy được trên board, calendar hoặc artifact. |
| Lightweight | Chỉ giữ rule thật sự giúp team làm việc tốt hơn. |
| Mutual | Agreement là cam kết hai chiều, không phải mệnh lệnh một chiều. |
| Reviewable | Agreement phải được review lại trong Retrospective. |

Rule:

- Agreement càng dài càng khó dùng.
- Mỗi rule phải có owner hoặc trigger rõ.
- Rule không còn hữu ích thì sửa, không giữ vì đã từng viết.

## 5. Meeting rules

| Event | Rule | Output |
| --- | --- | --- |
| Daily Scrum | 15 phút, nói quanh Sprint Goal và blocker. | Board được cập nhật sau Daily. |
| Refinement | Chỉ refine item có value và priority rõ. | Item đạt Ready hoặc bị trả về. |
| Sprint Planning | Chỉ chọn item Ready và đã estimate. | Sprint Goal và Sprint Backlog. |
| Sprint Review | Demo increment thật, ghi feedback thành decision. | Accept, rework hoặc follow-up. |
| Retrospective | Chọn tối đa 2 action có owner. | Improvement backlog cho sprint sau. |

Meeting rule:

- Cuộc họp nào không có output thì phải đổi format.
- Discussion dài được park và có owner follow-up.
- Không dùng Daily Scrum để solve chi tiết kỹ thuật dài.

## 6. Communication rules

| Situation | Channel | Response rule |
| --- | --- | --- |
| Blocker đang chặn Sprint Goal | Sync ngay hoặc mention owner rõ. | Trong ngày. |
| Câu hỏi clarification | Comment trên card. | Trong 24 giờ làm việc. |
| Quyết định product | Card decision note. | PO xác nhận trước planning/review. |
| Thảo luận kỹ thuật dài | Huddle hoặc design note. | Tóm tắt lại trên card. |

Communication rule:

- Quyết định quan trọng không chỉ nằm trong chat.
- Người hỏi phải ghi context đủ để người trả lời không đoán.
- Người trả lời phải ghi next action, không chỉ trả lời chung chung.

## 7. WIP and blocker policies

| Policy | Agreement |
| --- | --- |
| Personal WIP | Mỗi người không ôm quá 2 item active. |
| Team WIP | Nếu QA/Test dồn, team swarm trước khi kéo thêm item mới. |
| Blocker age | Blocker quá 1 ngày phải có owner và escalation path. |
| Waiting work | Card chờ người khác phải ghi rõ đang chờ ai và đến khi nào. |

Blocker format:

```text
Blocked item:
Blocked by:
Owner:
Next action:
Escalate by:
```

Rule:

- WIP cao là signal cần giúp nhau, không phải bằng chứng team bận.
- Blocker không có owner thì chưa được quản lý.
- Team ưu tiên mở blocker trước khi bắt thêm việc mới.

## 8. Quality agreements

| Area | Agreement |
| --- | --- |
| Code review | Review trong 1 ngày làm việc với comment rõ action. |
| Testing | Item không vào Done nếu chưa có bằng chứng test phù hợp. |
| Documentation | Thay đổi ảnh hưởng user phải có note/handoff ngắn. |
| Definition of Done | DoD là gate bắt buộc, không phải checklist trang trí. |

Quality rule:

- Done nghĩa là usable, reviewed và có evidence.
- Nếu bỏ qua một quality rule, phải ghi exception và risk.
- Quality issue lặp lại phải vào Retro action, không chỉ nhắc miệng.

## 9. Decision and escalation rules

| Decision type | Who decides | Escalate when |
| --- | --- | --- |
| Product priority | PO | Priority conflict ảnh hưởng Sprint Goal. |
| Technical approach | Dev team | Risk vượt capacity hoặc dependency ngoài team. |
| Quality exception | Team + QA/SM | Exception ảnh hưởng release hoặc customer. |
| Scope change | PO + team | Sprint Goal cần reset. |

Decision note format:

```text
Decision:
Context:
Options considered:
Chosen option:
Owner:
Review date:
```

Rule:

- Người gần việc nhất nên đề xuất quyết định đầu tiên.
- Escalation không phải đổ lỗi; escalation là mở đường cho Sprint Goal.
- Decision cũ có thể đổi khi evidence mới xuất hiện.

## 10. Sample working agreement

| Rule area | Team agreement |
| --- | --- |
| Daily Scrum | Bắt đầu bằng Sprint Goal, kết thúc bằng blocker và follow-up. |
| Refinement | Top backlog phải có value, AC, dependency và estimate trước planning. |
| WIP | Không kéo thêm item nếu QA queue đang quá 3 card. |
| Blocker | Blocker quá 1 ngày phải escalate hoặc swarm. |
| Quality | Không Done nếu thiếu review hoặc test evidence. |
| Decision | Decision quan trọng được ghi vào card trong cùng ngày. |

Sample output:

```text
Working agreement version:
Effective sprint:
Rules:
Review cadence:
Owner for keeping it visible:
Retro question:
```

## 11. Sample output

Nếu working agreement chạy đúng, team sẽ:

- ít hiểu lầm hơn khi sprint căng;
- xử lý blocker sớm hơn;
- giữ event có output rõ;
- giảm WIP và queue cuối sprint;
- có cách nhắc nhau dựa trên rule chung thay vì cảm xúc.

Kết quả xấu cần tránh:

- agreement dài nhưng không ai đọc;
- rule không có trigger;
- exception lặp lại nhưng không được sửa;
- quyết định nằm trong chat và mất dấu.

## 12. Checklist hoàn thành

- [x] Working agreement principles đã có.
- [x] Meeting rules đã có.
- [x] Communication rules đã có.
- [x] WIP and blocker policies đã có.
- [x] Quality agreements đã có.
- [x] Decision and escalation rules đã có.
- [x] Sample working agreement đã có.
- [x] Team biết review agreement trong Retrospective.

## 13. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `23 Exercise 15 - Working Agreement and Team Operating Rules`.

Working agreement tốt giúp Scrum bớt phụ thuộc vào trí nhớ và thiện chí nhất
thời, vì team có luật chung để quay lại khi sprint bắt đầu nhiễu.
