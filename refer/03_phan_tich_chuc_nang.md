# 03. Phân Tích Từng Chức Năng

## `.agent/`

| Chức năng | Đầu vào | Đầu ra | Điểm hay |
|---|---|---|---|
| `skills/` | Loại task | Năng lực dùng đúng chỗ | Dễ tái sử dụng |
| `rules/` | Tình huống vận hành | Quy tắc bắt buộc | Giảm sai sót |
| `workflows/` | Task theo vòng đời | Các bước làm việc | Dễ theo dõi |
| `roles/` | Cấu trúc team | Vai trò rõ ràng | Không chồng trách nhiệm |

## `.manager/`

| File | Chức năng | Đầu vào | Đầu ra |
|---|---|---|---|
| `current_task.md` | Task đang chạy | Task mới | Trạng thái hiện tại |
| `requirements.md` | Chuẩn hóa yêu cầu | Mô tả gốc | Yêu cầu và tiêu chí |
| `implementation.md` | Ghi chú dev | Quyết định kỹ thuật | Tóm tắt triển khai |
| `test-report.md` | Báo cáo test | Kết quả kiểm thử | Pass/Fail, issue |
| `ux-feedback.md` | Review UI/chức năng | Quan sát khách hàng | Nhận xét UX |
| `iteration_log.md` | Nhật ký vòng lặp | Mỗi lần cập nhật | Lịch sử tiến độ |
| `final_report.md` | Tổng kết | Toàn bộ task | Báo cáo bàn giao |

## `.feedback/`

| File | Chức năng | Đầu vào | Đầu ra |
|---|---|---|---|
| `inbox.md` | Ghi nhận feedback | Phản hồi mới | Danh sách issue |
| `responses.md` | Phản hồi lại | Feedback đã đọc | Quyết định xử lý |
| `action-plan.md` | Lập kế hoạch xử lý | Quyết định | Task cụ thể |
| `qa_coverage.json` | Theo dõi coverage | Dữ liệu QA | JSON hợp lệ để mở rộng |

## `refer/`

| File | Chức năng | Đầu vào | Đầu ra |
|---|---|---|---|
| `01_tong_quan_he_thong.md` | Tóm tắt hệ thống | Các thư mục chính | Bản nhìn nhanh |
| `02_flow_pipeline_prompt.md` | Phân tích luồng | Cấu trúc vận hành | Mô tả pipeline |
| `03_phan_tich_chuc_nang.md` | Mổ xẻ chức năng | File hiện có | Bản đồ chức năng |
| `04_dau_vao_dau_ra.md` | Chuẩn hóa I/O | Workflow, state, feedback | Bảng input/output |
| `05_diem_manh_rui_ro.md` | Đánh giá hệ thống | Toàn bộ cấu trúc | Ưu điểm và rủi ro |
| `06_goi_y_rule_workflow.md` | Bổ sung đề xuất | Nhu cầu vận hành | Rule và workflow thông dụng |

## Điểm hay nhất

- Mỗi thư mục có một vai trò duy nhất.
- Mỗi file có format riêng nhưng vẫn liên kết với nhau.
- Dễ cắm thêm tool, role hoặc workflow mới mà không phá hệ cũ.
