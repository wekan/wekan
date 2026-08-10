# 05. Điểm Mạnh Và Rủi Ro

## Điểm mạnh

| Điểm mạnh | Ý nghĩa thực tế |
|---|---|
| Phân tầng rõ | Dễ quản lý từng lớp việc |
| Có state riêng | PM theo dõi tiến độ nhanh |
| Có feedback loop | Không mất phản hồi |
| Có rule chia nhỏ file | Giảm tràn context |
| Có vai trò khách hàng | UI/chức năng được soi thật |

## Rủi ro

| Rủi ro | Khi nào xảy ra | Cách giảm |
|---|---|---|
| Quá nhiều file nhỏ | Task bị chia vụn | Gom theo responsibility |
| State không được cập nhật | Agent làm xong nhưng không ghi | Bắt buộc theo rule |
| Feedback bị treo | Không trả lời hoặc không lập plan | Luôn đi qua 3 file `.feedback/` |
| Prompt quá dài | Context phình | Chia prompt theo workflow |

## Kết luận

Hệ thống này mạnh ở tính kỷ luật và khả năng mở rộng. Nếu giữ
được discipline về state và split file, nó sẽ chạy ổn trong dự án dài hơi.
