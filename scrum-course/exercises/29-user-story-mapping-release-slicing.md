# Bài 29 - User Story Mapping và Release Slicing

Trạng thái bài làm: đã hoàn thành playbook để team biến opportunity map thành
user story map, walking skeleton, MVP slice, release slices và refinement
handoff có evidence.

## 1. Bài này nói về gì?

Bài tập này nối tiếp Bài 28. Opportunity mapping giúp team chọn problem,
segment, solution candidates và assumption cần kiểm chứng. Nhưng sau khi đã
chọn một opportunity đủ mạnh, team vẫn cần chuyển nó thành cấu trúc delivery:
user đi qua journey nào, hoạt động nào là backbone, story nào nằm ở từng bước,
slice nào đủ nhỏ để học, và release nào tạo value sớm nhất mà vẫn an toàn.

Kết quả cuối cùng của bài là:

- Story map inputs.
- User journey backbone.
- Activities and tasks.
- Story cards.
- Walking skeleton and MVP slice.
- Release slicing rules.
- Prioritization within the map.
- Refinement handoff.
- Sample story map board.

## 2. Bối cảnh

Team Scrum nhỏ thường gặp khoảng trống giữa discovery và delivery:

- opportunity đã rõ nhưng backlog lại trở thành danh sách story rời rạc;
- team split theo component kỹ thuật thay vì theo user journey;
- MVP bị hiểu thành "ít scope nhất" chứ không phải "slice học được sớm nhất";
- release đầu tiên thiếu bước end-to-end nên không chứng minh được value;
- stakeholder tranh luận feature trong khi user flow chưa được nhìn chung;
- refinement nhận story nhưng thiếu outcome, evidence và success signal.

Bài này giúp team giữ mạch từ opportunity tới story map rồi sang delivery
increment.

## 3. Mục tiêu bài tập

Sau bài này, team phải có thể:

- chọn input đủ mạnh từ opportunity map để bắt đầu story mapping;
- viết journey backbone theo hoạt động của user, không theo component;
- tách activities thành tasks và story cards có outcome;
- chọn walking skeleton để chứng minh flow end-to-end;
- slice MVP và release theo value, learning và risk;
- ưu tiên story trong map mà không mất context;
- handoff story sang backlog refinement kèm evidence và success signal.

## 4. Story map inputs

| Input | Cần lấy từ đâu | Dùng để làm gì |
| --- | --- | --- |
| Opportunity | Bài 28 opportunity map. | Giữ problem và desired outcome. |
| Segment | Customer segment rules. | Biết user nào đang đi qua journey. |
| Evidence | Metrics, feedback, experiment results. | Chọn scope theo confidence. |
| Solution candidate | Opportunity solution tree. | Tạo story map quanh solution đáng thử. |
| Assumption | Assumption map. | Biết slice nào cần học trước. |

Input rule:

- Không story map một idea nếu opportunity/problem chưa rõ.
- Mỗi map nên ghi segment chính và outcome chính ở đầu.
- Evidence yếu không cấm mapping, nhưng phải làm slice nhỏ để học.

## 5. User journey backbone

| Backbone step | Câu hỏi | Ví dụ |
| --- | --- | --- |
| Discover | User biết có option ở đâu? | Admin thấy template entry point. |
| Choose | User quyết định chọn gì? | Admin chọn template phù hợp. |
| Configure | User cần chỉnh gì trước khi dùng? | Đổi tên board, member, list. |
| Complete | User đạt outcome đầu tiên chưa? | Board đầu tiên sẵn sàng dùng. |
| Return | User quay lại dùng tiếp không? | Team thêm card/checklist thật. |

Backbone rule:

- Backbone là hoạt động của user, không phải layer kỹ thuật.
- Mỗi step phải có thể đọc như một phần của journey.
- Nếu backbone quá dài, chọn một scenario chính trước.

## 6. Activities and tasks

| Activity | Task nhỏ hơn | Story candidate |
| --- | --- | --- |
| Discover template | Mở empty state, đọc CTA, xem examples. | Show template CTA in empty board state. |
| Choose template | Filter by use case, preview columns. | Preview template before creating board. |
| Configure board | Rename, invite member, remove sample cards. | Let admin customize template before save. |
| Complete first board | Create board, confirm next action. | Show first success checklist after create. |
| Return to workflow | Add real card, assign owner. | Suggest first team action after setup. |

Task rule:

- Task mô tả điều user làm, story mô tả capability team sẽ build.
- Một task có thể sinh nhiều story theo mức độ polish.
- Nếu task không phục vụ outcome, đặt nó dưới Later hoặc bỏ.

## 7. Story cards

| Field | Câu hỏi | Ví dụ |
| --- | --- | --- |
| User | Ai cần capability này? | New workspace admin. |
| Need | Họ muốn làm gì? | Chọn template phù hợp nhanh. |
| Value | Vì sao quan trọng? | Tạo board hữu ích trong 5 phút. |
| Evidence | Team biết từ đâu? | Activation thấp + support comments. |
| Acceptance | Điều gì chứng minh story xong? | Admin preview và tạo board từ template. |

Story template:

```text
As a [segment/persona],
I want to [task/capability],
so that [user outcome].

Evidence:
Acceptance:
Success signal:
```

Story rule:

- Story trong map cần đủ nhỏ để refine, nhưng không mất outcome.
- Acceptance criteria phải kiểm được bằng behavior hoặc artifact.
- Success signal nên nối với opportunity metric.

## 8. Walking skeleton and MVP slice

| Slice type | Mục đích | Ví dụ |
| --- | --- | --- |
| Walking skeleton | Chứng minh flow end-to-end mỏng nhất. | Entry point -> choose one template -> create board. |
| MVP slice | Tạo value đủ dùng cho segment đầu tiên. | 3 templates, preview, create, first action hint. |
| Learning slice | Test assumption rủi ro nhất. | Does template CTA increase activation? |
| Risk slice | Giảm technical/support/reliability risk. | Template create works under real permissions. |
| Delight slice | Polish sau khi core value đúng. | Better illustrations, saved favorites. |

MVP rule:

- MVP không phải tập story rẻ nhất; nó là slice nhỏ nhất còn tạo learning/value.
- Walking skeleton nên đi qua nhiều backbone step với depth tối thiểu.
- Không đưa delight vào MVP nếu core flow chưa chứng minh được.

## 9. Release slicing rules

| Release slice | Khi dùng | Output |
| --- | --- | --- |
| Release 0 | Technical enablement cần trước. | Flag, data model, migration, monitoring. |
| Release 1 | First usable path cho segment chính. | Walking skeleton + key acceptance. |
| Release 2 | Expand depth trong journey. | More templates, customization, admin polish. |
| Release 3 | Expand segment hoặc scale. | Mobile, paid team needs, localization. |
| Later | Value chưa đủ hoặc evidence yếu. | Parked stories with revisit signal. |

Release rule:

- Mỗi release slice phải có user-visible hoặc risk-reducing outcome.
- Slice theo journey/value, không gom toàn backend rồi toàn frontend.
- Release nhỏ vẫn cần rollback/monitoring nếu chạy trong production.

## 10. Prioritization within the map

| Priority signal | Cách đọc | Quyết định |
| --- | --- | --- |
| Outcome impact | Story có giúp metric/opportunity chính không? | Đẩy lên release sớm. |
| Evidence strength | Strong/medium/weak từ Bài 28. | Strong vào build, weak vào discovery. |
| Dependency | Story nào mở khóa story khác? | Đặt trước nhưng giữ mỏng. |
| Risk | Assumption nào có thể làm solution fail? | Test bằng learning slice. |
| Effort | Story quá lớn hoặc mơ hồ. | Split hoặc đưa về discovery. |

Prioritization rule:

- Story map giữ context, nhưng priority vẫn cần trade-off rõ.
- Không để dependency kỹ thuật nuốt hết value slice đầu tiên.
- Story thấp priority cần lý do: Later, watch, split hoặc discovery.

## 11. Refinement handoff

| Handoff item | Cần kèm theo |
| --- | --- |
| Selected story | User, need, value, acceptance criteria. |
| Evidence source | Opportunity, metric, quote, experiment result. |
| Slice placement | Walking skeleton, MVP, Release 1/2/Later. |
| Assumption left | Điều gì vẫn chưa chắc. |
| Success signal | Metric hoặc observable behavior sau khi ship. |
| Out of scope | Story nào bị hoãn và vì sao. |

Handoff rule:

- Refinement không chỉ nhận story; nó nhận context ra quyết định.
- Nếu story vào Sprint Planning, DoR phải có evidence và acceptance rõ.
- Nếu assumption còn quá rủi ro, handoff sang discovery/experiment thay vì build.

## 12. Sample story map board

| Backbone | Walking skeleton | MVP | Release 2 | Later |
| --- | --- | --- | --- | --- |
| Discover | Show template CTA | Add empty-state explanation | Add use-case landing cards | Personalized recommendations |
| Choose | Choose one template | Preview 3 templates | Search/filter templates | Saved favorites |
| Configure | Use default settings | Rename board before create | Invite members before create | Advanced permissions |
| Complete | Create board | Show first action checklist | Suggest sample cards | Guided onboarding tour |
| Return | Open created board | Add first real card | Team activity prompt | Habit reminders |

Sample output:

```text
Opportunity:
Segment:
Outcome:
Backbone:
Walking skeleton:
MVP slice:
Release 1:
Release 2:
Later:
Refinement-ready stories:
Assumptions left:
Success signal:
Owner:
```

## 13. Sample output

Nếu user story mapping và release slicing chạy đúng, team sẽ:

- thấy journey chung trước khi split story;
- chọn MVP theo value và learning, không theo ý thích feature;
- có walking skeleton để chứng minh flow end-to-end;
- biết story nào vào release đầu, story nào để later;
- handoff sang refinement với evidence, acceptance và success signal.

Kết quả xấu cần tránh:

- backlog rời rạc không nối với opportunity;
- split theo component nên release đầu không dùng được;
- MVP phình thành full product nhỏ;
- release slice không có decision hoặc metric;
- refinement nhận story nhưng không biết evidence từ đâu.

## 14. Checklist hoàn thành

- [x] Story map inputs đã có.
- [x] User journey backbone đã có.
- [x] Activities and tasks đã có.
- [x] Story cards đã có.
- [x] Walking skeleton and MVP slice đã có.
- [x] Release slicing rules đã có.
- [x] Prioritization within the map đã có.
- [x] Refinement handoff đã có.
- [x] Sample story map board đã có.
- [x] Team biết biến opportunity thành release slices và refinement-ready stories.

## 15. File liên quan trong WeKan

Nếu triển khai trong WeKan, bài này nên có một khu vực riêng:

- `37 Exercise 29 - User Story Mapping and Release Slicing`.

Story map tốt giúp team giữ user journey trong đầu khi biến discovery thành
delivery scope.
