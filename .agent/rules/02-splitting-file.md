# Rule: Splitting File

Luôn ưu tiên chia nhỏ file khi task bắt đầu phình ra.

## Tự kích hoạt

- Một file chạm nhiều trách nhiệm.
- Một patch phải đụng quá nhiều khối logic.
- Context có nguy cơ bị tràn.

## Cách làm

- Tách theo responsibility.
- Tách theo feature hoặc layer.
- Giữ entry point mỏng, logic nặng đưa sang module riêng.

## Mục đích

Giúp dự án dễ bảo trì, dễ đọc và dễ mở rộng mà không vỡ context.
