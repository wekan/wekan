# Bài 11 - Sprint Recovery và Scope Reset

Trạng thái bài làm: đã hoàn thành playbook để team cứu một sprint đang trượt
nhịp bằng cách cắt scope, reforecast và reset cam kết một cách minh bạch.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 10. Khi sprint health và forecast cho thấy sprint có
nguy cơ fail, team không nên ngồi chờ. Cần một playbook để quyết định cái gì
giữ lại, cái gì bỏ bớt, và thông báo cho ai.

Kết quả cuối cùng của bài là:

- Recovery triggers.
- Scope-cut rules.
- Reforecast rules.
- Communication rules.
- Sample recovery plan.

## 2. Bối cảnh

Sprint đã chạy được nửa chặng nhưng các dấu hiệu xấu xuất hiện:

- burndown phẳng;
- QA dồn cuối sprint;
- một item lớn hơn dự tính;
- blocker chưa được mở;
- forecast báo không đủ capacity.

Nếu không xử lý, team sẽ vừa trễ Sprint Goal vừa mang cảm giác “đang cố mà
không ai biết phải cắt gì”. Bài này biến tình huống đó thành quyết định rõ.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- nhận ra trigger để reset scope;
- cắt scope theo giá trị, không theo cảm tính;
- reforecast trên dữ liệu thật;
- thông báo thay đổi cho PO, stakeholder và support;
- giữ board và sprint plan khớp với sự thật mới.

## 4. Recovery triggers

| Trigger | Signal | Ý nghĩa |
| --- | --- | --- |
| Forecast đỏ | Không đủ capacity cho phần còn lại. | Sprint Goal có nguy cơ fail. |
| Burndown phẳng | Remaining work không giảm. | Team bị kẹt hoặc estimate lệch. |
| QA dồn | Card chờ test tăng lên. | Risk dồn về cuối sprint. |
| Blocker mở lâu | Một blocker tồn tại nhiều ngày. | Cần escalation hoặc cut scope. |

Trigger rule:

- Không đợi đến ngày cuối mới gọi recovery.
- Chỉ cần một vài signal xấu lặp lại, team đã phải xem lại scope.

## 5. Scope-cut rules

| Rule | Cách làm |
| --- | --- |
| Giữ Sprint Goal | Không cắt mục tiêu thật sự quan trọng nhất. |
| Cắt low-value item trước | Bỏ item ít tác động nhất trước. |
| Cắt theo slice | Cắt phần phụ, không phá nguyên khối có giá trị. |
| Không giấu việc bỏ | Ghi rõ item nào bị swap hoặc defer. |
| PO quyết định cuối | PO chốt trade-off với team input. |

Scope reset checklist:

1. Xem lại mục tiêu sprint.
2. Liệt kê item còn open.
3. Chọn item giữ và item cắt.
4. Ghi lý do cắt.
5. Cập nhật board và thông báo liên quan.

## 6. Reforecast rules

Reforecast không phải là sửa số cho đẹp. Nó phải dựa trên:

- capacity còn lại;
- effort còn lại;
- blockers đang mở;
- mức độ hoàn thành thật của từng card.

Reforecast format:

```text
Old forecast:
New forecast:
Scope removed:
Scope kept:
Reason:
Decision owner:
```

Rule:

- Nếu reforecast cho thấy vẫn không đủ, tiếp tục cắt scope.
- Không giữ card chỉ vì “đã làm được một nửa”.
- Một item chưa xong mà không còn giá trị đủ lớn thì không nên ép hoàn tất.

## 7. Communication rules

| Người nhận | Cần biết gì | Kênh |
| --- | --- | --- |
| PO | Sprint Goal có đổi không, item nào bị cắt. | Daily / sync nhanh. |
| Stakeholder | Outcome nào còn giữ, outcome nào dời. | Review note / update. |
| Support | Có thay đổi nào ảnh hưởng người dùng. | Handoff note. |
| Team | Ai làm gì sau khi reset. | Board + Daily. |

Communication rule:

- Nói sớm, nói rõ, nói ngắn.
- Không để stakeholder phát hiện thay đổi sau cùng bằng cách đoán từ board.
- Nếu phạm vi đổi, board phải đổi cùng lúc.

## 8. Sample recovery plan

| Item | State | Decision |
| --- | --- | --- |
| Invite copy clarity | Done | Giữ. |
| Mobile empty-state CTA | In progress | Giữ nếu còn capacity. |
| FAQ macros | Not started | Cắt và dời sang sprint sau. |
| Advanced edge-case logging | In progress | Cắt phần nice-to-have. |

Sample recovery note:

```text
Sprint Goal remains:
We removed:
We kept:
New forecast:
Reason:
Next check:
```

## 9. Sample output

Nếu recovery chạy đúng, team sẽ:

- giữ được trọng tâm;
- không tự dối mình bằng commitment cũ;
- có board phản ánh scope mới;
- nói được rõ cái gì bị bỏ và tại sao.

Kết quả xấu cần tránh:

- cố giữ mọi thứ rồi trễ hết;
- thay đổi scope nhưng không nói cho ai;
- reforecast mà không chạm vào board;
- đổ lỗi cho team thay vì reset plan.

## 10. Checklist hoàn thành

- [x] Recovery triggers đã rõ.
- [x] Scope-cut rules đã có.
- [x] Reforecast rules đã có.
- [x] Communication rules đã có.
- [x] Sample recovery plan đã có.
- [x] Team biết giữ Sprint Goal và cắt phần phụ.
- [x] Board và forecast được reset cùng lúc.

## 11. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `19 Exercise 11 - Sprint Recovery and Scope Reset`.

Khi forecast đỏ, sprint cần hành động thật chứ không cần một cuộc họp an ủi.
