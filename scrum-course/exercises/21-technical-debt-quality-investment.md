# Bài 21 - Technical Debt Mapping và Quality Investment

Trạng thái bài làm: đã hoàn thành playbook để team nhìn technical debt như
một rủi ro delivery có owner, impact và quyết định đầu tư chất lượng rõ ràng.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 20. Khi tri thức đã được chia sẻ tốt hơn, team có đủ
góc nhìn để nhận ra nợ kỹ thuật đang làm chậm flow, tăng defect, kéo dài review
hoặc khiến mỗi lần release đều căng thẳng.

Kết quả cuối cùng của bài là:

- Technical debt signals.
- Debt categories.
- Debt register.
- Impact scoring.
- Repayment decision rules.
- Quality investment plan.
- Sample debt board.

## 2. Bối cảnh

Technical debt thường bị né vì nó không luôn nhìn giống bug:

- build chậm nên feedback loop kéo dài;
- test flaky khiến team mất niềm tin vào CI;
- module cũ khó sửa nên estimate luôn phình;
- release cần nhiều thao tác tay và dễ quên bước;
- bug cùng loại quay lại qua nhiều sprint;
- mọi người biết vấn đề nhưng không ai đưa nó vào backlog rõ ràng.

Bài này giúp team biến debt từ cảm giác mơ hồ thành backlog item có impact,
trade-off và thời điểm xử lý hợp lý.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- nhận ra technical debt bằng signal delivery thật;
- phân loại debt theo risk và area;
- ghi debt register đủ ngắn để dùng trong planning;
- score impact bằng cost of delay, defect risk và flow cost;
- quyết định debt nào phải trả ngay, debt nào theo dõi;
- tạo quality investment plan nhỏ, testable và có owner.

## 4. Technical debt signals

| Signal | Evidence | Ý nghĩa |
| --- | --- | --- |
| Review lâu bất thường | PR cùng area luôn cần nhiều vòng. | Code/design khó hiểu. |
| Bug lặp lại | Defect cùng root cause qua nhiều sprint. | Quality guard thiếu. |
| Build/test chậm | Feedback loop vượt ngưỡng team chịu được. | Tooling debt. |
| Release hay lỗi thao tác | Checklist thủ công dài và dễ quên. | Automation/handoff debt. |

Rule:

- Debt signal phải gắn với evidence, không chỉ là cảm giác "code xấu".
- Nếu signal làm hỏng Sprint Goal, nó cần được xử lý như delivery risk.
- Debt không có impact rõ có thể theo dõi, chưa cần tranh slot ngay.

## 5. Debt categories

| Category | Ví dụ | Risk chính |
| --- | --- | --- |
| Code structure debt | Module lớn, coupling cao, naming khó hiểu. | Change cost tăng. |
| Test debt | Coverage thiếu, flaky test, thiếu test data. | Defect lọt hoặc CI mất tin cậy. |
| Tooling debt | Build chậm, setup khó, script mong manh. | Feedback loop chậm. |
| Release debt | Manual steps, rollback chưa rõ. | Release risk cao. |
| Knowledge debt | Decision cũ không có note hoặc owner. | Relearn liên tục. |

Category rule:

- Một debt item có thể chạm nhiều category, nhưng chọn primary category để xử
  lý trước.
- Category giúp chọn action đúng: refactor, test, automation, docs hoặc runbook.
- Debt lớn phải split theo risk area, không đưa vào sprint như một cục mơ hồ.

## 6. Debt register

| Debt item | Category | Evidence | Impact | Owner | Next decision |
| --- | --- | --- | --- | --- | --- |
| Invite tests flaky | Test debt | 4 failed reruns/week. | CI trust thấp. | QA + dev | Fix this sprint. |
| Payment module hard to review | Code structure | PR review 3 vòng. | Change cost cao. | Dev lead | Spike 1 day. |
| Release checklist manual | Release debt | 12 manual steps. | Release risk. | Support + PO | Automate top 2 steps. |
| Old pricing rule undocumented | Knowledge debt | PO hỏi lại 3 lần. | Relearn cost. | PO | Decision note. |

Debt register rule:

- Mỗi item cần evidence, impact và next decision.
- Owner không nhất thiết là người sửa hết; owner giữ item không bị trôi.
- Register phải được review trong refinement hoặc retro, không nằm riêng lẻ.

## 7. Impact scoring

| Score factor | 1 điểm | 3 điểm | 5 điểm |
| --- | --- | --- | --- |
| Flow cost | Gây phiền nhẹ. | Làm chậm nhiều card. | Chặn Sprint Goal hoặc release. |
| Defect risk | Ít khả năng gây bug. | Bug có thể lặp. | Defect nghiêm trọng hoặc customer-facing. |
| Learning cost | Dễ hiểu khi đọc lại. | Cần người giải thích. | Chỉ một người hiểu. |
| Fix size | Nhỏ, dưới 0.5 ngày. | 1-2 ngày. | Cần split hoặc spike. |

Scoring rule:

- Score cao không tự động làm ngay; team vẫn cần trade-off với product value.
- Debt có flow cost hoặc defect risk cao phải được nhìn trong sprint planning.
- Debt có fix size lớn nên có spike hoặc slice đầu tiên.

## 8. Repayment decision rules

| Decision | Khi chọn | Output |
| --- | --- | --- |
| Fix now | Debt đang đe dọa Sprint Goal hoặc release. | Debt task trong sprint. |
| Pair with feature | Feature chạm đúng area debt. | Refactor/test đi cùng card. |
| Spike first | Chưa rõ root cause hoặc fix size. | Spike note + next slice. |
| Track later | Impact thấp hoặc chưa đủ evidence. | Register item có review date. |

Decision rule:

- Trả nợ tốt nhất khi gắn với work thật hoặc risk thật.
- Không dùng "technical debt" để che item chưa có outcome.
- Nếu quyết định track later, phải có review date để debt không biến mất.

## 9. Quality investment plan

| Investment | Timebox | Success signal |
| --- | --- | --- |
| Stabilize flaky invite tests | 1 ngày | 0 rerun trong 1 tuần. |
| Split payment review checklist | 0.5 ngày | Reviewer thứ hai dùng được checklist. |
| Automate release version check | 1 ngày | Manual checklist giảm 2 bước. |
| Add pricing decision note | 0.5 ngày | PO/dev/support cùng hiểu rule. |

Plan format:

```text
Debt item:
Why now:
Investment slice:
Owner:
Timebox:
Success signal:
Rollback/stop rule:
```

Rule:

- Quality investment phải nhỏ và đo được.
- Nếu không có success signal, team sẽ không biết debt đã giảm hay chưa.
- Mỗi sprint chỉ chọn số debt item vừa đủ để không làm mờ Sprint Goal.

## 10. Sample debt board

| Debt | Signal | Decision | Owner | Success signal | Status |
| --- | --- | --- | --- | --- | --- |
| Invite flaky tests | CI rerun nhiều | Fix now | QA + dev | 0 rerun/1 tuần | In progress |
| Payment review pain | Review 3 vòng | Spike first | Dev lead | Split plan rõ | Ready |
| Release manual steps | 12 bước tay | Pair with feature | Support | Giảm 2 bước | In progress |
| Pricing rule missing note | Hỏi lại nhiều | Fix now | PO | Decision note approved | Done |

Sample output:

```text
Debt register update:
Top debt decision:
Quality investment slice:
Success signal:
Review date:
Follow-up backlog:
```

## 11. Sample output

Nếu technical debt mapping chạy đúng, team sẽ:

- bớt tranh luận cảm tính về "code xấu";
- thấy debt nào đang làm chậm delivery hoặc tăng defect;
- trả nợ bằng slice nhỏ có outcome;
- đưa debt vào planning/retro đúng lúc;
- bảo vệ flow dài hạn mà vẫn giữ Sprint Goal.

Kết quả xấu cần tránh:

- gom mọi refactor vào một epic quá lớn;
- fix debt không có success signal;
- bỏ qua debt đang gây defect thật;
- dùng debt làm lý do để không giao feature có value.

## 12. Checklist hoàn thành

- [x] Technical debt signals đã có.
- [x] Debt categories đã có.
- [x] Debt register đã có.
- [x] Impact scoring đã có.
- [x] Repayment decision rules đã có.
- [x] Quality investment plan đã có.
- [x] Sample debt board đã có.
- [x] Team biết quyết định debt bằng evidence và trade-off.

## 13. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `29 Exercise 21 - Technical Debt Mapping and Quality Investment`.

Technical debt được quản lý tốt giúp team giữ tốc độ thật, không chỉ chạy nhanh
trong một sprint rồi trả giá ở những sprint sau.
