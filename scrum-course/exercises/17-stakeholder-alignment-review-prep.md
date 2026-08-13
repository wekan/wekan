# Bài 17 - Stakeholder Alignment và Review Prep

Trạng thái bài làm: đã hoàn thành playbook để team chuẩn bị Sprint Review như
một buổi học hỏi và ra quyết định, không chỉ là demo cuối sprint.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 16. Sau khi dependency và risk đã được nhìn thấy trên
board, team cần chuẩn bị stakeholder trước Sprint Review để đúng người xem
đúng increment, hiểu đúng kỳ vọng và đưa feedback có thể xử lý.

Kết quả cuối cùng của bài là:

- Stakeholder map.
- Review objective.
- Invite and readiness rules.
- Demo narrative.
- Decision capture.
- Feedback routing.
- Sample review-prep board.

## 2. Bối cảnh

Sprint Review dễ bị yếu khi:

- stakeholder quan trọng không được mời;
- demo chỉ kể việc đã làm, không gắn với outcome;
- người xem không biết cần quyết định gì;
- feedback được nói miệng nhưng không vào backlog;
- rework và follow-up bị lẫn với bug hoặc feature mới;
- team phát hiện expectation mismatch ngay trong buổi review.

Bài này giúp Review trở thành một vòng học hỏi có chuẩn bị, có decision và có
đường đưa feedback quay lại Product Backlog.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- map stakeholder theo vai trò và loại feedback cần lấy;
- viết objective rõ cho Sprint Review;
- chuẩn bị invite, agenda và artifact trước review;
- tạo demo narrative gắn với Sprint Goal;
- capture decision, rework và follow-up đúng format;
- route feedback vào backlog hoặc improvement backlog.

## 4. Stakeholder map

| Stakeholder | Cần họ xem gì | Feedback cần lấy |
| --- | --- | --- |
| Primary user | Increment dùng được chưa. | Usability, missing flow, wording. |
| Product sponsor | Outcome có đúng mục tiêu không. | Priority, business decision. |
| Support/CS | Change có gây confusion không. | Handoff note, FAQ, known issue. |
| Engineering lead | Risk kỹ thuật còn lại. | Release safety, follow-up debt. |

Mapping rule:

- Không mời stakeholder chỉ để đủ đông.
- Mỗi stakeholder được mời phải có lý do và expected feedback.
- Nếu một decision cần người có quyền chốt, invite phải có người đó.

## 5. Review objective

| Objective type | Khi dùng | Output |
| --- | --- | --- |
| Validate value | Increment đã giải quyết vấn đề chưa. | Accept, adjust hoặc rework. |
| Choose next step | Có nhiều hướng tiếp theo. | Decision note. |
| Expose risk | Increment còn uncertainty. | Risk/mitigation update. |
| Prepare release | Increment gần deploy. | Release readiness/handoff action. |

Review objective format:

```text
Sprint Goal:
Review objective:
Main decision needed:
Stakeholders needed:
Feedback format:
```

Rule:

- Review không có objective sẽ dễ thành show-and-tell.
- Objective phải nói rõ team muốn học hoặc quyết định điều gì.
- Sprint Goal là trục chính của demo narrative.

## 6. Invite and readiness rules

| Item | Rule |
| --- | --- |
| Invite | Gửi trước review với objective và decision needed. |
| Demo artifact | Link, account, test data hoặc screenshot phải sẵn sàng. |
| Known risk | Risk còn mở phải được nói trước, không giấu tới cuối. |
| Feedback capture | Chuẩn bị board/card để ghi feedback ngay khi nghe. |

Readiness checklist:

```text
Invite sent:
Agenda ready:
Demo path ready:
Known risks listed:
Feedback board ready:
Decision owner present:
```

Rule:

- Không để review phụ thuộc vào trí nhớ của người demo.
- Nếu demo path chưa ổn, phải có fallback screenshot/video.
- Nếu decision owner vắng mặt, review objective phải đổi.

## 7. Demo narrative

| Step | Nội dung | Mục đích |
| --- | --- | --- |
| 1 | Nhắc lại Sprint Goal. | Đặt context. |
| 2 | Nói user/problem được xử lý. | Gắn demo với value. |
| 3 | Demo flow chính. | Cho stakeholder thấy increment thật. |
| 4 | Nói trade-off/risk còn lại. | Giữ kỳ vọng thực tế. |
| 5 | Hỏi decision/feedback cụ thể. | Biến review thành action. |

Narrative rule:

- Demo theo user journey, không theo danh sách task.
- Nói rõ cái đã Done và cái chưa Done.
- Feedback question phải cụ thể, không hỏi chung chung "mọi người thấy sao".

## 8. Decision capture

| Decision | Format |
| --- | --- |
| Accept | Increment đạt objective và không cần rework lớn. |
| Rework | Cần sửa trước khi release hoặc trước sprint sau. |
| Follow-up | Ý mới hoặc cải tiến đưa vào backlog. |
| Defer | Feedback hợp lý nhưng chưa ưu tiên. |

Decision note:

```text
Feedback:
Decision:
Reason:
Owner:
Backlog action:
Due/review date:
```

Rule:

- Feedback chưa được route thì chưa kết thúc.
- Rework phải có acceptance criteria mới hoặc rõ phần cần sửa.
- Follow-up không được chen vào sprint hiện tại nếu phá Sprint Goal.

## 9. Feedback routing

| Feedback type | Đi đâu | Owner |
| --- | --- | --- |
| Bug/rework | Sprint Backlog hoặc next bug queue. | Dev/QA owner. |
| Product idea | Product Backlog. | PO. |
| Release/handoff issue | Release readiness checklist. | PO/support owner. |
| Team process issue | Improvement backlog. | SM/team. |

Routing rule:

- Feedback sau review phải được triage trước khi đóng review loop.
- Không phải feedback nào cũng thành việc ngay.
- Mọi feedback bị defer phải có lý do để stakeholder không thấy bị bỏ qua.

## 10. Sample review-prep board

| Card | Review prep | Owner | Status |
| --- | --- | --- | --- |
| Sprint Goal recap | Viết 3 dòng context mở đầu review. | PO | Ready |
| Demo path | Chuẩn bị account, data và fallback screenshot. | Dev lead | Ready |
| Stakeholder invite | Mời sponsor, CS và primary user. | PO | Sent |
| Feedback capture | Tạo 4 lane: accept, rework, follow-up, defer. | SM | Ready |

Sample output:

```text
Review objective:
Stakeholders invited:
Demo narrative:
Decision needed:
Feedback lanes:
Post-review triage time:
```

## 11. Sample output

Nếu review prep chạy đúng, team sẽ:

- mời đúng người;
- demo đúng outcome;
- lấy feedback cụ thể hơn;
- capture decision rõ hơn;
- route feedback vào backlog mà không lẫn lộn.

Kết quả xấu cần tránh:

- stakeholder xem xong nhưng không biết cần góp ý gì;
- demo theo task list nên mất context người dùng;
- feedback nằm trong chat hoặc note cá nhân;
- mọi feedback đều thành scope ngay lập tức.

## 12. Checklist hoàn thành

- [x] Stakeholder map đã có.
- [x] Review objective đã có.
- [x] Invite and readiness rules đã có.
- [x] Demo narrative đã có.
- [x] Decision capture đã có.
- [x] Feedback routing đã có.
- [x] Sample review-prep board đã có.
- [x] Team biết route feedback sau Sprint Review.

## 13. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `25 Exercise 17 - Stakeholder Alignment and Review Prep`.

Review prep tốt giúp Sprint Review bớt bất ngờ, nhiều quyết định hơn và ít
feedback bị thất lạc hơn.
