# Bài 19 - Cross-functional Swarming và Flow Rescue

Trạng thái bài làm: đã hoàn thành playbook để team tổ chức swarm liên chức
năng khi flow bị kẹt, thay vì tiếp tục kéo thêm việc mới vào sprint.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 18. Sau khi team biết facilitate decision deadlock,
team cần biết cách biến quyết định thành hành động phối hợp khi bottleneck,
blocker hoặc queue quá tải đang đe dọa Sprint Goal.

Kết quả cuối cùng của bài là:

- Swarm triggers.
- Swarm roles.
- Flow rescue workflow.
- WIP stop rules.
- Pairing and mobbing patterns.
- Exit criteria.
- Sample swarm board.

## 2. Bối cảnh

Sprint thường kẹt không phải vì thiếu người bận, mà vì:

- quá nhiều item đang làm dở;
- QA/Test queue dồn về cuối sprint;
- một card blocker-heavy nằm im nhiều ngày;
- dev xong nhưng review/test/handoff không theo kịp;
- mỗi người start thêm việc riêng thay vì cứu flow chung;
- team không biết khi nào cần swarm và swarm thế nào.

Bài này giúp team dừng việc mới đúng lúc, gom đúng người và rescue item quan
trọng để Sprint Goal còn cơ hội hoàn tất.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- nhận ra trigger cần cross-functional swarm;
- chọn vai trò trong swarm rõ ràng;
- đặt WIP stop rule khi queue phình ra;
- dùng pairing/mobbing đúng loại bottleneck;
- định nghĩa exit criteria để swarm không kéo dài vô hạn;
- cập nhật board để swarm có evidence thật.

## 4. Swarm triggers

| Trigger | Signal | Swarm response |
| --- | --- | --- |
| QA queue overload | Nhiều card chờ test/retest. | Dev + QA cùng unblock test. |
| Blocker aging | Blocker mở quá 1 ngày. | Owner kéo người cần thiết vào swarm. |
| Sprint Goal risk | Forecast đỏ hoặc scope chính chưa Done. | Dừng start item mới, cứu goal item. |
| Review bottleneck | PR/review/handoff nằm im. | Pair review hoặc mob decision. |

Rule:

- Swarm bắt đầu khi flow cần cứu, không phải khi mọi người rảnh.
- Swarm ưu tiên item ảnh hưởng Sprint Goal.
- Trigger phải được nhìn thấy trên board hoặc Daily Scrum.

## 5. Swarm roles

| Role | Trách nhiệm |
| --- | --- |
| Swarm lead | Chốt mục tiêu swarm, timebox và exit criteria. |
| Domain helper | Cung cấp context kỹ thuật/product/QA cần thiết. |
| Driver | Thực hiện thao tác chính hoặc cập nhật artifact. |
| Reviewer | Kiểm chất lượng, test evidence và DoD. |
| Flow watcher | Nhìn WIP/queue và nhắc khi swarm lệch mục tiêu. |

Role rule:

- Một swarm nhỏ cũng cần lead và exit criteria.
- Không phải ai cũng phải tham gia; đúng người quan trọng hơn đông người.
- Role có thể đổi trong swarm nếu bottleneck đổi.

## 6. Flow rescue workflow

| Step | Action | Output |
| --- | --- | --- |
| 1 | Chọn item cần rescue. | Swarm target rõ. |
| 2 | Nói rõ blocked/queued reason. | Team hiểu bottleneck. |
| 3 | Dừng start work nếu WIP cao. | Capacity dồn vào flow. |
| 4 | Pair/mob xử lý bottleneck. | Work chuyển trạng thái. |
| 5 | Cập nhật evidence và next state. | Board phản ánh tiến độ thật. |

Swarm target format:

```text
Target card:
Why swarm now:
Goal:
People needed:
Timebox:
Exit criteria:
```

Rule:

- Swarm không bắt đầu bằng "mọi người cùng nhìn xem"; nó bắt đầu bằng target.
- Nếu target không rõ, facilitator phải clarify trước.
- Nếu swarm không tiến triển sau timebox, escalate hoặc split.

## 7. WIP stop rules

| Condition | Stop rule |
| --- | --- |
| QA queue > 3 cards | Không start dev item mới cho tới khi queue giảm. |
| Blocker high impact | Người liên quan swarm trước khi kéo thêm item. |
| Sprint Goal item stuck | Cắt item phụ để cứu item chính. |
| Review queue aging | Reviewer pair theo slot cố định trong ngày. |

WIP rule:

- Stop starting, start finishing.
- WIP stop không phải phạt team; nó bảo vệ flow.
- Nếu WIP stop lặp lại nhiều sprint, đưa nguyên nhân vào Retro action.

## 8. Pairing and mobbing patterns

| Pattern | Khi dùng | Output |
| --- | --- | --- |
| Dev-QA pair | Test failure hoặc unclear acceptance. | Repro, fix hoặc test evidence. |
| Dev-dev pair | Technical uncertainty cao. | Shared understanding và code review sớm. |
| PO-dev-UX mob | Scope/wording/flow chưa rõ. | Clarified acceptance criteria. |
| Support-PO pair | Handoff hoặc customer wording. | Release/support note rõ. |

Pattern rule:

- Pairing tốt nhất khi bottleneck cần hai góc nhìn.
- Mobbing dùng khi nhiều assumption phải được làm rõ cùng lúc.
- Swarm phải tạo artifact: fix, test evidence, decision note hoặc split card.

## 9. Exit criteria

| Exit type | Khi swarm kết thúc |
| --- | --- |
| Done exit | Card đạt DoD hoặc chuyển trạng thái hợp lệ. |
| Unblocked exit | Blocker đã được mở và owner tiếp theo rõ. |
| Split exit | Card quá lớn được split thành item nhỏ hơn. |
| Escalation exit | Team cần quyết định ngoài quyền và đã gửi escalation. |

Exit rule:

- Swarm không kết thúc chỉ vì hết meeting nếu board chưa có next state.
- Nếu không Done, phải có next owner và next action.
- Exit criteria giúp swarm ngắn, rõ, và có trách nhiệm.

## 10. Sample swarm board

| Target | Trigger | Swarm team | Exit criteria | Status |
| --- | --- | --- | --- | --- |
| Payment QA retest | QA queue overload | Dev + QA | Retest evidence attached. | In swarm |
| Mobile CTA copy | Review bottleneck | PO + dev | Decision note on card. | Ready |
| Permission API | Blocker aging | Dev lead + backend owner | Spike result or escalation. | In swarm |
| Release FAQ | Handoff bottleneck | Support + PO | Support note approved. | Done |

Sample output:

```text
Swarm target:
Trigger:
Participants:
Timebox:
Exit:
Board update:
Retro signal:
```

## 11. Sample output

Nếu swarming chạy đúng, team sẽ:

- giảm work in progress;
- mở blocker nhanh hơn;
- đưa item quan trọng qua bottleneck;
- giữ Sprint Goal thay vì chỉ giữ busy level;
- học được bottleneck nào cần cải thiện hệ thống.

Kết quả xấu cần tránh:

- swarm quá đông nhưng không có target;
- mọi người họp lâu nhưng board không đổi;
- swarm không có exit criteria;
- team swarm xong rồi lại start quá nhiều việc mới.

## 12. Checklist hoàn thành

- [x] Swarm triggers đã có.
- [x] Swarm roles đã có.
- [x] Flow rescue workflow đã có.
- [x] WIP stop rules đã có.
- [x] Pairing and mobbing patterns đã có.
- [x] Exit criteria đã có.
- [x] Sample swarm board đã có.
- [x] Team biết dừng start work để cứu flow.

## 13. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `27 Exercise 19 - Cross-functional Swarming and Flow Rescue`.

Swarming tốt giúp team ít bận rộn giả hơn và hoàn thành nhiều việc quan trọng
thật hơn.
