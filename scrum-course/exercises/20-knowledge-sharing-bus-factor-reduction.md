# Bài 20 - Knowledge Sharing và Bus Factor Reduction

Trạng thái bài làm: đã hoàn thành playbook để team giảm bus factor, chia sẻ
tri thức vận hành và duy trì năng lực cross-functional sau khi swarm kết thúc.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 19. Sau khi team biết swarm để cứu flow, team cần
biến kiến thức vừa mở ra thành năng lực chung, để bottleneck không quay lại vì
một người duy nhất giữ domain, test path, release step hoặc support context.

Kết quả cuối cùng của bài là:

- Bus factor signals.
- Skill matrix.
- Knowledge map.
- Pairing and rotation plan.
- Documentation rules.
- Learning checkpoints.
- Sample knowledge-sharing board.

## 2. Bối cảnh

Team Scrum nhỏ thường bị chậm lại bởi những phụ thuộc ngầm:

- chỉ một developer hiểu module thanh toán;
- chỉ một QA biết test edge case quan trọng;
- chỉ một PO nắm rõ logic pricing hoặc customer segment;
- support handoff phụ thuộc vào một người nhớ release history;
- review bị dồn vì reviewer chuyên môn vắng mặt;
- swarm giải quyết được blocker nhưng tri thức không được lan ra.

Bài này giúp team nhìn rõ "single point of knowledge", chuyển tri thức thành
artifact có thể dùng lại, và tạo kế hoạch học đủ nhỏ để chạy trong sprint.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- nhận ra bus factor risk trước khi nó thành blocker;
- lập skill matrix đủ nhẹ để không biến thành thủ tục nặng;
- map kiến thức theo domain, workflow và artifact;
- tạo pairing/rotation plan trong sprint;
- viết documentation rule gắn với Definition of Done;
- đặt learning checkpoint để kiểm chứng kiến thức đã lan ra thật.

## 4. Bus factor signals

| Signal | Rủi ro | Hành động |
| --- | --- | --- |
| Một người approve mọi PR cùng domain | Review queue phụ thuộc cá nhân. | Chọn reviewer thứ hai để shadow. |
| QA chỉ có một người biết test path | Test bị kẹt khi người đó vắng. | Pair test case và viết checklist. |
| Support hỏi cùng một người | Handoff knowledge nằm trong đầu. | Tạo FAQ hoặc runbook ngắn. |
| Swarm lặp lại cùng bottleneck | Team cứu flow nhưng chưa học đủ. | Đưa vào knowledge-sharing plan. |

Rule:

- Bus factor không chỉ là code ownership; nó gồm product, QA, release và
  support knowledge.
- Signal phải được ghi bằng evidence: queue, blocker, review delay hoặc câu hỏi
  lặp lại.
- Nếu risk ảnh hưởng Sprint Goal, xử lý trong sprint hiện tại; nếu không, đưa
  vào improvement backlog.

## 5. Skill matrix

| Domain | Primary | Can pair | Needs learning | Evidence |
| --- | --- | --- | --- | --- |
| Payment flow | Linh | Minh | QA An | 2 PRs, 1 runbook |
| Invite email | Minh | Linh | Support Vy | Test checklist |
| Release note | PO Huy | Support Vy | Dev Minh | Last release handoff |
| Permission API | Backend Nam | Linh | QA An | Spike note |

Skill level rule:

- `Primary`: có thể lead work và review decision.
- `Can pair`: có thể làm cùng người khác và bắt lỗi phổ biến.
- `Needs learning`: cần shadow, checklist hoặc task nhỏ để học.
- Evidence phải cụ thể; đừng tự chấm skill chỉ bằng cảm giác.

## 6. Knowledge map

| Knowledge area | Artifact cần có | Owner cập nhật | Cadence |
| --- | --- | --- | --- |
| Critical user flow | Test checklist + acceptance examples. | QA + PO | Mỗi sprint. |
| Domain rule | Decision note trên card hoặc docs. | PO + dev | Khi rule đổi. |
| Release/support | Runbook + FAQ ngắn. | Support + PO | Trước release. |
| Technical hotspot | Architecture note hoặc spike summary. | Dev lead | Khi chạm hotspot. |

Knowledge map rule:

- Artifact phải nằm nơi team dùng trong lúc làm việc, không nằm ở file bị quên.
- Mỗi artifact có owner cập nhật, nhưng không có "owner độc quyền tri thức".
- Nếu artifact không giúp người thứ hai làm được việc, nó chưa đủ tốt.

## 7. Pairing and rotation plan

| Pattern | Khi dùng | Output |
| --- | --- | --- |
| Shadow pairing | Người học cần quan sát một lần end-to-end. | Notes + câu hỏi mở. |
| Driver rotation | Người học đã hiểu đủ để thao tác có mentor. | Commit/test evidence. |
| Reviewer rotation | Review bottleneck phụ thuộc một người. | Reviewer thứ hai approve được. |
| Support rotation | Handoff/customer context tập trung. | FAQ hoặc reply template. |

Plan format:

```text
Knowledge risk:
Primary owner:
Second person:
Pairing pattern:
Task/card to learn on:
Evidence needed:
Checkpoint date:
```

Rule:

- Pairing phải gắn với work thật, không chỉ là buổi nói chuyện chung.
- Rotation nhỏ hơn tốt hơn: một card, một test path, một release note.
- Người học cần tạo artifact, vì viết lại là cách kiểm tra hiểu biết.

## 8. Documentation rules

| Situation | Documentation rule |
| --- | --- |
| Domain rule mới | Card phải có decision note và example. |
| Test path khó | Checklist hoặc test data phải được attach/link. |
| Release step lặp lại | Runbook có owner và last verified date. |
| Incident hoặc blocker lớn | Post-note ghi cause, fix và prevention. |

Documentation DoD:

- Tài liệu ngắn, dùng được trong sprint sau.
- Có owner cập nhật và ngày verify gần nhất.
- Có example hoặc checklist, không chỉ mô tả chung chung.
- Người thứ hai đọc và xác nhận làm theo được.

## 9. Learning checkpoints

| Checkpoint | Câu hỏi kiểm tra |
| --- | --- |
| After pair | Người học có giải thích được rule/test path không? |
| Before Done | Artifact đã giúp reviewer hoặc QA thứ hai chưa? |
| Sprint Review | Stakeholder/support có hiểu thay đổi chính không? |
| Retrospective | Bus factor risk đã giảm bằng evidence nào? |

Checkpoint rule:

- Không đánh dấu "đã chia sẻ" nếu chưa có người thứ hai dùng được kiến thức.
- Nếu checkpoint fail, tạo follow-up learning item nhỏ.
- Track learning bằng board evidence, không bằng cảm giác team đã nghe qua.

## 10. Sample knowledge-sharing board

| Risk | Primary | Second person | Learning action | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Payment refund rule | Linh | Minh | Driver rotation on bug fix. | PR + decision note. | In progress |
| Invite email test path | QA An | Dev Minh | Dev-QA pair on regression. | Test checklist. | Ready |
| Release FAQ | PO Huy | Support Vy | Support drafts FAQ. | Approved FAQ. | Done |
| Permission API review | Nam | Linh | Shadow review + notes. | Review checklist. | In progress |

Sample output:

```text
Knowledge risk:
Skill matrix update:
Pairing/rotation:
Artifact created:
Second-person evidence:
Follow-up:
```

## 11. Sample output

Nếu knowledge sharing chạy đúng, team sẽ:

- giảm queue phụ thuộc vào một specialist;
- có người thứ hai hiểu domain hoặc workflow quan trọng;
- biến swarm lesson thành checklist, runbook hoặc decision note;
- review, QA và support ít bị đứng hình khi một người vắng;
- có evidence rõ bus factor đã giảm qua sprint.

Kết quả xấu cần tránh:

- tạo skill matrix nhưng không gắn với work thật;
- tài liệu dài nhưng không ai dùng được;
- pairing chỉ là xem màn hình mà không có artifact;
- primary owner vẫn là người duy nhất quyết định mọi thứ.

## 12. Checklist hoàn thành

- [x] Bus factor signals đã có.
- [x] Skill matrix đã có.
- [x] Knowledge map đã có.
- [x] Pairing and rotation plan đã có.
- [x] Documentation rules đã có.
- [x] Learning checkpoints đã có.
- [x] Sample knowledge-sharing board đã có.
- [x] Team biết tạo evidence rằng người thứ hai dùng được kiến thức.

## 13. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `28 Exercise 20 - Knowledge Sharing and Bus Factor Reduction`.

Knowledge sharing tốt giúp swarm không chỉ cứu một card, mà còn làm team mạnh
hơn cho sprint tiếp theo.
