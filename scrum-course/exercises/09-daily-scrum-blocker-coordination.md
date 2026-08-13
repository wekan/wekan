# Bài 9 - Daily Scrum và Blocker Coordination

Trạng thái bài làm: đã hoàn thành playbook để team chạy Daily Scrum ngắn gọn,
giữ Sprint Goal ở trung tâm, và xử lý blocker cùng ngày thay vì để nó âm ỉ.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 8. Sau khi team đã chốt sprint plan, điều quan trọng
tiếp theo là nhịp hằng ngày: hôm nay ai đang làm gì, việc nào đang kẹt, và cần
phối hợp với ai để sprint không trôi khỏi mục tiêu.

Kết quả cuối cùng của bài là:

- Daily Scrum purpose.
- Daily Scrum agenda.
- Blocker handling.
- Coordination rules.
- Sample daily update format.
- Escalation policy.

## 2. Bối cảnh

Sprint plan đã có rồi, nhưng sprint thực tế luôn có ma sát:

- một slice hoàn thành sớm;
- một dependency chưa xong;
- một bug làm chậm QA;
- một câu hỏi copy/UX cần PO chốt ngay;
- một việc support chen vào giữa ngày.

Nếu Daily Scrum chỉ thành status report thì team biết “ai bận”, nhưng không
biết “ai cần giúp gì”. Bài này đặt ra cách chạy Daily Scrum để team hành động
được ngay sau cuộc họp.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- chạy Daily Scrum trong 15 phút hoặc ít hơn;
- giữ Daily Scrum quanh Sprint Goal thay vì quanh manager report;
- phát hiện blocker sớm;
- assign follow-up rõ ràng ngay trong ngày;
- giữ board và Sprint Backlog phản ánh trạng thái thật.

## 4. Daily Scrum purpose

Daily Scrum không phải là buổi báo cáo tiến độ. Nó là điểm đồng bộ để team
kiểm tra tiến độ thật so với Sprint Goal.

Ba câu hỏi chính:

1. Việc gì hôm qua đã giúp Sprint Goal tiến lên?
2. Hôm nay cần phối hợp gì để giữ đà?
3. Có blocker nào cần xử lý ngay không?

Rule:

- Mọi người nói ngắn, cùng một board.
- Nếu câu chuyện dài hơn 2 phút, park lại sau Daily.
- Scrum Master chỉ giữ nhịp, không biến Daily thành kiểm soát.

## 5. Daily Scrum agenda

| Thời điểm | Nội dung | Output |
| --- | --- | --- |
| 0-2 phút | Nhắc Sprint Goal và nhìn board. | Team có cùng mục tiêu trong đầu. |
| 2-8 phút | Mỗi người nói phần việc đã tiến lên. | Progress thật được ghi nhận. |
| 8-12 phút | Nêu blocker và dependency. | Danh sách việc cần follow-up. |
| 12-15 phút | Chốt phối hợp trong ngày. | Owner, action và thời hạn rõ. |

Agenda rule:

- Không đi sâu solution trong cuộc họp.
- Không tranh luận dài về một card.
- Không để một người nói quá lâu chỉ vì họ có nhiều việc.

## 6. Blocker handling

| Blocker | Signal | Action |
| --- | --- | --- |
| Chưa rõ acceptance criteria | Team hỏi lại cùng một câu nhiều lần. | PO/owner chốt lại ngay sau Daily. |
| Dependency bên ngoài | Card chờ người khác phản hồi. | Ghi owner và hẹn thời điểm follow-up. |
| QA bị kẹt | Test fail hoặc thiếu môi trường. | Escalate cho QA/DevOps trong ngày. |
| Support chen vào sprint | Việc phát sinh làm đứt flow. | PO/SM triage, quyết định giữ hay swap. |

Blocker rule:

- Blocker phải được viết ra, không chỉ nói miệng.
- Mỗi blocker cần một owner rõ.
- Nếu blocker chưa được mở trong cùng ngày, escalate.

## 7. Coordination rules

Daily Scrum phải tạo ra phối hợp, không chỉ tạo ra danh sách chờ.

Rules:

- Nếu hai người phải sync với nhau, đặt hẹn ngay sau Daily.
- Nếu QA cần input từ dev, dev phải nói rõ lúc nào bàn giao.
- Nếu PO cần quyết định, PO phải chốt trong ngày.
- Nếu việc đổi scope xuất hiện, nó phải đi qua PO trước.

Follow-up format:

```text
Blocker:
Owner:
Need from:
Next check:
Escalation:
```

## 8. Sample daily update format

| Người | Hôm qua | Hôm nay | Blocker | Follow-up |
| --- | --- | --- | --- | --- |
| Frontend | Xong invite state copy. | Sửa empty state CTA. | Chưa có asset final. | Hỏi UX sau Daily. |
| Backend | Xong endpoint logging. | Hỗ trợ invite fail reason. | Chờ confirm schema. | Sync với PO trong 15 phút. |
| QA | Test xong luồng board create. | Test invite và blocker flow. | Môi trường staging chậm. | Escalate DevOps ngay. |
| UX | Chốt layout CTA mobile. | Review text final. | Cần PO duyệt wording. | Họp nhanh sau Daily. |

Output format:

```text
Sprint Goal:
Yesterday progress:
Today focus:
Blockers:
Need help from:
Follow-up owner:
Due:
```

## 9. Sample output

Nếu Daily Scrum chạy đúng, team sẽ có:

- board được cập nhật đúng trạng thái;
- blocker list ngắn và rõ;
- follow-up owner cho từng điểm nghẽn;
- một hoặc hai cuộc trao đổi ngắn sau Daily thay vì một cuộc họp dài chung.

Kết quả xấu cần tránh:

- mọi người chỉ báo cáo cá nhân;
- blocker được nhắc nhưng không ai nhận;
- team rời Daily mà vẫn không biết ai xử lý gì;
- board không phản ánh việc đang kẹt.

## 10. Checklist hoàn thành

- [x] Daily Scrum purpose đã rõ.
- [x] Agenda 15 phút đã có.
- [x] Blocker handling đã có rule.
- [x] Coordination rules đã rõ.
- [x] Sample daily update format đã có.
- [x] Escalation policy đã có.
- [x] Team biết cách park discussion dài.
- [x] Board và Sprint Backlog được cập nhật sau Daily.

## 11. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `17 Exercise 9 - Daily Scrum and Blocker Coordination`.

Daily Scrum nên nhìn vào Sprint Goal và các card đang chặn flow, không nên chỉ
đọc danh sách người bận.
