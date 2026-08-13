# Bài 1 - Agile Gap Assessment

## 1. Bài này nói về gì?

Bài tập này đánh giá một công ty hoặc team phần mềm hiện tại đang làm Agile
tới đâu. Mục tiêu không phải là xem team có "đủ nghi thức Scrum" hay chưa, mà
là xem team có đang tạo giá trị thật bằng cách làm Agile hay không.

Kết quả cuối cùng của bài là:

- Điểm Agile maturity hiện tại.
- Những khoảng cách lớn nhất giữa cách team đang làm và cách Agile/Scrum nên
  vận hành.
- Kế hoạch cải thiện cho sprint tiếp theo.

## 2. Bối cảnh công ty giả lập

Công ty đang xây một sản phẩm SaaS quản lý công việc cho doanh nghiệp nhỏ và
vừa.

Team hiện có 10 người:

- CEO / Founder.
- Product Owner kiêm Product Manager.
- Scrum Master part-time.
- 2 Frontend Developers.
- 2 Backend Developers.
- 1 QA Engineer.
- 1 UX/UI Designer.
- 1 DevOps Engineer.

Team đã có các nghi thức Scrum cơ bản, nhưng cách làm còn nặng về task, chưa
đủ rõ outcome, feedback từ user còn ít và quyền tự chủ của team chưa cao.

## 3. Thang điểm đánh giá

Mỗi tiêu chí được chấm từ 1 đến 5:

| Điểm | Ý nghĩa |
| --- | --- |
| 1 | Chưa có hoặc làm tùy hứng |
| 2 | Có làm nhưng không ổn định |
| 3 | Có quy trình cơ bản, nhưng chưa đo lường tốt |
| 4 | Làm đều, có feedback và cải thiện |
| 5 | Trưởng thành, đo lường tốt, team tự chủ và liên tục cải thiện |

## 4. Đánh giá hiện tại

| Tiêu chí | Điểm | Bằng chứng | Khoảng cách |
| --- | ---: | --- | --- |
| Product clarity | 2/5 | Backlog có nhiều task kỹ thuật, ít liên kết với user outcome. | Cần Product Goal rõ và success metrics. |
| Backlog quality | 2/5 | User stories thiếu acceptance criteria, nhiều item quá lớn. | Cần refinement tốt hơn trước khi đưa vào sprint. |
| Scrum events | 3/5 | Daily diễn ra đều, nhưng hay thành báo cáo cho lead. Review ít stakeholder. | Cần dùng events để đồng bộ và lấy feedback thật. |
| Engineering quality | 3/5 | Có code review và unit test cho core logic. UI regression còn mỏng. | Definition of Done và test automation cần chặt hơn. |
| Team autonomy | 2/5 | CEO/Tech Lead còn giao task trực tiếp. PO thay đổi scope giữa sprint. | Cần rõ quyền quyết định và luật đổi scope. |
| Customer feedback | 2/5 | Feedback chủ yếu từ sales/support, chưa có demo đều cho user thật. | Cần đưa user/stakeholder vào Sprint Review. |

Tổng điểm:

```text
14/30 = 2.3/5
```

## 5. Kết luận

Team đang ở mức Agile cơ bản: đã có một số nghi thức Scrum, nhưng chưa thật sự
outcome-driven. Nói cách khác, team đang "làm Scrum" nhiều hơn là "dùng Scrum
để học nhanh và tạo giá trị tốt hơn".

Top 5 vấn đề cần cải thiện:

1. Product Goal và success metrics chưa rõ.
2. Backlog item thiếu acceptance criteria.
3. Sprint Review chưa có feedback thật từ stakeholder hoặc user.
4. Scope thay đổi giữa sprint nhưng chưa được renegotiate đúng cách.
5. Definition of Done và automation chưa đủ chặt.

## 6. Kế hoạch cải thiện cho Sprint 1

Mục tiêu cải thiện:

```text
Tăng Agile maturity từ 2.3/5 lên khoảng 3.2/5 sau 1 sprint.
```

### Action 1 - Viết Product Goal và 3 metrics

Owner: Product Owner / Product Manager.

Output:

- 1 Product Goal cho quý hiện tại.
- 3 success metrics.
- 3 non-goals để tránh scope creep.

Template:

```text
Trong 3 tháng tới, sản phẩm sẽ giúp [user segment] đạt [outcome]
bằng cách [capability].
```

Acceptance criteria:

- Product Goal đọc được trong 1 câu.
- Mỗi metric có baseline hoặc cách đo.
- Developers có thể nói việc nào trong sprint liên quan đến goal.

### Action 2 - Làm sạch top 10 backlog items

Owner: Product Owner, Business Analyst, Tech Lead, QA.

Mỗi backlog item cần có:

- User story: As a [user], I want [capability], so that [benefit].
- Acceptance criteria.
- Size estimate.
- Dependencies hoặc risk nếu có.

Acceptance criteria:

- 10 items được ordered.
- Ít nhất 8/10 items có acceptance criteria.
- Không item nào lớn hơn 3 ngày dev nếu đưa vào sprint.

### Action 3 - Đổi Daily Scrum quanh Sprint Goal

Owner: Scrum Master và Developers.

Format mới:

- Chuyển động nào đã giúp Sprint Goal?
- Hôm nay cần coordinate với ai?
- Có blocker hoặc dependency nào cần xử lý?

Rules:

- 15 phút.
- Developers nói với nhau, không report cho manager.
- Blocker chỉ capture trong Daily, xử lý sau Daily.

Acceptance criteria:

- Sau 5 ngày, team tự chấm Daily đạt ít nhất 4/5 về độ hữu ích.
- Ít nhất 1 blocker được ghi lại và follow-up trong sprint.

### Action 4 - Chạy Sprint Review có feedback thật

Owner: Product Owner, UX, Support.

Participants:

- Scrum Team.
- 2 stakeholders.
- 2 real users, hoặc customer-facing people nếu chưa mời được user thật.

Agenda:

1. Nhắc lại Sprint Goal.
2. Demo working increment.
3. Hỏi: cái gì hữu ích, cái gì khó hiểu, cái gì còn thiếu?
4. Ghi quyết định và update backlog.

Acceptance criteria:

- Có ít nhất 5 feedback notes.
- Có ít nhất 3 backlog items được update từ feedback.

### Action 5 - Áp dụng luật đổi scope giữa sprint

Owner: Product Owner và Scrum Master.

Rule:

- Việc mới xuất hiện trong sprint phải đi qua Product Owner.
- Developers đánh giá impact.
- Nếu vẫn cần làm, team renegotiate Sprint Goal hoặc swap item có giá trị
  tương đương.
- Không chèn task trực tiếp vào Developers.

Acceptance criteria:

- Mọi scope change có note: reason, impact, decision.
- Không có hidden work chen vào sprint mà không qua Product Owner và
  Developers.

### Action 6 - Nâng cấp Definition of Done

Owner: QA, Tech Lead, DevOps.

Definition of Done mới:

- Acceptance criteria met.
- Code reviewed.
- Unit/integration tests pass.
- UI checked nếu có thay đổi UI.
- Smoke test cho critical flow.
- Security/privacy checked nếu liên quan.
- Docs/release note updated nếu liên quan.
- Deployable hoặc deployed theo policy của team.

Acceptance criteria:

- Definition of Done được pin trên board.
- Mọi Done card trong sprint có DoD checklist pass.
- 3 critical flows có smoke test manual hoặc automated.

## 7. Re-score sau sprint

Re-score trong Sprint Retrospective:

| Tiêu chí | Hiện tại | Target |
| --- | ---: | ---: |
| Product clarity | 2 | 3 |
| Backlog quality | 2 | 3 |
| Scrum events | 3 | 4 |
| Engineering quality | 3 | 3.5 |
| Team autonomy | 2 | 3 |
| Customer feedback | 2 | 3 |

Target mới:

```text
19.5/30 = 3.25/5
```

## 8. Checklist hoàn thành

- [ ] Product Goal đã được viết.
- [ ] 3 success metrics đã được chọn.
- [ ] Top 10 backlog items đã được refine.
- [ ] Daily Scrum đã đổi sang format quanh Sprint Goal.
- [ ] Sprint Review có stakeholder/user feedback.
- [ ] Luật đổi scope giữa sprint đã được áp dụng.
- [ ] Definition of Done mới đã được pin trên board.
- [ ] Team đã re-score trong Retrospective.

## 9. File liên quan trong WeKan

Các phần của bài này cũng đã được triển khai trong board WeKan:

- `08 Exercise 1 - Agile Gap Assessment`.
- `09 Sprint 1 - Improve Agile Maturity`.
