# Bài 8 - Execution Planning và Capacity

Trạng thái bài làm: đã hoàn thành bản playbook để team biến roadmap ưu tiên
thành sprint plan khả thi dựa trên capacity thật, ownership rõ và risk buffer.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 7. Sau khi đã biết việc nào đáng làm trước, team cần
chia việc thành các slice đủ nhỏ, xem capacity thật, assign owner và chốt kế
hoạch sprint mà không tự lừa mình bằng “ước lượng cho đẹp”.

Kết quả cuối cùng của bài là:

- Capacity calculation.
- Team availability.
- Slice sizing rules.
- Sprint commitment rules.
- Ownership assignment.
- Dependency/risk tracking.

## 2. Bối cảnh

Roadmap đã chốt `Now` là:

- Explain invite states better.
- Improve mobile empty-state CTA.
- Add better support FAQ/macros.

Nhưng roadmap chỉ là ý định. Sprint plan cần kiểm:

1. Team còn bao nhiêu ngày thật?
2. Có support duty hoặc nghỉ phép không?
3. Item nào đủ nhỏ để kịp sprint?
4. Có dependency nào làm kế hoạch vỡ không?

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- Tính capacity trên từng role.
- Biết item nào phải slice tiếp trước khi commit.
- Assign owner cho từng slice.
- Giữ buffer cho support, bug và unplanned work.
- Chốt sprint commitment hợp lý.

## 4. Capacity calculation

| Role | Planned days | Unavailable | Effective capacity |
| --- | ---: | ---: | ---: |
| Frontend | 8 | 1 | 7 |
| Backend | 8 | 1 | 7 |
| QA | 5 | 1 | 4 |
| UX/UI | 4 | 1 | 3 |
| DevOps | 3 | 1 | 2 |

Buffer rule:

- Giữ ít nhất 20% buffer cho unplanned work.
- Nếu roadmap item nào đòi nhiều buffer hơn, slice nhỏ lại trước khi commit.

## 5. Team availability

| Ngày | Note |
| --- | --- |
| Mon | Planning + refinement. |
| Tue | Deep work window. |
| Wed | Review dependency and unblock. |
| Thu | QA / polish / review. |
| Fri | Demo, handoff, retro prep. |

Availability rule:

- Không lấy sprint plan nếu biết trước có PTO, meeting load hoặc support duty.
- Nếu một role chỉ còn 1-2 ngày, không assign hẳn item lớn cho role đó.

## 6. Slice sizing rules

Item vào sprint phải:

- fit trong 1 sprint;
- có owner rõ;
- có acceptance criteria đủ cụ thể;
- không còn dependency mù;
- có test hoặc validation path.

Split rule:

- Nếu item > 3 ngày dev, split.
- Nếu item có nhiều UI state, split theo state.
- Nếu item có nhiều dependency, tách discovery spike trước.
- Nếu item có risk cao, làm proof-of-concept nhỏ trước commit lớn.

## 7. Sprint commitment rules

Team chỉ commit khi:

1. Capacity thực tế đủ.
2. Mỗi item có owner.
3. QA biết item nào cần test sớm.
4. PO đồng ý Sprint Goal.
5. Buffer vẫn còn.

Commit format:

```text
Sprint Goal:
Committed items:
Owners:
Buffer:
Known risks:
Review date:
```

## 8. Ownership assignment

| Item | Primary owner | Support |
| --- | --- | --- |
| Explain invite states better | Frontend + PO | QA, Support |
| Improve mobile empty-state CTA | UX/UI | Frontend |
| Add better support FAQ/macros | PO/Support | QA |

Owner rule:

- Mỗi item chỉ có 1 owner chính.
- Owner phải biết mình chốt gì, không phải chỉ “đang làm”.
- Nếu owner mơ hồ, item chưa ready để commit.

## 9. Dependency and risk tracking

| Risk | Signal | Mitigation |
| --- | --- | --- |
| Copy/UX chưa rõ | QA hoặc stakeholder vẫn hỏi lại cùng câu. | Ghim copy trước khi dev. |
| Email/support phụ thuộc người khác | Blocker chờ ngoài team. | Ghi dependency và escalate sớm. |
| Scope creep | Item bắt đầu phình thêm feature mới. | Chặn bằng definition of ready. |
| Unplanned work | Bug/support việc chen vào giữa sprint. | Giữ buffer và triage rõ. |

## 10. Sample sprint plan

| Item | Size | Owner | Reason in sprint |
| --- | ---: | --- | --- |
| Explain invite states better | 3 | Frontend + PO | Tác động trực tiếp metric support/invite. |
| Improve mobile empty-state CTA | 2 | UX/UI | Tác động onboarding mobile. |
| Add better support FAQ/macros | 2 | PO/Support | Giảm ticket và clarifies known issues. |

Sprint buffer:

- 20% of capacity reserved.
- 1 day reserved for unplanned support or bug fix.

## 11. Sample output

| Output | Nội dung |
| --- | --- |
| Capacity | Effective capacity cho từng role rõ ràng. |
| Sprint Goal | One-sentence goal có outcome thật. |
| Committed items | 3 item vừa capacity. |
| Owners | One owner per item. |
| Buffer | Có chừa 20%. |
| Risks | Dependent/support risk đã note. |

## 12. Checklist hoàn thành

- [x] Capacity calculation đã có.
- [x] Team availability đã có.
- [x] Slice sizing rules đã có.
- [x] Sprint commitment rules đã có.
- [x] Ownership assignment đã có.
- [x] Dependency and risk tracking đã có.
- [x] Sample sprint plan đã có.
- [x] Buffer rule đã rõ.

## 13. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `16 Exercise 8 - Execution Planning and Capacity`.

Sprint Backlog nên reflect capacity thật, không phải số đẹp trên slide.
