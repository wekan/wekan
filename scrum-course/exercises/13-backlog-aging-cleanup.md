# Bài 13 - Backlog Aging và Cleanup

Trạng thái bài làm: đã hoàn thành playbook để team giữ backlog sạch bằng cách
đánh giá item cũ, bỏ item chết, merge trùng lặp và refresh readiness trước khi
planning.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 12. Sau khi retrospective actions đã vào backlog, team
cần một cơ chế giữ backlog sống và gọn. Nếu không, backlog sẽ phình ra với item
cũ, trùng lặp, mơ hồ hoặc mất owner.

Kết quả cuối cùng của bài là:

- Backlog health signals.
- Cleanup rules.
- Stale item rules.
- Duplicate merge rules.
- Readiness refresh rules.
- Sample cleanup session.

## 2. Bối cảnh

Backlog thường gặp các vấn đề sau:

- item đã 2-3 sprint chưa ai đụng;
- có nhiều item nói cùng một vấn đề;
- item cũ không còn khớp ưu tiên hiện tại;
- dependency chưa được xác nhận lại;
- item trông to hơn khả năng sprint.

Nếu không cleanup, sprint planning sẽ bị rác lẫn vào tín hiệu thật.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- đọc backlog health bằng tín hiệu đơn giản;
- loại item stale hoặc vô chủ;
- merge duplicate và nhóm item liên quan;
- refresh readiness trước planning;
- giữ top backlog phản ánh đúng điều team thật sự muốn làm.

## 4. Backlog health signals

| Signal | Ý nghĩa | Cảnh báo |
| --- | --- | --- |
| Item age | Item nằm quá lâu mà không được chạm. | > 2 sprint không review. |
| Ready ratio | Bao nhiêu item top backlog đã Ready. | Dưới ngưỡng planning an toàn. |
| Duplicate count | Có bao nhiêu item nói cùng vấn đề. | Nhiều card trùng ý. |
| Owner coverage | Item có owner rõ không. | Không có owner hoặc owner mơ hồ. |
| Dependency freshness | Dependency có được xác nhận lại không. | Dependency cũ, không còn chắc. |

Health rule:

- Không cần nhiều số.
- Chỉ cần đủ để biết backlog đang sạch hay đang đục.
- Nếu tín hiệu xấu kéo dài, cleanup là việc thật chứ không phải “sau này”.

## 5. Cleanup rules

| Rule | Cách làm |
| --- | --- |
| Đưa item stale xuống | Nếu item không còn giá trị, archiving hoặc defer rõ. |
| Merge duplicate | Gộp nhiều card nói cùng vấn đề thành một card chính. |
| Split oversized | Card quá lớn thì tách lại thành slice nhỏ hơn. |
| Refresh dependency | Kiểm tra lại owner, risk và upstream/downstream. |
| Re-rank top items | Sắp xếp lại theo value và current goal. |

Cleanup rule:

- Cleanup không phải xóa bừa.
- Không giữ item chỉ vì tiếc công ghi nó xuống.
- Item nào không còn giúp planning thì cần quyết định rõ.

## 6. Stale item rules

| Trạng thái | Cách xử lý |
| --- | --- |
| Chưa rõ giá trị | Ghi lại lý do chưa tiếp tục và deadline review lại. |
| Mất owner | Gắn owner hoặc move ra ngoài top backlog. |
| Lạc mục tiêu | Dời sang hold hoặc archive. |
| Quá cũ | Kiểm tra lại trước khi giữ lại. |

Stale rule:

- Item stale không được nằm im mãi ở top backlog.
- Nếu không ai còn muốn làm nó, backlog phải nói thẳng.
- Không để stale item giả làm priority thật.

## 7. Duplicate merge rules

| Trường hợp | Action |
| --- | --- |
| Hai item cùng outcome | Merge thành một card chính. |
| Một item là chi tiết của item khác | Dùng sub-task hoặc note thay vì card riêng. |
| Nhiều card cùng blocker | Gộp blocker chung rồi map các item phụ. |

Merge rule:

- Merge phải giữ được history và lý do.
- Card chính phải rõ hơn chứ không lẫn hơn.
- Nếu merge làm mất tín hiệu, cần viết lại mô tả.

## 8. Readiness refresh rules

Before Sprint Planning, team refresh:

- acceptance criteria;
- owner;
- dependency;
- estimate;
- risk;
- test/validation path.

Refresh format:

```text
Item:
Ready?:
Missing:
Owner:
Dependency:
Estimate:
Decision:
```

Rule:

- Item chưa Ready thì không giả vờ Ready.
- Readiness refresh là check thật, không phải check-box trang trí.
- Nếu top item không Ready, sprint planning sẽ bị nhiễu.

## 9. Sample cleanup session

| Item | Issue | Decision |
| --- | --- | --- |
| Old invite wording fix | Quá cũ, đã có solution khác. | Archive. |
| Invite email tracking | Trùng ý với support clarity card. | Merge. |
| New daily format action | Còn active và có owner. | Giữ. |
| Advanced analytics idea | Chưa có evidence. | Move to hold. |
| Stale blocker dashboard | Mất dependency freshness. | Refresh trước khi giữ. |

Sample output:

```text
Cleanup list:
Merged:
Archived:
Kept:
Revalidated:
Top ready items:
```

## 10. Sample output

Nếu backlog cleanup chạy đúng, team sẽ:

- ít bị rác ở đầu planning;
- biết card nào còn sống;
- biết card nào nên merge hoặc archive;
- có top backlog phản ánh đúng mục tiêu hiện tại.

Kết quả xấu cần tránh:

- backlog đầy nhưng planning vẫn mù;
- item cũ chiếm top;
- duplicate làm team tưởng có nhiều việc hơn thực tế;
- readiness không ai kiểm trước planning.

## 11. Checklist hoàn thành

- [x] Backlog health signals đã rõ.
- [x] Cleanup rules đã có.
- [x] Stale item rules đã có.
- [x] Duplicate merge rules đã có.
- [x] Readiness refresh rules đã có.
- [x] Sample cleanup session đã có.
- [x] Team biết giữ top backlog sạch trước planning.

## 12. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `21 Exercise 13 - Backlog Aging and Cleanup`.

Backlog sạch giúp sprint planning nhanh hơn và ít bất ngờ hơn.
