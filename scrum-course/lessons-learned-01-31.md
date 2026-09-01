# Kinh nghiệm rút ra sau 31 bài Scrum

Tài liệu này tổng kết những kiến thức và kinh nghiệm đã tích lũy sau 31 bài
đầu tiên trong mục tiêu 100 bài. Hiện đã hoàn thành 31 bài và còn 69 bài.

## 1. Năng lực đã xây dựng

| Chặng | Bài | Năng lực chính |
| --- | --- | --- |
| Nền tảng Agile | 1-5 | Đánh giá khoảng cách Agile, thiết kế workflow, lập kế hoạch, Review, Retro và bàn giao release |
| Điều hành Sprint | 6-11 | Đo lường, ưu tiên roadmap, quản lý capacity, blocker, dự báo và cứu Sprint |
| Tổ chức đội nhóm | 12-20 | Quản lý backlog, estimation, working agreement, dependency, stakeholder, xung đột, swarming và chia sẻ kiến thức |
| Chất lượng và vận hành | 21-25 | Technical debt, CI quality gates, incident response, SLI/SLO và progressive rollout |
| Product Discovery | 26-28 | Adoption, retention, phản hồi sau phát hành, A/B testing và opportunity mapping |
| Chuyển nhu cầu thành sản phẩm | 29-31 | Story mapping, MVP slicing, acceptance criteria, test scenario và test automation |

Qua sáu chặng này, khóa học đã hình thành một vòng đời delivery tương đối đầy
đủ: khám phá vấn đề, chọn việc cần làm, lập kế hoạch, thực thi, kiểm thử, phát
hành, vận hành và học từ phản hồi thực tế.

## 2. Kinh nghiệm cốt lõi

### Scrum phải tạo ra quyết định

Scrum không có giá trị chỉ vì đội nhóm tổ chức đủ các cuộc họp. Mỗi sự kiện cần
tạo ra một quyết định, một người chịu trách nhiệm và hành động tiếp theo. Sprint
Goal quan trọng hơn việc cố hoàn thành thật nhiều task rời rạc.

### Kanban cần policy và giới hạn WIP

Một bảng công việc chưa phải là Kanban. Workflow cần tiêu chí vào và ra rõ ràng,
WIP limit, luật xử lý blocker và cách đo tốc độ luồng. Khi luồng bị nghẽn, đội
nhóm nên hỗ trợ hoàn thành việc đang mở trước khi nhận thêm việc mới.

### Cam kết phải dựa trên năng lực thực tế

Không nên lập Sprint theo cảm giác. Cam kết cần dựa trên capacity, mức độ sẵn
sàng của backlog, dependency, rủi ro và buffer. Khi Sprint có nguy cơ thất bại,
nên bảo vệ Sprint Goal và cắt phần phạm vi ít giá trị trước.

### Backlog là tài sản cần được chăm sóc

Backlog xuống cấp theo thời gian. Các item cũ, trùng lặp, thiếu bằng chứng hoặc
không còn phù hợp cần được cập nhật, gộp hay loại bỏ. Refinement tốt giúp giảm
tranh luận và rework sau khi bắt đầu phát triển.

### Feedback phải quay lại hệ thống

Feedback từ Review, Retro, incident và khách hàng chỉ có giá trị khi được chuyển
thành quyết định hoặc backlog item có owner, thời hạn và thước đo thành công.
Một buổi họp không tạo ra hành động theo dõi chỉ là trao đổi thông tin.

### Metrics là tín hiệu, không phải đồ trang trí

Burndown, cycle time, adoption, retention và error budget phải hỗ trợ quyết định.
Không nên dùng metrics để làm đẹp báo cáo hoặc đánh giá cá nhân, vì điều đó dễ
khiến đội nhóm tối ưu con số thay vì tối ưu giá trị và chất lượng.

### Chất lượng phải được xây từ đầu

Acceptance criteria, negative cases, test data, regression coverage, CI gates
và automation cần được nghĩ đến trước release. Chất lượng không thể được bổ sung
đầy đủ ở cuối quy trình bằng một vòng kiểm thử vội vàng.

### Phát hành không phải là điểm kết thúc

Release cần có chiến lược rollout, monitoring, rollback trigger và người chịu
trách nhiệm. Sau phát hành phải tiếp tục theo dõi reliability, adoption, usage,
retention và phản hồi người dùng để quyết định mở rộng, sửa đổi hay quay lui.

### Discovery phải đi trước delivery

Trước khi đầu tư xây giải pháp, cần xác định đúng phân khúc khách hàng, vấn đề,
bằng chứng và giả định. Opportunity mapping và experiment giúp giảm nguy cơ đội
nhóm xây đúng kỹ thuật nhưng sai nhu cầu.

### User story phải kiểm thử được

Chuỗi Story Mapping -> Example Mapping -> Acceptance Criteria -> Test Strategy
giúp chuyển một nhu cầu mơ hồ thành phạm vi nhỏ, hành vi cụ thể và bằng chứng có
thể kiểm tra. Đây là cầu nối quan trọng giữa product, development và testing.

### Kết quả chung quan trọng hơn hiệu suất cá nhân

Swarming, pairing, rotation và chia sẻ kiến thức giúp giảm bottleneck và bus
factor. Một đội nhóm bận rộn 100% chưa chắc tạo ra flow tốt; mục tiêu là đưa giá
trị hoàn chỉnh đến người dùng, không phải giữ từng người luôn có việc riêng.

## 3. Điều cần cải thiện trong 69 bài tiếp theo

31 bài đầu đã xây được khung kiến thức và các playbook tương đối đầy đủ. Hạn chế
lớn nhất là nhiều tình huống vẫn dựa trên dữ liệu mẫu. Vì vậy, 69 bài tiếp theo
nên ưu tiên:

- áp dụng nội dung vào dự án và backlog thật;
- dùng dữ liệu thật để tính capacity, flow, quality và product metrics;
- thực hiện role-play cho Planning, Review, Retro, incident và stakeholder
  alignment;
- theo dõi một quyết định qua nhiều Sprint thay vì kết thúc trong một bài;
- ghi lại giả định, kết quả thực tế và điều chỉnh sau mỗi thử nghiệm;
- tạo bằng chứng đầu ra như board, decision log, test report, release plan và
  retrospective;
- định kỳ tổng kết sau mỗi 10 bài để tránh tích lũy lý thuyết mà không chuyển
  thành thói quen làm việc.

## 4. Kết luận

Kinh nghiệm quan trọng nhất sau 31 bài là Agile không phải một bộ nghi thức riêng
lẻ. Nó là một hệ thống vòng lặp liên tục:

**Discovery -> Prioritization -> Planning -> Delivery -> Quality -> Release ->
Measurement -> Learning.**

69 bài còn lại cần biến hệ thống này từ kiến thức và playbook thành năng lực thực
hành có thể lặp lại trên công việc thật.
