# Bài 14 - Planning Poker và Estimate Calibration

Trạng thái bài làm: đã hoàn thành playbook để team estimate backlog items bằng
Planning Poker và calibration rules thay vì đoán theo cảm giác cá nhân.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 13. Sau khi backlog đã sạch, team cần ước lượng các
item Ready theo cùng một cách để Sprint Planning không bị lệch vì người thì
nhìn nhỏ, người thì nhìn to.

Kết quả cuối cùng của bài là:

- Estimation principles.
- Planning Poker flow.
- Calibration rules.
- Split rules.
- Consensus rules.
- Sample estimation session.

## 2. Bối cảnh

Backlog sạch chưa đủ. Nếu team estimate mỗi lần một kiểu:

- item cùng size nhưng người này chấm 2, người kia chấm 8;
- một số người quá tự tin, số khác quá thận trọng;
- sprint planning bị kéo dài vì tranh luận cảm tính;
- velocity không ổn định vì size không có chuẩn chung.

Bài này đặt ra cách estimate nhất quán để team dùng chung ngôn ngữ.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- estimate item Ready bằng Planning Poker;
- calibrate size theo ví dụ thật;
- split item quá lớn trước khi chốt estimate;
- chốt consensus mà không kéo dài vô ích;
- dùng estimate cho sprint selection và capacity planning.

## 4. Estimation principles

| Principle | Ý nghĩa |
| --- | --- |
| Relative sizing | So sánh item với item khác, không đo như thời gian tuyệt đối. |
| Shared understanding | Estimate chỉ có giá trị khi team hiểu cùng một thứ. |
| Calibration | Dùng ví dụ cũ để giữ thang size ổn định. |
| Uncertainty first | Cái chưa rõ phải được làm rõ trước khi chốt số. |

Rule:

- Estimate không phải lời hứa.
- Estimate không phải mức độ cá nhân thích hay ghét.
- Estimate chỉ hữu ích khi team còn dùng nó cho planning.

## 5. Planning Poker flow

| Bước | Nội dung | Output |
| --- | --- | --- |
| 1 | PO/SM đọc item và acceptance criteria. | Team hiểu scope. |
| 2 | Team hỏi để làm rõ uncertainty. | Missed detail được lộ ra. |
| 3 | Mỗi người chọn size riêng. | Không bị neo theo người khác. |
| 4 | Reveal cùng lúc. | Chênh lệch được nhìn thấy. |
| 5 | Thảo luận các khác biệt lớn. | Hiểu lý do lệch. |
| 6 | Vote lại nếu cần. | Consensus hoặc split. |

Planning Poker rule:

- Không reveal từng người một.
- Không cố ép mọi người vào một số ngay từ vòng đầu.
- Nếu chênh lệch lớn, phải nói ra assumption khác nhau.

## 6. Calibration rules

| Rule | Cách làm |
| --- | --- |
| Anchor bằng ví dụ cũ | Dùng item đã làm xong làm mốc. |
| Giữ thang size nhỏ | Chỉ dùng các mức mà team thực sự hiểu. |
| Recalibrate mỗi sprint | Xem lại nếu size lệch dần theo thời gian. |
| Ghi lý do cho outlier | Item nào quá lệch thì viết note. |

Calibration format:

```text
Reference item:
Size:
Why this size:
Similar item:
Why different:
```

Rule:

- Nếu team không có ví dụ mốc, estimate sẽ trôi.
- Calibration tốt giúp speed của planning tăng dần.
- Size không ổn định thì phải sửa cách calibrate, không chỉ sửa số.

## 7. Split rules

| Situation | Action |
| --- | --- |
| Item quá lớn | Split theo slice có outcome rõ. |
| Item nhiều state | Tách theo state hoặc flow. |
| Item nhiều dependency | Tách discovery spike trước. |
| Item còn mơ hồ | Làm rõ rồi mới estimate. |

Split rule:

- Nếu item quá lớn để estimate ổn, split trước.
- Không estimate để che sự mơ hồ.
- Split xong phải có item nhỏ đủ rõ để planning.

## 8. Consensus rules

| Tình huống | Quyết định |
| --- | --- |
| Cả team khá đồng ý | Chốt số và đi tiếp. |
| Một hai người lệch xa | Hỏi lý do assumption khác. |
| Lệch do thiếu info | Clarify rồi vote lại. |
| Lệch do item quá lớn | Split item trước khi estimate lại. |

Consensus rule:

- Consensus không phải đồng ý miễn cưỡng.
- Nếu không thể chốt gọn, item chưa Ready thật sự.
- Estimate xấu thường là symptom của requirement chưa rõ.

## 9. Sample estimation session

| Item | Initial spread | Decision |
| --- | --- | --- |
| Invite email wording fix | 1, 2, 2 | 2 |
| Mobile CTA update | 2, 3, 5 | Split then estimate. |
| Support macro cleanup | 1, 1, 2 | 1-2 |
| Permission copy clarification | 3, 5, 8 | Clarify dependency first. |

Sample output:

```text
Item:
Reference:
Size:
Main uncertainty:
Split?:
Decision:
```

## 10. Sample output

Nếu Planning Poker chạy đúng, team sẽ:

- estimate nhanh hơn;
- ít tranh luận cảm tính hơn;
- giữ size ổn định qua các sprint;
- có dữ liệu planning đáng tin hơn.

Kết quả xấu cần tránh:

- estimate theo người nói to nhất;
- size thay đổi vì mood;
- planning kéo dài nhưng không rõ hơn;
- item to vẫn được nhét vào sprint.

## 11. Checklist hoàn thành

- [x] Estimation principles đã có.
- [x] Planning Poker flow đã có.
- [x] Calibration rules đã có.
- [x] Split rules đã có.
- [x] Consensus rules đã có.
- [x] Sample estimation session đã có.
- [x] Team biết split trước khi estimate nếu item quá to.

## 12. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `22 Exercise 14 - Planning Poker and Estimate Calibration`.

Estimate tốt giúp sprint planning ít cãi nhau và ít trượt hơn.
