# Bài 3 - Sprint Planning và Backlog Refinement

Trạng thái bài làm: đã hoàn thành bản playbook thực hành để team biến
workflow ở Bài 2 thành một Sprint Planning có đầu vào rõ, Sprint Goal rõ,
backlog đủ Ready và luật kiểm soát capacity.

## 1. Bài này nói về gì?

Bài tập này hướng dẫn team chuẩn bị backlog trước sprint và chạy Sprint
Planning theo hướng outcome, không chỉ nhặt task vào sprint.

Kết quả cuối cùng của bài là:

- Checklist Backlog Refinement.
- Agenda Sprint Planning.
- Sprint Goal mẫu.
- Backlog items đã chọn cho Sprint 1.
- Capacity/WIP check.
- Risk và scope-change rule cho sprint.

## 2. Bối cảnh

Từ Bài 1, team biết mình đang yếu ở Product Goal, backlog quality, feedback và
scope control. Từ Bài 2, team đã có workflow delivery mới với Definition of
Ready, Definition of Done và WIP limit.

Bài 3 dùng hai kết quả đó để chuẩn bị Sprint 1:

```text
Giúp owner của doanh nghiệp nhỏ tạo board đầu tiên và mời team vào làm việc
trong dưới 10 phút.
```

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- Refinement backlog item theo cùng một format.
- Chọn item vào sprint dựa trên Sprint Goal và capacity.
- Nhìn thấy dependency, risk và blocker trước khi bắt đầu.
- Biết item nào chưa đủ Ready và không đưa vào Sprint Backlog.
- Có Definition of Done cụ thể cho sprint.

## 4. Đầu vào Sprint Planning

| Đầu vào | Nguồn | Điều kiện tối thiểu |
| --- | --- | --- |
| Product Goal | Product Owner | Một câu rõ user, outcome và capability. |
| Top backlog items | Product Backlog | Đã ordered theo value/risk. |
| Capacity | Developers + QA | Có ngày nghỉ, support duty và buffer. |
| Definition of Ready | Bài 2 | Dùng để lọc item trước planning. |
| Definition of Done | Bài 2 | Dùng để estimate effort thật. |
| Feedback/risk | Review, Support, Sales | Có evidence hoặc lý do business rõ. |

## 5. Backlog Refinement policy

Một refinement session tốt có 5 bước:

1. PO nhắc lại Product Goal và mục tiêu user.
2. Team đọc từng item theo thứ tự ưu tiên.
3. Developers/QA hỏi về acceptance criteria, edge cases và testability.
4. Team estimate sơ bộ bằng story points hoặc size bucket.
5. Item đạt Ready được đưa vào `Ready for Sprint`; item chưa đạt quay lại
   `Ready for Refinement` với câu hỏi còn thiếu.

Rule quan trọng:

- Không estimate item khi chưa hiểu outcome.
- Không đưa item vào sprint nếu acceptance criteria còn mơ hồ.
- Không chia task kỹ thuật trước khi thống nhất user value.
- Nếu item lớn hơn 3 ngày dev, split trước khi vào sprint.

## 6. Sprint Planning agenda

| Phần | Thời lượng | Output |
| --- | ---: | --- |
| Nhắc Product Goal và feedback mới | 10 phút | Team hiểu lý do sprint này quan trọng. |
| Đề xuất Sprint Goal | 15 phút | Sprint Goal viết được trong 1-2 câu. |
| Capacity check | 10 phút | Tổng capacity và buffer được thống nhất. |
| Chọn backlog items | 35 phút | Danh sách item hỗ trợ Sprint Goal. |
| Kiểm DoR/DoD và risk | 20 phút | Item chưa Ready bị loại; risk có owner. |
| Chốt plan | 10 phút | Sprint Backlog, owner và first next step rõ. |

## 7. Sprint Goal mẫu

```text
Trong Sprint 1, team giúp owner của doanh nghiệp nhỏ tạo board đầu tiên,
mời teammate và bắt đầu làm việc với starter workflow trong dưới 10 phút.
```

Non-goals:

- Chưa tối ưu toàn bộ onboarding.
- Chưa làm advanced permission.
- Chưa làm template marketplace.

## 8. Backlog items được chọn

| Item | User story | Acceptance criteria | Size | Ready? |
| --- | --- | --- | ---: | --- |
| Tạo board đầu tiên | As a new owner, I want to create my first board so that I can organize team work. | Can create board from empty state; board appears after create; error state shown. | 3 | Có |
| Mời teammate | As a new owner, I want to invite teammates by email so that my team can join the board. | Can enter emails; invalid emails show error; invite status is visible. | 5 | Có |
| Email mời rõ ràng | As a teammate, I want a clear invitation email so that I know where to join. | Email contains board name, inviter, CTA and expiry note. | 2 | Có |
| Starter lists | As a new user, I want starter lists so that I do not start from a blank board. | New board has Todo, Doing, Done; user can rename lists. | 3 | Có |
| Failed invites | As a support person, I want to see failed invites so that I can help customers. | Failed invite is logged with reason; support can inspect status. | 3 | Có |

Tổng size: 16 points.

## 9. Capacity và WIP check

Giả định sprint 1 tuần:

| Thành viên | Capacity thực tế | Ghi chú |
| --- | ---: | --- |
| 2 Frontend Developers | 8 ngày | Trừ 1 ngày support/meeting. |
| 2 Backend Developers | 8 ngày | Trừ 1 ngày support/meeting. |
| QA Engineer | 3 ngày | Tham gia refinement và test sớm. |
| UX/UI Designer | 2 ngày | Tập trung empty state và invite flow. |
| DevOps Engineer | 1 ngày | Hỗ trợ email/log/smoke deploy. |

WIP rule trong sprint:

- Tối đa 3 item `In Progress`.
- Tối đa 2 pull request ở `Code Review`.
- QA test từng item nhỏ, không chờ cuối sprint.
- Nếu `Code Review` đầy, developer ưu tiên review trước khi kéo việc mới.

## 10. Risk và scope-change handling

| Risk | Dấu hiệu | Cách xử lý |
| --- | --- | --- |
| Email invite phụ thuộc service ngoài | Gửi email fail hoặc delay. | Có log failed invite và fallback resend. |
| Empty state chưa rõ UX | User không biết tạo board ở đâu. | UX review prototype trước khi dev. |
| Scope onboarding phình to | Có request thêm template/permission nâng cao. | Đưa vào Product Backlog, không chen vào sprint. |
| QA dồn cuối sprint | Nhiều item đến QA cùng lúc. | Split item nhỏ, QA tham gia ngay từ refinement. |

Scope change trong sprint phải có note:

```text
Reason:
Impact:
Decision: swap / defer / renegotiate Sprint Goal
Owner:
```

## 11. Definition of Done cho Sprint 1

- Acceptance criteria của từng item pass.
- Code reviewed.
- Unit/integration test pass nếu liên quan.
- Invite flow có negative test cho email không hợp lệ.
- UI empty state kiểm ở desktop và mobile.
- Support log cho failed invite kiểm tra được.
- Sprint Review demo được flow tạo board và mời teammate.

## 12. Checklist hoàn thành

- [x] Product Goal/Sprint Goal đã rõ.
- [x] Planning inputs đã được liệt kê.
- [x] Backlog Refinement policy đã có.
- [x] Sprint Planning agenda đã có timebox và output.
- [x] Ít nhất 5 backlog items được chọn và đủ Ready.
- [x] Capacity và WIP check đã có.
- [x] Risk và scope-change handling đã có.
- [x] Definition of Done cho Sprint 1 đã có.

## 13. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `11 Exercise 3 - Sprint Planning and Backlog Refinement`.

Card của mỗi backlog item nên có checklist DoR/DoD riêng để team nhìn được lý
do item được kéo vào sprint.
