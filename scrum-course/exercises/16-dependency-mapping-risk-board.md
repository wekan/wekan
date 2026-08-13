# Bài 16 - Dependency Mapping và Risk Board

Trạng thái bài làm: đã hoàn thành playbook để team map dependency và sprint
risk thành board nhìn thấy được, có owner, mitigation và cadence review rõ.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 15. Sau khi team đã có working agreement, team cần
đưa dependency và risk ra ánh sáng trước khi chúng làm hỏng Sprint Goal.

Kết quả cuối cùng của bài là:

- Dependency types.
- Risk categories.
- Mapping workflow.
- Risk scoring.
- Owner and mitigation rules.
- Review cadence.
- Sample dependency-risk board.

## 2. Bối cảnh

Sprint thường không trượt chỉ vì team không cố gắng. Sprint hay trượt vì:

- dependency ngoài team được phát hiện quá muộn;
- item chờ API, design, legal hoặc stakeholder nhưng board không nói rõ;
- risk bị nói miệng trong meeting rồi biến mất;
- không ai sở hữu mitigation;
- blocker và risk bị trộn lẫn nên team không biết phải làm gì trước.

Bài này giúp team nhìn dependency/risk như một phần của Sprint Backlog, không
phải chuyện phụ bên ngoài.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- phân loại dependency trước và trong sprint;
- ghi risk bằng format có impact, likelihood và owner;
- tạo mitigation action đủ nhỏ để đưa vào board;
- review dependency/risk theo cadence cố định;
- biết khi nào risk cần escalate hoặc reset scope;
- dùng risk board để bảo vệ Sprint Goal.

## 4. Dependency types

| Type | Ví dụ | Cách nhìn trên board |
| --- | --- | --- |
| People dependency | Cần review từ designer, QA hoặc PO. | Ghi owner và due date trên card. |
| System dependency | Chờ API, service, database hoặc environment. | Gắn dependency note và fallback. |
| Decision dependency | Chờ product/legal/security decision. | Ghi decision needed và approver. |
| Sequence dependency | Item B chỉ làm được sau item A. | Link card và thứ tự xử lý. |

Rule:

- Dependency không có owner thì chưa thật sự được quản lý.
- Dependency không có due date sẽ dễ trở thành blocker.
- Dependency quan trọng phải được nhìn thấy trong Daily Scrum.

## 5. Risk categories

| Category | Signal | Example |
| --- | --- | --- |
| Scope risk | Item quá lớn hoặc acceptance criteria đổi. | Feature bị thêm flow mới giữa sprint. |
| Technical risk | Cách làm chưa rõ hoặc hệ thống dễ vỡ. | API legacy chưa có test. |
| Capacity risk | Người chủ chốt nghỉ hoặc bị quá tải. | QA còn 2 ngày capacity cho 5 item. |
| External risk | Phụ thuộc người/đội/hệ thống ngoài team. | Vendor chưa mở endpoint. |

Risk rule:

- Risk là điều có thể xảy ra; blocker là điều đang xảy ra.
- Risk lớn phải có mitigation trước khi thành blocker.
- Risk lặp lại qua nhiều sprint phải vào improvement backlog.

## 6. Mapping workflow

| Step | Action | Output |
| --- | --- | --- |
| 1 | Scan top Sprint Backlog items. | Danh sách dependency/risk ban đầu. |
| 2 | Gắn type/category cho từng item. | Team hiểu risk đến từ đâu. |
| 3 | Chấm impact và likelihood. | Risk được ưu tiên rõ. |
| 4 | Gắn owner và mitigation. | Có action cụ thể. |
| 5 | Review trong Daily/Planning/Retro. | Risk board luôn sống. |

Mapping format:

```text
Item:
Dependency/risk:
Type/category:
Impact:
Likelihood:
Owner:
Mitigation:
Review date:
```

Rule:

- Mapping không phải tài liệu dài; nó là board signal.
- Nếu mitigation lớn, tạo card nhỏ trong Sprint Backlog.
- Nếu risk ảnh hưởng Sprint Goal, PO và team phải biết trong ngày.

## 7. Risk scoring

| Score | Impact | Likelihood | Action |
| --- | --- | --- | --- |
| Low | Ít ảnh hưởng Sprint Goal. | Khó xảy ra. | Monitor. |
| Medium | Có thể làm chậm 1-2 item. | Có khả năng xảy ra. | Mitigation nhỏ. |
| High | Đe dọa Sprint Goal hoặc release. | Dễ xảy ra. | Escalate, swarm hoặc reset scope. |

Scoring rule:

- Chấm risk để quyết định hành động, không phải để làm báo cáo.
- Nếu impact cao nhưng likelihood thấp, vẫn cần trigger theo dõi.
- Nếu likelihood cao, mitigation phải được lên board.

## 8. Owner and mitigation rules

| Rule | Cách làm |
| --- | --- |
| One owner | Mỗi risk/dependency có đúng một owner chính. |
| Clear next action | Owner ghi việc tiếp theo, không ghi chung chung. |
| Timebox | Mitigation có deadline hoặc review date. |
| Escalation path | Risk high phải biết escalate cho ai. |

Mitigation examples:

- tạo spike 1 ngày để kiểm API;
- book review với stakeholder trước Sprint Review;
- split item để phần không phụ thuộc vẫn chạy;
- đổi thứ tự item để giảm waiting time;
- thêm test guard cho vùng kỹ thuật rủi ro.

## 9. Review cadence

| Moment | Review question | Decision |
| --- | --- | --- |
| Sprint Planning | Dependency nào có thể chặn Sprint Goal? | Chọn, split hoặc bỏ item. |
| Daily Scrum | Risk nào đã chuyển thành blocker? | Swarm, escalate hoặc re-plan. |
| Mid-sprint check | Risk high còn mở không? | Reset scope nếu cần. |
| Sprint Review | Risk nào ảnh hưởng demo/release? | Handoff hoặc follow-up. |
| Retrospective | Risk nào lặp lại? | Improvement action. |

Cadence rule:

- Risk board phải được nhìn ít nhất mỗi ngày trong sprint đang căng.
- Risk không đổi trạng thái qua nhiều ngày cần owner mới hoặc escalation.
- Review cadence phải nhẹ, nhưng không được biến mất.

## 10. Sample dependency-risk board

| Card | Risk/dependency | Score | Owner | Mitigation |
| --- | --- | --- | --- | --- |
| Mobile CTA update | Design approval | Medium | PO | Confirm by Tuesday. |
| API permission check | Legacy endpoint unclear | High | Dev lead | 1-day spike + fallback. |
| Release note copy | Stakeholder wording | Low | PO | Draft async comment. |
| QA regression | Capacity squeezed | High | QA lead | Swarm on test queue today. |

Sample output:

```text
Sprint:
Top risks:
High-risk owner:
Mitigation cards:
Escalations:
Next review:
```

## 11. Sample output

Nếu dependency-risk board chạy đúng, team sẽ:

- thấy risk trước khi nó thành blocker;
- giảm waiting time;
- bảo vệ Sprint Goal tốt hơn;
- có escalation path rõ;
- đưa risk lặp lại vào improvement backlog.

Kết quả xấu cần tránh:

- risk được ghi nhưng không có owner;
- dependency chỉ nằm trong đầu một người;
- mọi risk đều bị chấm High nên team không biết ưu tiên;
- mitigation quá lớn nhưng không được đưa vào Sprint Backlog.

## 12. Checklist hoàn thành

- [x] Dependency types đã có.
- [x] Risk categories đã có.
- [x] Mapping workflow đã có.
- [x] Risk scoring đã có.
- [x] Owner and mitigation rules đã có.
- [x] Review cadence đã có.
- [x] Sample dependency-risk board đã có.
- [x] Team biết phân biệt risk, blocker và dependency.

## 13. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `24 Exercise 16 - Dependency Mapping and Risk Board`.

Risk board tốt giúp team thấy việc chưa cháy từ khi còn âm ỉ, rồi hành động
trước khi Sprint Goal bị kéo lệch.
