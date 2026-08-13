# Bài 10 - Sprint Health, Burndown và Forecasting

Trạng thái bài làm: đã hoàn thành playbook để team đọc sprint health mỗi ngày,
nhìn burndown đúng cách và forecast sớm khi sprint đang trượt khỏi nhịp.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 9. Khi Daily Scrum đã chạy ổn, team cần một cách đọc
board và số liệu để biết sprint đang khỏe hay đang chậm dần.

Kết quả cuối cùng của bài là:

- Sprint health signals.
- Burndown interpretation.
- Forecast rules.
- Intervention rules.
- Sample health snapshot.

## 2. Bối cảnh

Daily Scrum cho team biết hôm nay cần phối hợp gì. Nhưng nếu chỉ nhìn từng
ngày một, team vẫn dễ bỏ lỡ xu hướng xấu:

- burndown không giảm;
- WIP ở một cột đứng lâu;
- blocker tăng dần;
- QA bắt đầu dồn cuối sprint;
- forecast cho thấy không đủ capacity cho phần còn lại.

Bài này dùng các tín hiệu đó để team phát hiện sớm, điều chỉnh sớm và tránh
đợi tới cuối sprint mới biết mình trễ.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- đọc sprint health bằng một bộ tín hiệu đơn giản;
- hiểu burndown đang nói gì thay vì chỉ nhìn đường biểu đồ;
- forecast sớm nếu sprint có nguy cơ fail;
- quyết định khi nào cần giảm scope, swat item, hay escalate;
- giữ board phản ánh đúng trạng thái thật.

## 4. Sprint health signals

| Signal | Ý nghĩa | Cảnh báo |
| --- | --- | --- |
| Burndown | Remaining work có giảm đều không. | Đứng yên hoặc tăng là có vấn đề. |
| WIP aging | Card nào nằm quá lâu ở một cột. | > 2 ngày ở In Progress hoặc QA. |
| Blocker count | Có bao nhiêu blocker đang mở. | Tăng liên tục qua nhiều ngày. |
| Throughput | Có card nào thật sự xong không. | 2 ngày liền không có output. |
| QA queue | Việc chờ test có dồn không. | QA dồn cuối sprint là dấu hiệu trễ. |

Health rule:

- Không cần quá nhiều metric.
- Chỉ cần 4-5 tín hiệu team thật sự nhìn được mỗi ngày.
- Một signal xấu nhiều ngày liên tiếp thì phải có action, không chỉ note.

## 5. Burndown interpretation

| Pattern | Diễn giải | Action |
| --- | --- | --- |
| Đường giảm đều | Sprint đang đi đúng nhịp. | Giữ nguyên cách chạy. |
| Đường phẳng nhiều ngày | Work không chảy hoặc estimate lệch. | Kiểm blocker và WIP. |
| Đường giảm rồi bật lên | Scope đổi hoặc re-open work. | Ghi lại lý do và reevaluate. |
| Đường còn cao cuối sprint | Cơ hội miss commitment. | Giảm scope hoặc swap sớm. |

Burndown rule:

- Không coi burndown là report trang trí.
- Nếu burndown xấu, team phải hỏi “vì sao” chứ không chỉ “bao nhiêu”.
- Burndown cần đọc cùng board, QA queue và blocker list.

## 6. Forecast rules

Forecast không phải đoán mò. Nó là ước lượng còn lại dựa trên:

- capacity còn lại;
- velocity hoặc throughput gần đây;
- số card còn open;
- blocker và risk hiện tại.

Forecast format:

```text
Scope remaining:
Team capacity remaining:
Expected done items:
Risk to forecast:
Decision:
```

Forecast rule:

- Nếu forecast không đủ để đạt Sprint Goal, team phải chốt sớm.
- Không để nguy cơ trễ thành “chắc đến cuối mới tính”.
- Forecast xấu phải đi kèm quyết định: giảm scope, đổi ưu tiên, hoặc xin hỗ trợ.

## 7. Intervention rules

| Tình huống | Signal | Cách can thiệp |
| --- | --- | --- |
| Một item bị kẹt lâu | WIP aging tăng. | Swarm, unblock, hoặc split nhỏ hơn. |
| QA dồn cuối sprint | Test queue tăng. | Đẩy test sớm hoặc tách review sớm hơn. |
| Burndown phẳng | Không giảm remaining. | Kiểm lại estimate và blocker. |
| Forecast đỏ | Không đủ capacity còn lại. | Giảm scope ngay, không đợi review. |

Intervention rule:

- Can thiệp phải nhỏ và sớm.
- Team không nên chờ mọi thứ vỡ rồi mới hành động.
- Nếu action không đổi được forecast, PO và team phải renegotiate Sprint Goal.

## 8. Sample health snapshot

| Day | Remaining points | Blockers | WIP aging | Forecast |
| --- | ---: | ---: | ---: | --- |
| Mon | 18 | 1 | 0 | On track |
| Tue | 15 | 1 | 1 | Slight risk |
| Wed | 15 | 2 | 2 | At risk |
| Thu | 11 | 2 | 2 | Behind |
| Fri | 8 | 1 | 1 | Miss likely unless scope drops |

Sample decision:

- Mon/Tue: giữ nhịp và xử lý blocker nhỏ.
- Wed: can thiệp vì burndown phẳng.
- Thu: giảm scope hoặc swarm QA.
- Fri: chốt lại phần còn lại và không tự lừa mình bằng lời hứa mơ hồ.

## 9. Sample output

Nếu Sprint Health được đọc đúng, team sẽ:

- biết sớm sprint nào đang tốt;
- biết sớm sprint nào cần giảm scope;
- tránh dồn lỗi sang cuối sprint;
- có quyết định rõ ràng thay vì cảm giác mơ hồ.

Kết quả xấu cần tránh:

- metric được xem nhưng không ai hành động;
- forecast thay đổi mỗi ngày mà không có lý do;
- burndown xấu nhưng review vẫn báo “ổn”;
- board và thực tế không khớp nhau.

## 10. Checklist hoàn thành

- [x] Sprint health signals đã rõ.
- [x] Burndown interpretation đã có.
- [x] Forecast rules đã có.
- [x] Intervention rules đã có.
- [x] Sample health snapshot đã có.
- [x] Team biết khi nào cần giảm scope hoặc swarm.
- [x] Board và metric được nhìn cùng nhau.

## 11. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `18 Exercise 10 - Sprint Health and Forecasting`.

Sprint health nên giúp team sửa course giữa sprint, không phải chỉ để tổng kết
sau khi đã trễ.
