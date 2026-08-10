# Bài 7 - Roadmap và Prioritization

Trạng thái bài làm: đã hoàn thành bản playbook để team chọn việc kế tiếp dựa
trên metrics, feedback, risk và giá trị user thay vì chỉ chọn việc "trông quan
trọng".

## 1. Bài này nói về gì?

Bài tập này giúp team biến dữ liệu từ Bài 6 thành roadmap và thứ tự ưu tiên.
Không phải mọi ý tưởng đều làm ngay. Team cần một cách rõ để so sánh trade-off,
chốt một quarter slice hoặc sprint slice, và giữ backlog phản ánh đúng mục
tiêu sản phẩm.

Kết quả cuối cùng của bài là:

- Prioritization method.
- Scoring criteria.
- Roadmap slices.
- Trade-off discussion.
- Decision format.
- Backlog ordering.

## 2. Bối cảnh

Sau Bài 6, team đã biết:

- board creation success rate tăng;
- invite failure rate còn cao ở một số case;
- mobile empty-state activation vẫn chưa mạnh;
- support ticket count cần giảm thêm;
- escaped defects đang được giữ ở mức thấp.

Vấn đề bây giờ là:

1. Nên ưu tiên fix gì trước?
2. Có cần làm roadmap quý hay chỉ cần sprint tiếp theo?
3. Cái gì đủ giá trị để đưa vào ngay, cái gì nên đợi?

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- Chọn một method ưu tiên nhất quán.
- Chấm score dựa trên cùng một bộ tiêu chí.
- Chia roadmap thành các slice nhỏ có ý nghĩa.
- Nói rõ trade-off khi bỏ qua một ý tưởng.
- Chốt decision và thứ tự backlog để sprint sau dùng được ngay.

## 4. Prioritization method

Team dùng ma trận đơn giản:

| Trục | Ý nghĩa |
| --- | --- |
| Value | Tăng user outcome, adoption hoặc revenue/support efficiency. |
| Effort | Bao nhiêu công để làm xong. |
| Risk reduction | Giảm rủi ro kỹ thuật, support hoặc release. |

Quy tắc:

- Value cao, effort thấp, risk reduction cao thì ưu tiên trước.
- Item có dependency nặng nhưng impact lớn vẫn có thể lên hàng đầu nếu giảm
  nhiều risk.
- Ý tưởng không gắn metric hoặc user problem thì không vào roadmap slice.

## 5. Scoring criteria

Mỗi item được chấm 1-5 cho từng tiêu chí:

| Tiêu chí | Câu hỏi |
| --- | --- |
| User impact | Có giúp người dùng chính làm việc nhanh hơn hoặc ít kẹt hơn không? |
| Support impact | Có giảm ticket hoặc support pain không? |
| Delivery risk | Có giảm risk release hoặc regression không? |
| Effort | Team có làm trong 1 sprint được không? |
| Strategic fit | Có khớp Product Goal hoặc quarter goal không? |

Score format:

```text
Item:
User impact:
Support impact:
Delivery risk:
Effort:
Strategic fit:
Total:
Decision:
```

## 6. Roadmap slices

| Slice | Mục tiêu | Ví dụ item |
| --- | --- | --- |
| Now | Làm trong sprint kế tiếp. | Fix invite status explanation. |
| Next | Làm ngay sau đó. | Improve empty-state CTA mobile. |
| Later | Có giá trị nhưng chưa đủ gấp. | More onboarding templates. |
| Never / hold | Chưa có evidence đủ mạnh. | Advanced customization chưa cần. |

Roadmap rule:

- Mỗi slice phải nói được outcome, không chỉ liệt kê feature.
- Slice Now phải đủ nhỏ để team commit trong sprint planning.
- Slice Next phải có liên hệ với metric hoặc feedback rõ.

## 7. Sample prioritization table

| Item | User impact | Support impact | Delivery risk | Effort | Strategic fit | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Explain invite states better | 5 | 5 | 4 | 2 | 5 | Now |
| Improve mobile empty-state CTA | 4 | 3 | 2 | 2 | 4 | Next |
| Add more starter templates | 3 | 2 | 1 | 4 | 2 | Later |
| Advanced permission editor | 2 | 1 | 1 | 5 | 1 | Hold |

## 8. Trade-off discussion

Question:

- Nếu làm invite explanation trước, team có bỏ lỡ gì không?
- Nếu làm templates trước, metric nào sẽ cải thiện chậm lại?
- Nếu làm permission trước, user outcome chính có tốt hơn ngay không?

Decision note:

```text
Decision:
Reason:
What we defer:
What we protect:
Owner:
Review point:
```

## 9. Backlog ordering

Product Backlog sau prioritization nên đọc như sau:

1. Explain invite states better.
2. Improve mobile empty-state CTA.
3. Add better support FAQ/macros.
4. Add more starter templates.
5. Explore advanced permission editor later.

Rule:

- Top item phải là item team thật sự muốn làm trong next sprint.
- Nếu item không còn đứng đầu nữa, đừng để nó ở đỉnh backlog.

## 10. Sample output

| Output | Nội dung |
| --- | --- |
| Method chosen | Value / Effort / Risk reduction. |
| Now slice | Invite states and support clarity. |
| Next slice | Mobile empty-state CTA improvement. |
| Later slice | Starter templates expansion. |
| Hold slice | Advanced permission editor. |
| Decision note | Chốt by PO + team review. |

## 11. Checklist hoàn thành

- [x] Prioritization method đã được chọn.
- [x] Scoring criteria đã có.
- [x] Roadmap slices đã có.
- [x] Trade-off discussion đã có.
- [x] Sample prioritization table đã có.
- [x] Backlog ordering đã rõ.
- [x] Decision note đã có format.
- [x] Team biết item nào nên làm next sprint.

## 12. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `15 Exercise 7 - Roadmap and Prioritization`.

Khi metric thay đổi, roadmap slice nên được cập nhật cùng Product Backlog chứ
không giữ nguyên theo cảm giác cũ.
