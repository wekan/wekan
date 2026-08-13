# Bài 12 - Retro Action Tracking và Improvement Backlog

Trạng thái bài làm: đã hoàn thành playbook để team biến retrospective actions
thành một backlog cải tiến có owner, deadline và tín hiệu thành công rõ ràng.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 11. Sau khi sprint được recovery hoặc kết thúc, team
không chỉ ghi note trong Retro. Team cần một cách biến action thành backlog
thật để việc cải tiến tiếp tục chạy trong sprint sau.

Kết quả cuối cùng của bài là:

- Retrospective action capture.
- Owner assignment.
- Due date rules.
- Success measure rules.
- Backlog intake.
- Sample improvement backlog.

## 2. Bối cảnh

Retrospective thường tạo ra nhiều ý hay:

- giảm blocker sớm hơn;
- tách QA sớm hơn;
- viết acceptance criteria rõ hơn;
- bớt scope creep;
- đẩy stakeholder sync sớm hơn.

Nhưng nếu những action đó chỉ nằm trên slide hoặc trong note, sprint sau sẽ
lại lặp cùng một lỗi. Bài này biến action thành một backlog có thể theo dõi.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- capture action từ retrospective thành format rõ;
- assign owner và due date cho từng action;
- gắn success measure để biết action có tác dụng không;
- đưa improvement item vào backlog đúng chỗ;
- review action trong sprint tiếp theo.

## 4. Retrospective action capture

Format:

```text
Action:
Problem:
Owner:
Due:
Success measure:
Checkpoint:
```

Rule:

- Mỗi action phải bắt đầu từ một vấn đề thật.
- Không ghi action chung chung kiểu “làm tốt hơn”.
- Nếu không có owner, action chưa sẵn sàng.

## 5. Owner assignment

| Action type | Owner chính | Support |
| --- | --- | --- |
| Flow / board issue | Scrum Master | Developers |
| Test / QA issue | QA lead | Developers |
| Scope / prioritization issue | PO | Scrum Master |
| Communication issue | Scrum Master / PO | Team |

Owner rule:

- Một action chỉ có một owner chính.
- Owner phải biết họ sẽ báo gì ở checkpoint.
- Nếu owner bị mơ hồ, action còn quá rộng.

## 6. Due date rules

Due date không phải để làm cho có. Nó giúp action không treo mãi.

Rules:

- Action nhỏ: due trong sprint kế tiếp.
- Action vừa: due trong 1-2 sprint.
- Action lớn: chia nhỏ trước khi đưa vào backlog.
- Nếu deadline qua rồi mà action chưa xong, phải review lại lý do.

## 7. Success measure rules

| Action | Success measure |
| --- | --- |
| Daily Scrum cải tiến | Cuộc họp ngắn hơn và có ít blocker rơi mất hơn. |
| QA sớm hơn | QA queue giảm ở cuối sprint. |
| Scope control tốt hơn | Ít item bị mở rộng ngoài kế hoạch. |
| Stakeholder sync sớm hơn | Ít surprise ở Sprint Review. |

Rule:

- Mỗi action phải đo được bằng dấu hiệu cụ thể.
- Không dùng “mọi người thấy ổn hơn” làm success measure chính.
- Nếu không đo được, action chưa đủ sắc.

## 8. Backlog intake

Improvement backlog nên nằm cùng hệ backlog nhưng có nhãn riêng.

Flow:

1. Retrospective tạo action.
2. PO/SM ghi action thành backlog item.
3. Item được ordered cùng backlog khác.
4. Sprint Planning xem item nào đủ giá trị để vào sprint.
5. Owner báo checkpoint ở sprint sau.

Backlog rule:

- Không để improvement item chen lẫn mà không có nhãn.
- Không biến mọi action thành task kỹ thuật nhỏ nếu nó là vấn đề quy trình.
- Nếu action đụng nhiều người, cần viết như một item thật.

## 9. Sample improvement backlog

| Item | Problem | Owner | Due | Success measure |
| --- | --- | --- | --- | --- |
| Daily update format chuẩn hóa | Daily vẫn dài và loãng. | SM | Next sprint | Daily ngắn hơn và blocker rõ hơn. |
| QA swarming sớm | QA queue dồn cuối sprint. | QA lead | 2 sprint | QA dồn cuối sprint giảm. |
| Scope reset rule | Sprint bị trễ vì giữ quá nhiều item. | PO | Next sprint | Ít item bị cứu muộn. |
| Stakeholder sync sớm | Review mới biết issue lớn. | PO | 1 sprint | Ít surprise ở Review. |

Sample output:

```text
Action backlog:
Owned:
Due:
First checkpoint:
Result after 1 sprint:
Keep / change / drop:
```

## 10. Sample output

Nếu action tracking chạy đúng, team sẽ:

- biết cải tiến nào đang thật sự được làm;
- biết ai chịu trách nhiệm;
- biết cải tiến nào có hiệu quả;
- tránh tình trạng retro nhiều nhưng không đổi được gì.

Kết quả xấu cần tránh:

- action chỉ nằm trên note;
- không có owner;
- due date bị quên;
- sprint sau không còn ai nhớ cải tiến cũ.

## 11. Checklist hoàn thành

- [x] Retrospective action capture đã có.
- [x] Owner assignment đã rõ.
- [x] Due date rules đã có.
- [x] Success measure rules đã có.
- [x] Backlog intake đã có.
- [x] Sample improvement backlog đã có.
- [x] Team biết review action ở sprint sau.

## 12. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `20 Exercise 12 - Retro Action Tracking and Improvement Backlog`.

Retro chỉ thật sự có giá trị khi action của nó đi vào backlog và có người giữ
nhịp.
