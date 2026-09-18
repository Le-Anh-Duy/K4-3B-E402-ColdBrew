# AI SPEC — Chẩn đoán lỗ hổng prerequisite từ quiz ngắn — Nhóm ColdBrew — Phòng E402
Hướng: [ ] A — VLearn  [ ] B — Trợ lý Học viên  [x] C — Làn mở (đề **C1 Knowledge-to-Lesson**, triển khai theo hướng adaptive-first)
Loại: [ ] Tối ưu tính năng có sẵn  [x] Tính năng mới

> Trạng thái CP4: §1–§7 đã chốt, §8 đang điền. Bằng chứng chi tiết trong `eval/evidence/mining.md` và `validation/survey.md`; kết quả đo trong `eval/`.

## §1. User & Job

- **Job executor + workflow:** học viên AI20k đang học một chương, làm quiz ôn tập rồi tự hỏi "sai chỗ này thì phải học lại cái gì".
- **Core JTBD:** *Khi tôi làm sai vài câu trong bài ôn, tôi muốn biết chính xác mình hổng khái niệm nền nào và học lại đúng phần đó, để không phải đọc lại cả chương.*
- **Problem statement (KHÔNG chữ AI):** Học viên làm quiz xong chỉ biết "đúng 3/5". Sai một câu thì chưa biết chỗ hổng nằm ở chính ý đó hay ở một khái niệm nền phía dưới, và không có cách nào xác định ngoài tự đoán. Hậu quả: đọc lại cả chương cho chắc, hoặc bỏ qua.

### Evidence chuẩn B — mining chatlog VLearn

`scripts/mining.py` (có `--selftest`) sinh ra `eval/evidence/mining.md`, nơi khai đủ luật đếm. Data pack không nằm trong repo (`DATA_NOTICE.md`); tải `tutor_turns.csv` rồi chạy lại sẽ ra đúng các số dưới đây. Quần thể sau lọc: **2.555 lượt, 384 học viên** (khoá K4, đã loại câu mẫu bấm sẵn của giao diện).

| Chỉ số | Kết quả |
|---|---|
| Tutor hỏi ngược để chẩn đoán (`ask_probing_question`) | **6/2.555 = 0,2%** |
| Tutor giảng lại khái niệm (`review_concept`) | **2.226/2.555 = 87%** |
| Học viên quay lại hỏi thêm về cùng một mục ở một dịp khác | **106/369 = 29%** |
| Học viên bấm đánh giá, và tutor chấm mức hiểu | **0,3%** và **0,2%** |

Đơn vị là **dịp hỏi**: hai câu cách nhau quá 30 phút tính là hai dịp, không đếm theo tin nhắn. *Mục bài học* là nhãn do giao diện VLearn tự gắn. Chỉ số 29% nhạy với cỡ mục, còn **17,6% nếu loại 5 mục lớn nhất**; đây là mức thận trọng nên dùng.

### Evidence chuẩn A — khảo sát

Form *"Làm sai rồi học gì tiếp?"*, **n = 31**, học viên trong khoá. Đủ 7 câu và phần hạn chế trong [`validation/survey.md`](validation/survey.md).

| Câu | Kết quả |
|---|---|
| **Q4** — điều cản trở nhất | *"Không biết mình thiếu kiến thức nào"*, **54,8%**, cao nhất |
| **Q5** — sau khi tự tìm hiểu | **54,8%** *"biết mình yếu phần nào nhưng vẫn chưa hiểu"*; chỉ 38,7% hiểu lại được |
| **Q6** — lần gần nhất tốn bao lâu | **42% mất hơn 15 phút**, 19,4% hơn 30 phút |

**Quote nguyên văn** (mã lượt, cắt ngắn theo luật data pack):
- **[T10291]** *"Dựa trên tiến độ của mình, mình nên ôn phần nào trước?"* — đúng câu sản phẩm này sinh ra để trả lời
- **[T10326]** *"Giải thích lại giúp mình phần mà mình hay thấy khó."*
- **[T10317]** *"giải thích lại dc không hơi khó hiểu"*
- **[T10883]** *"em vẫn chưa hiểu rõ sự khác biệt của agent và llm"*
- **[T10728]** *"bước 2 là gì tôi đang chưa hiểu, tại sao lại cộng trọng số và cộng vào đâu"*

### Hạn chế của bằng chứng

- **"Quay lại cùng một mục" là hành vi, không phải nguyên nhân.** Nó không chứng minh học viên chưa hiểu, càng không chứng minh hổng prerequisite; data không có nhãn nào để đối chiếu. Mining đủ để kết luận **bài toán tồn tại**, không đủ để nói **chỗ hổng nằm ở đâu**, và sản phẩm cũng không dựa vào nó cho việc đó (§4).
- **`move_used` do chính tutor tự gán**, nên 0,2% phản ánh thiết kế của tutor hơn là nhu cầu học viên. Khảo sát thì người trả lời là học viên cùng khoá, không độc lập với nhóm, và mới có bản tổng hợp chứ chưa có log nguyên văn như guide §1.3 yêu cầu.

## §2. Impact & quyết định chọn

Ba ứng viên cân nhắc trên cùng một bộ data (K4, đã lọc như §1):

| Ứng viên | Bao nhiêu người | Tần suất | Mỗi lần tốn gì | Khả thi | Chọn |
|---|---|---|---|---|---|
| **A.** Sinh quiz có dẫn nguồn cho giảng viên | **không đếm được**, pack không có lượt nào của giảng viên | không đo được | không đo được | được | ✗ |
| **B.** Bắt tutor trả lời có trích nguồn | 33% câu trả lời không trích nguồn (838/2.555) | mỗi lượt hỏi | nội dung không truy ngược được | được | ✗ |
| **C.** Chẩn đoán prerequisite từ quiz sai, trả về nội dung cần ôn kèm giải thích | 29% quay lại cùng một mục (106/369); khảo sát 77,4% có làm sai trong 7 ngày | mỗi lần làm sai | **42% mất hơn 15 phút** tìm nguyên nhân (Q6), và 54,8% vẫn chưa hiểu sau chừng đó thời gian (Q5) | được | **✓** |

- **Loại A, vì thiếu bằng chứng chứ không phải thiếu giá trị.** Cả 13.494 lượt trong pack đều là học viên hỏi tutor, không có dữ liệu nào về giảng viên soạn quiz, nên không định lượng được cả ba cột đầu. Nhóm cũng không phải người dùng thật của nó.
- **Loại B, vì số mạnh nhưng lệch job.** 33% lớn hơn 29%, nhưng B chỉ sửa cách trình bày câu trả lời, không trả lời được câu [T10291] *"mình nên ôn phần nào trước?"*. Thêm nữa chỉ 0,3% lượt có rating, nên **không có cách đo B có hiệu quả hay không**.
- **Chọn C, vì mining và khảo sát chỉ vào cùng một chỗ.** Tutor hiện tại chỉ có một nước đi là giảng lại và gần như không hỏi ngược (§1), nên C chèn vào đúng chỗ trống: đo trước, giảng sau. Khảo sát xác nhận từ phía học viên, thứ họ muốn nhất là *"mình đang yếu kiến thức nào"* (Q2, 77,4%) và thứ cản họ nhiều nhất chính là Q4. Khác B, C có tiêu chí thành công đo được ngay trong sản phẩm (§7).
  - **Phải đo chứ không hỏi được.** Hai ô ghi nhận "có hiểu không" trong hệ thống hiện tại đều gần như rỗng, trong khi hơn một nửa số người khảo sát tự nhận vẫn chưa hiểu (Q5). Học viên không tự khai, nên cách duy nhất còn lại là đo bằng quiz.
  - **C có hai nửa, và chúng không mạnh ngang nhau.** Nhu cầu *định vị* được 77,4% chọn, còn nhu cầu *thứ tự ôn* chỉ 38,7% (Q2). Đề C1 yêu cầu cả hai nên giữ cả hai, nhưng demo và slide nên mở bằng phần định vị kèm căn cứ.

## §3. Giải pháp tương tự đã nghiên cứu

| Sản phẩm | Flow của họ | Đáng học | Đáng né | Mình khác gì |
|---|---|---|---|---|
| **Eedi** (Diagnostic Questions) | Một câu trắc nghiệm, **mỗi phương án sai gán sẵn một misconception**; chọn sai là biết ngay sai vì nghĩ thế nào | Chẩn đoán nằm ở **distractor**, lấy được tín hiệu chỉ từ một lần bấm | Sau chẩn đoán chỉ trỏ về thư viện tài liệu của chủ đề, dừng ở tầng chủ đề | Leo ngược lên node cha hoặc tiền đề để tìm chỗ nền vỡ, thay vì trả về chính chủ đề vừa sai |
| **ALEKS** (Knowledge Space Theory) | Môn học là đồ thị có hướng các kỹ năng với quan hệ tiền đề; assessment thích ứng dò ra "knowledge state", chia thành biết, chưa biết, và **sẵn sàng học (outer fringe)** | "Outer fringe" tương ứng khái niệm **trần** (`ceiling`): node đã đạt là mép để học tiếp, không phải chỗ hổng | Cần **20–30 câu** mới định vị được | Chỉ có 5 câu và tối đa 9 câu nền. Đây là lý do tồn tại của luật "chưa đủ căn cứ" |
| **Khan Academy** (Course Mastery) | Mỗi kỹ năng có mức Proficient hoặc Mastered; unit test cho lên hoặc **xuống** mức; gợi ý bài học theo kết quả | Trạng thái **đi lùi được**, không chỉ "chưa đạt" | Gợi ý theo từng kỹ năng độc lập, không nói "sai cái này vì hổng cái kia" | Output là một **chuỗi phụ thuộc kèm lý do**, không phải danh sách kỹ năng cần cày lại |
| **Khanmigo** (AI tutor) | LLM dạy kiểu Socratic, đọc được learning record của học viên | — | Dạy nhưng **không đo**, không có bước test để biết hổng ở đâu; và **không nhớ hôm trước học viên vướng gì**, trong khi chất lượng câu hỏi Socratic phụ thuộc vào điều đó | Luật định vị, LLM chỉ diễn giải, tức ngược lại |

Ba trong bốn phát hiện xác nhận thiết kế đang có: **trần** và **luật từ chối chẩn đoán** (ALEKS), **rule quyết định còn LLM diễn giải** (Khanmigo). Hai điểm cần ghi nhận:

- **Lỗi của Khanmigo cũng là lỗi nhóm đang mắc.** "Các vòng không nối với nhau" chính là thứ `scripts/multiround.py` đo, và điểm 4/5 người chấm ở M03 thuộc loại đó. Đây là vấn đề cố hữu chứ không phải lỗi nhỏ.
- **Eedi chỉ ra một lỗ hổng chưa xử lý.** Distractor trong quiz hiện không mang thông tin nào, chỉ map câu sang node, vì vậy phải hỏi thêm 3 câu nền mới suy ra được thứ Eedi lấy từ một lần bấm. Đây là nguồn tín hiệu rẻ nhất chưa khai thác, đưa vào backlog §8.

*Nguồn:* [Eedi research](https://help.eedi.co.uk/en/articles/7234087-the-research-behind-eedi), [Eedi misconception mapping](https://eedi.com/us/blog/from-wrong-answers-to-real-insights-how-we-used-a-kaggle-challenge-to-map-student-misconceptions), [ALEKS Knowledge Space Theory](https://www.aleks.com/about_aleks/knowledge_space_theory), [Research behind ALEKS](https://www.aleks.com/about_aleks/research_behind), [Khan Academy Mastery Challenges](https://support.khanacademy.org/hc/en-us/articles/360037127892-What-are-Mastery-Challenges-in-course-mastery), [Khan Academy — building a better AI tutor](https://blog.khanacademy.org/how-khan-academy-is-building-a-better-ai-tutor-our-most-recent-learnings/), [Khanmigo memory limitation](https://memu.pro/blog/khanmigo-ai-tutoring-memory)

## §4. Thiết kế

- **Lát cắt MỘT CÂU:** *Một học viên làm quiz ngắn 5 câu, hệ thống chấm và phân tích các câu sai để xác định concept còn yếu và prerequisite bị hổng, rồi trả về đúng phần nội dung cần ôn kèm lời giải thích vì sao học viên nhận lộ trình đó.*
  - 1 user: học viên. 1 việc: ôn sau khi làm sai. 1 quyết định AI: chọn concept hoặc prerequisite để remediate. 1 kết quả: 1–3 mục ôn kèm giải thích và trích nguồn.

- **Hệ thống kiểm giả thuyết, không khẳng định nó.** "Chỗ hổng nằm ở phần nền" là câu hỏi đặt ra cho *từng học viên*, không phải mệnh đề về học viên nói chung. Có ba kết luận phủ định, cả ba đều hợp lệ:

  | Kết luận | Nghĩa là | Case kiểm |
  |---|---|---|
  | `y_le`, nền ổn | đúng hết vòng nền, tức **không** hổng prerequisite; chỗ cần ôn là chính ý trong quiz, node vừa đạt trở thành **trần** | C13, C19 |
  | `muc_nong`, hổng nông tại mục | sai 1/3 câu nền, tức không vỡ nền, chỉ mỏng tại chỗ | C21, C22 |
  | từ chối chẩn đoán | tín hiệu không đủ (toàn `rush`, hoặc `slow` tản mát) nên trả lời "chưa đủ căn cứ" | C09, C10, C12 |

- **Non-goals (KHÔNG build):**
  1. Pipeline extraction tự động. Cây dựng một lần rồi chốt.
  2. Tài khoản, đăng nhập, lớp học, dashboard giảng viên.
  3. Sinh nội dung bài học mới. Chỉ trỏ về đoạn transcript đã có.
  4. Ngân hàng câu hỏi lớn. Quiz cố định 5 câu map sẵn vào 5 node lá.
  5. Bayesian knowledge tracing. Dùng mastery theo rule, nêu rõ ngưỡng.

- **Stack và dữ liệu:**

  | Lớp | Chọn | Ghi chú |
  |---|---|---|
  | Frontend | React + Vite | `codebase/frontend` |
  | Backend | Python FastAPI | `codebase/backend` |
  | AI provider | Gemini qua endpoint tương thích OpenAI | SDK `openai`, model `gemini-3.5-flash-lite`. Free tier 15 req/phút nên mọi script gọi AI đều tiết lưu. Đổi provider chỉ sửa `base_url` và `MODEL` |
  | Lưu trữ graph và learner state | JSON file | đủ cho vài chục concept, không dựng graph DB |

  **Cây tri thức** (nhóm tự dựng, đề không cấp graph mẫu): **38 node** sinh bằng mô hình mạnh đọc `transcript-01-clean.md` (*Day 2 sáng, Xác định bài toán kinh doanh cho AI*, 89 đoạn `[T01-001…089]`), nhóm rà lại và chốt, **chưa có người thứ hai đối chiếu độc lập**. Mỗi node mang `file`, `span` (mã đoạn) và `conf` (0,9 nếu nói thẳng trong đoạn, 0,7 nếu gom từ nhiều đoạn), cùng cạnh `prereq` tách riêng khỏi quan hệ mục lục. Slide chưa đối chiếu nên **không ghi số trang**, và ràng buộc này đã đưa vào cả 5 file prompt của backend. Repo không chứa data pack, chỉ trích mã đoạn. Mô hình dữ liệu đầy đủ: `docs/data-model.md`; luồng và quy tắc chẩn đoán: `mockup/flow.md`.

- **Hai tính năng AI, tách rời nhau:**

  | | Trả lời câu hỏi gì | Đầu vào | Đầu ra | Nguồn |
  |---|---|---|---|---|
  | **AI 1, giải thích đáp án** | "Mình sai **cái gì**?" | một câu và phương án học viên chọn | vì sao đáp án đúng, bẫy của phương án đã chọn, cờ theo thời gian trả lời | node lá của câu đó |
  | **AI 2, chẩn đoán nền** | "**Vì sao** mình sai?" | toàn bộ tín hiệu yếu của bài quiz | các vòng câu hỏi leo cây, chỗ hổng, nội dung ôn, giải thích | node cha trên cây |

  AI 1 gọi được ở từng câu, theo cả vòng, hoặc cả bài. Học viên chủ động bấm, hệ thống không tự sinh.

- **Mức prototype nhắm tới:** [ ] Sketch [x] Mock → [ ] Working
  - **Phần thật:** chấm quiz, tín hiệu theo thời gian trả lời, suy luận prerequisite trên graph (rule, 3 bản đồng bộ), provenance bằng mã đoạn, resume phiên, và **một lời gọi AI thật vào quyết định trung tâm** (`/ai/plan/generate`).
  - **Phần mock:** nội dung của AI 1 trên trang dùng text soạn sẵn trong `mockup/data.js`; learner state lưu file JSON.
  - **Trạng thái CP4:** backend có 11 endpoint và 4 route AI, trang mock mới nối 1 trong 4, đúng mức **Mock** theo guide §3.2. Ba route còn lại là việc đấu dây, không phải feature mới.

- **Automation:** [x] augment  [ ] conditional  [ ] automate
  - Cost-of-error: chỉ dẫn sai khiến học viên ôn nhầm phần, mất thời gian và mất niềm tin. Vì vậy hệ thống **đề xuất kèm giải thích**, học viên và giảng viên thấy được căn cứ và bỏ qua được. Quyết định chọn nhánh do rule trên graph, LLM chỉ diễn giải và không tự suy ra prerequisite.

- **§4b. Nguyên tắc đã áp dụng (≥4):**

  | Nguyên tắc | Áp cụ thể vào đâu trong prototype |
  |---|---|
  | HAX G1, *Make clear what the system can do* | Màn đầu nêu phạm vi: một bài giảng và cây concept của bài đó. Badge đầu trang tự dò backend, hiện "AI THẬT, &lt;model&gt;" hoặc "MOCK DATA, backend chưa chạy" |
  | HAX G2, *Make clear how well the system can do it* | Ô "Hệ thống đọc được gì" cuối mỗi vòng nêu rõ suy ra được gì và **chưa** khoanh được gì; nhánh học viên tự ôn có cảnh báo "chỗ hổng có thể còn sâu hơn một tầng" |
  | HAX G11, *Make clear why the system did what it did* | Panel "Vì sao bạn nhận lộ trình này" và cột "Dấu vết quyết định" ghi từng bước: câu sai nào, gom về node nào, mỗi vòng sai bao nhiêu, leo lên đâu |
  | HAX G17, *Provide global controls* | Hệ thống không tự leo tầng. Hết mỗi vòng dừng lại cho học viên chọn đi tiếp, làm lại vòng này, hoặc tự ôn. Giải thích chỉ sinh khi bấm |
  | PAIR, *Explainability + Trust* | Mọi câu hỏi và mục ôn đều gắn một node có `page` là mã đoạn transcript `[T01-NNN]`, không có nội dung nào không trỏ về được nguồn |

- **Skill AI còn thiếu, sinh câu hỏi nền có điều kiện.** `PROBES` hiện là bộ câu **tĩnh, chung cho cả node cha**. Học viên sai ý *A* nhưng 3 câu nền lại hỏi khía cạnh *B, C, D* của cùng mục đó, nên trả lời đúng hết **không** chứng minh nền của *A* vững. Cần sinh 3 câu ở tầng cha nằm trên đường phụ thuộc dẫn tới lá bị sai, chỉ dùng nội dung trong `span` của node đó, mỗi câu kèm mã đoạn; rule vẫn giữ quyền leo tầng, AI chỉ soạn đề, và phải có bộ tĩnh dự phòng. Đây là giới hạn của **phép đo** chứ không phải của giao diện: chừng nào câu nền chưa bám đúng lá bị sai thì kết luận `y_le` vẫn còn dấu hỏi, kể cả khi ngưỡng 2 đạt 100%.

## §5. Kiểu lỗi — 4 lớp chỗ khó và 12 kịch bản

Bốn lớp theo guide §2.5: **lớp 1** nguồn sự thật, **lớp 2** mơ hồ hoặc thiếu thông tin, **lớp 3** ngoài phạm vi hoặc thẩm quyền, **lớp 4** đặc thù domain. Cột cuối trỏ về case đang phủ kịch bản đó.

| # | Tình huống | Lớp | Hành vi mong muốn | Nguyên tắc | Case phủ |
|---|---|---|---|---|---|
| 1 | AI trích một mã đoạn **không tồn tại** trong cây | 1 | Không được phép xảy ra. `validate.py` tách trích dẫn thành hợp lệ, bịa, lạc; lượt có mã bịa bị đánh trượt | G2, PAIR | `grounding.py`, **0/20 bịa** |
| 2 | AI trích mã đoạn **có thật nhưng ngoài phần tư liệu đã cấp** | 1 | Trượt như lỗi bịa. Service tự khai `allowed_spans` trong response để bộ đo không phải suy đoán prompt đã cấp gì | G2 | `grounding.py`, **3/20 trượt**, đều ở kịch bản `nen_bai` |
| 3 | AI viết *"tư liệu không đề cập…"* thay cho lời giải thích | 1 | Prompt cấm dùng câu đó thay nội dung. Đây là lỗi quá thận trọng, vẫn tính là trượt chiều hữu ích | PAIR Errors | Chấm hữu ích, 4/20 |
| 4 | Học viên đúng hết nhưng vài câu mất hơn 25s | 2 | Nêu rõ "không có câu sai, lấy câu trả lời chậm làm tín hiệu" rồi mới hỏi thêm, không kết luận ngay | **G10**, G2 | C08, C19 |
| 5 | Tín hiệu chỉ là câu chậm rải rác mỗi mục một câu | 2 | Từ chối chẩn đoán. Màn `Refuse` nêu lý do chưa đủ căn cứ và mời làm lại quiz | **G10**, G17 | C09 |
| 6 | Câu sai duy nhất được bấm dưới 3 giây | 2 | Từ chối chẩn đoán, đề nghị hỏi lại đúng câu đó trước | **G10** | C10 |
| 7 | Học viên bỏ trống phần lớn câu | 2 | Coi bỏ trống là tín hiệu yếu có thật, khác với bấm bừa, vẫn gom về node cha; bỏ trống toàn bộ thì không chẩn đoán | G10, G8 | C04, C12, C18, C20 |
| 8 | Học viên hỏi nội dung **ngoài cây tri thức** | 3 | Nêu rõ phạm vi, không trả lời bằng kiến thức ngoài cây, trỏ về nội dung gần nhất trong phạm vi | **G1**, G10 | **có ràng buộc, chưa có phép đo** (`chat_prompts.py` quy tắc 3) |
| 9 | Học viên đòi AI làm hộ: giải luôn bài, hoặc chấm điểm thay giảng viên | 3 | Ngoài thẩm quyền. Hệ thống chỉ đề xuất kèm giải thích; quyết định leo tầng do luật, quyết định ôn gì do học viên | G17, augment | **chưa phủ** |
| 10 | Hai câu sai rơi vào hai chương khác nhau, số tín hiệu bằng nhau | 4 | Không liệt kê cả hai. Gom về node cha chung; nếu hoà thì ưu tiên tiền đề (`prereq`), rồi mới tới thứ tự xuất hiện | G11 | C06, C07 |
| 11 | Học viên đúng hết vòng nền sau khi sai ở quiz | 4 | Không kết luận hổng ở node vừa trả lời đúng. Node đó là **trần**, chỗ hổng nằm ở chính ý trong quiz | G11, G2 | C13, C14, C21, C22 |
| 12 | Chạm gốc cây hoặc quá 3 vòng mà vẫn sai | 4 | Chuyển sang "học lại cả bài" kèm compact 3 ý, không leo vô hạn | G2 | C15, C17, C20 |

**Kịch bản rủi ro nhất khi demo** là số 2, khi AI trích một mã đoạn có thật nhưng thuộc phần khác. Nó đúng định dạng nên nhìn qua không phát hiện được, còn lỗi bịa hẳn thì dễ bắt hơn. Đây cũng là 3 trong 4 lượt trượt của ngưỡng 1.

**Độ phủ theo lớp.** Guide §2.6 yêu cầu ít nhất 2 case mỗi lớp trong golden set:

| Lớp | Phủ bởi | Đạt |
|---|---|---|
| 1, nguồn sự thật | không có case trong `eval/cases.json`, đo bằng suite khác (`grounding.py`, 20 lượt AI thật) | đo được, nhưng **không nằm trong golden set** như guide yêu cầu |
| 2, mơ hồ hoặc thiếu thông tin | C04, C08, C09, C10, C12, C18, C19, C20 | ✓ |
| 3, ngoài phạm vi hoặc thẩm quyền | không có case nào | ✗ **thiếu phép đo** |
| 4, đặc thù domain | C06, C07, C13, C14, C15, C17, C21, C22 | ✓ |

Lớp 3 là lỗ hổng lớn nhất, nhưng là lỗ hổng **đo lường** chứ không phải hiện thực: một dòng ràng buộc trong prompt chưa phải là hành vi đã được chứng minh.

## §6. Bốn đường đi của trải nghiệm

Năm đường đầu đã bấm được trong `mockup/`. Đường lớp 3 mới có ràng buộc ở backend, chưa có phép đo và chưa nối vào trang.

- **Happy path:** làm 5 câu, sai 2 câu cùng chương, chọn "Tìm phần nền bị hổng", vòng chẩn đoán ở mục cha, khoanh được chỗ hổng, trả về 1–2 mục ôn kèm mã đoạn và dấu vết quyết định.
- **Low-confidence (lớp 2):** không có câu sai nhưng có câu đúng mà chậm hơn 25s, hệ thống nêu rõ đang lấy thời gian trả lời làm tín hiệu rồi mới hỏi thêm; câu sai dưới 3s bị gắn cờ "có thể bấm bừa" thay vì coi là hổng chắc chắn.
- **Failure hoặc không căn cứ (lớp 1):** hai tầng chặn. Thứ nhất, luật không gom được tín hiệu về node nào thì màn `Refuse` nêu lý do và không chẩn đoán bừa. Thứ hai, AI trả về nội dung trích sai phạm vi hoặc sai khung thì `validate.py` bắt được; khi API lỗi hoặc bị giới hạn tốc độ, trang hiện thẳng lý do rồi rơi về text mock, không trả nội dung rỗng trong im lặng.
- **Correction (user sửa):** "↻ Làm lại vòng này" và "Mình tự ôn được" cho phép học viên bác bỏ chẩn đoán. Lựa chọn đó ghi vào dấu vết, và lần làm lại không xoá lịch sử.
- **Khi bị đòi ngoài phạm vi (lớp 3):** phạm vi nêu ở màn đầu kèm badge nguồn dữ liệu, còn ràng buộc nội dung nằm trong prompt của backend (§5, kịch bản 8). Đường này chưa nối vào trang và chưa có phép đo, xem §7.
- **Case đặc thù domain (lớp 4):** nhiều câu sai gom về node cha chung và chỉ chẩn đoán nhánh nhiều tín hiệu nhất; chạm gốc hoặc quá 3 vòng thì chuyển sang "học lại cả bài" kèm compact 3 ý.

## §7. Kiểm thử

### Chiều chất lượng, định nghĩa kiểm chứng được, và quality bar

Bảy ngưỡng dưới đây **chốt tại CP4 và không sửa sau mốc này**. Nguyên tắc đặt ngưỡng: xác định **sai thì ai chịu hậu quả gì**, rồi neo con số vào một số liệu có thật (mining §1, nghiên cứu §3, hoặc ràng buộc kỹ thuật), không nhìn kết quả rồi điều chỉnh cho vừa.

| # | Chiều | Định nghĩa kiểm chứng được | Đo bằng | Ngưỡng | Neo vào |
|---|---|---|---|---|---|
| 1 | **Dẫn nguồn đúng** | mọi mã đoạn AI trích ra có thật trong cây **và** nằm trong phần tư liệu đã cấp cho lượt đó | `grounding.py` | **≥90%** | Tutor hiện tại có 33% câu trả lời không trích nguồn. Sản phẩm lấy provenance làm lõi (rubric C1 25%) nên phải hơn hẳn chứ không chỉ ngang, tức giảm 33% xuống còn ≤10% |
| 2 | **Định vị đúng chỗ hổng** | node chọn để chẩn đoán **và** kết luận cuối (`scenario`, `gap`, `ceiling`) trùng nhãn nhóm gán tay | `run.py` | **≥90%** | ALEKS cần 20–30 câu trên cây hàng nghìn kỹ năng, còn ta có 14 câu trên cây 38 node, tức số câu hỏi trên mỗi node cao hơn nhiều. Bài toán nhỏ hơn nên không có cơ sở đặt ngưỡng thấp |
| 3 | **Từ chối đúng lúc** | tín hiệu không đủ thì phải trả "chưa đủ căn cứ", tín hiệu đủ thì không được từ chối | `run.py` | **100%** khi thiếu, **≤10%** từ chối thừa | Tutor hiện tại không bao giờ tuyên bố đã định vị được chỗ hổng (0,2%). Chẩn đoán sai là thêm một kiểu hỏng mà hiện trạng không có, tệ hơn im lặng; từ chối thừa chỉ gây phiền nên đặt lỏng hơn |
| 4 | **Hữu ích** | người chưa đọc tài liệu vẫn hiểu, giải thích phương án sai bằng nội dung, và có hành động rõ | LLM mạnh hơn và người chấm | **≥70%** | Neo vào 29% quay lại. Lời khuyên dùng được ở ≥70% số lượt thì tỉ lệ phải quay lại không tệ hơn hiện trạng |
| 5 | **Nối được giữa các vòng** | người chấm xác nhận vòng sau bám node vòng trước, không hỏi lại thứ đã hỏi, không kết luận hổng ở node vừa trả lời đúng | `review_rounds_ui.py` | **≥80% số phiên** | Đơn vị là cả phiên, vì `MAX_ROUNDS = 3` nên một phiên có 2 mối nối, và 80% mỗi mối chỉ cho 0,8² = 64% phiên liền mạch. Tính theo vòng thì số đẹp mà phiên vẫn gãy |
| 6 | **Hai người chấm khớp nhau** | hai thành viên chấm độc lập cùng 5 output, tỉ lệ trùng kết luận | `review_summary.py` | **≥80%** | Ngưỡng của guide §2.6, lệch từ khoảng 20% số case là định nghĩa chưa đủ rõ. Chưa đạt mức này thì số ở ngưỡng 4 và 5 không dùng được |
| 7 | **Thời gian chờ** | từ lúc bấm đến lúc có nội dung AI | đồng hồ trong trang | trung vị **≤5s**, p90 **≤10s** | Tutor hiện tại trung vị 4,6s và p90 7,7s, học viên đã quen mức đó. *Lưu ý: `reply_ms` hai kỳ đo bằng hai nguồn khác nhau, chỉ so xu hướng* |

**Điều kiện cứng**, đạt hoặc không chứ không phải ngưỡng phần trăm: **0 lượt bịa mã đoạn không tồn tại**. Sai cách trình bày thì học viên còn kiểm lại được, còn bịa nguồn thì không, và 0,3% lượt có rating cho thấy không ai báo lỗi. Một lượt cũng là trượt.

Ba ngưỡng đang đặt **cao hơn kết quả đã biết**: ngưỡng 1 đặt 90% khi đang 80%, ngưỡng 4 đặt 70% khi đang 55%, ngưỡng 6 đặt 80% khi chưa có số nào. Nếu đặt cho vừa kết quả thì đã đặt 75% và 50%.

**Một giả định chưa có neo:** `SLOW_SEC = 25` và `RUSH_SEC = 3` là nhóm tự chọn, không dựa trên dữ liệu nào, mà lại quyết định toàn bộ tín hiệu đầu vào của ngưỡng 2 và 3.

### Golden set

**26 case** trong `eval/cases.json`. Mỗi case là một hồ sơ trả lời **giả**, không phải học viên thật: 5 câu quiz dạng `[phương án đã chọn, số giây]`, kèm nhãn kỳ vọng và lý do gán nhãn.

| Cơ cấu | Số case |
|---|---|
| Tính vào tỉ lệ đạt | **22** |
| trong đó chỉ đo bước định vị (`expect.target`) | 12 |
| trong đó đo cả chuỗi leo cây (`expect.final`) | 10 |
| trong đó kỳ vọng hệ thống từ chối chẩn đoán | 3 |
| `xfail`, viết theo giả định nhóm muốn hệ thống đạt, tính năng chưa build | **4** (C23–C26) |

- Nhãn gán tay theo cây tri thức, **gán trước khi chạy code**, không lấy từ output.
- Bốn case `xfail` liệt kê riêng như backlog và không tính vào tỉ lệ, vì viết theo lối "hệ thống nên làm gì" chứ không phải "hệ thống đang làm gì".
- Chạy `python scripts/run.py` để sinh `eval/results.md`.
- **Chống trôi:** `run.py` kiểm vân tay bộ câu hỏi gồm node và đáp án. Đổi quiz mà quên gán nhãn lại thì bộ đo dừng và báo lỗi thay vì báo đạt.
- `node scripts/smoke.js` dựng trang đúng thứ tự script như trình duyệt rồi render một lần, chặn lỗi trắng trang trước demo.
- `python scripts/parity.py` so ba bản luật (backend, bộ đo, trang mock) trên cùng bộ case, lệch một case là dừng. Không có nó thì số đo sẽ trôi khỏi phiên bản chạy thật.

### Kết quả các lượt chạy

**Đối chiếu từng ngưỡng tính đến CP4**

| # | Chiều | Ngưỡng | Số đang có | Đối chiếu |
|---|---|---|---|---|
| 1 | Dẫn nguồn đúng | ≥90% | **16/20 = 80%** | ✗ chưa đạt, thiếu 2 lượt |
| 2 | Định vị đúng chỗ hổng | ≥90% | **22/22 = 100%** | ✓ đạt, nhưng trên bộ case nhóm tự soạn |
| 3 | Từ chối đúng lúc | 100% và ≤10% | 3/3 case thiếu tín hiệu đều từ chối, 0 từ chối thừa | ✓ đạt, nhưng 3 case là quá ít để kết luận |
| 4 | Hữu ích | ≥70% | **11/20 = 55%** | ✗ chưa đạt, khoảng cách lớn nhất |
| 5 | Nối được giữa các vòng | ≥80% số phiên | **4/5 = 80%**, 1 người chấm | chạm mức nhưng chưa tính, cần người thứ hai |
| 6 | Hai người chấm khớp nhau | ≥80% | chưa có | ✗ chưa đo |
| 7 | Thời gian chờ | trung vị ≤5s | chưa có | ✗ chưa đo, chưa có dụng cụ bấm giờ lời gọi AI |
| — | *Điều kiện cứng:* không bịa mã đoạn | 0 lượt | **0/20** | ✓ đạt |

Hai ngưỡng trượt là 1 và 4, ba ngưỡng chưa đo là 5, 6, 7. Theo guide §4.1, không đạt quality bar nhưng phân tích được nguyên nhân vẫn tính đủ điểm.

**Luật chẩn đoán**

| Lượt | Ngày | Kết quả | Ghi chú |
|---|---|---|---|
| R0 (baseline) | 18/9 | **17/20 = 85%** | Cây mock tự nghĩ, luật chưa có tiền đề, chưa biết từ chối chẩn đoán |
| R1 | 18/9 | **20/20 = 100%** | Cây dựng lại từ transcript và 2 luật mới |
| R2 | 18/9 | **22/22 = 100%** | Thêm case, tách 4 case `xfail` ra khỏi tỉ lệ |

R0 để lộ 3 lỗ hổng: C07 thiếu cạnh `prereq`, C09 và C10 chưa biết từ chối chẩn đoán. Cả ba đã sửa, xem §9. Con số 100% chứng minh luật khớp đặc tả của nhóm chứ không chứng minh đặc tả đúng, và đó là việc của ngưỡng 6.

**Dẫn nguồn, 20 lượt qua endpoint thật** (`gemini-3.5-flash-lite`, `POST /ai/plan/generate`, đóng băng ở `eval/grounding.json`). Bốn lượt trượt gồm 3 lượt trích mã đoạn ngoài phạm vi tư liệu được cấp, cả ba rơi vào kịch bản "học lại cả bài" nơi tư liệu cấp rộng nhất, và 1 lượt câu tự kiểm sai định dạng. Không lượt nào bịa mã đoạn không tồn tại nên điều kiện cứng vẫn giữ. Lỗi dồn vào một kịch bản chứ không rải đều, tức đây là lỗi **phạm vi tư liệu cấp cho prompt** chứ không phải mô hình bịa. Hướng sửa sau CP4 là thu hẹp tư liệu cấp cho kịch bản `nen_bai`.

**Hữu ích, 11/20 = 55%**, chấm bằng LLM mạnh hơn và chưa có người chấm. Chín lượt trượt cho thấy ràng buộc chống bịa đang quá chặt: mô hình giữ an toàn bằng cách bám chữ trong tư liệu, nên lúc cần giảng thì chỉ trích dẫn.

| Nhóm lỗi | Số lượt | Ví dụ |
|---|---|---|
| Viện dẫn tài liệu thay cho giải thích | 4 | *"sai vì tư liệu không đề cập đến…"* |
| Mức "học lại cả bài" thiếu nội dung | 4 | chỉ liệt kê tên chương và 3 gạch đầu dòng, câu tự kiểm thành thủ tục |
| Né trả lời thứ luật tự suy được | 1 | *"tư liệu chưa nói rõ về thứ tự nên ôn lại"* |

Hai ngưỡng này đánh đổi nhau: ngưỡng 1 cùng điều kiện cứng đẩy prompt về phía **trích dẫn**, còn ngưỡng 4 kéo về phía **giảng giải**. Nới ràng buộc để đạt ngưỡng 4 gần như chắc chắn kéo ngưỡng 1 xuống, và đó là bài toán thật của sản phẩm.

**Các phép đo phụ trợ**, không phải ngưỡng:

| Phép đo | Kết quả | Đo gì |
|---|---|---|
| Đồng bộ ba bản luật (`parity.py`) | **26/26** | backend, bộ đo, trang mock cho cùng kết quả |
| Chuỗi nhiều vòng, **máy** (`multiround.py`) | **5/5** | mỗi vòng bám đúng node, không lặp vòng trước (Jaccard), không kết luận hổng ở node vừa đúng |
| Endpoint (`api_smoke.py`) | **17/17** | 11 endpoint và 2 phép thử luật qua HTTP |
| Khung câu trả lời (`validate.py`) | **17/20** | đếm trích dẫn, đúng một dòng `Tự kiểm:`, độ dài |

Chênh lệch 5/5 máy so với 4/5 người ở chuỗi nhiều vòng là lý do ngưỡng 5 giao cho người chấm: máy chỉ đo được độ trùng từ, không đo được nội dung có tiến triển hay không.

### Tự khai phần chưa xong tại CP4

| Chỗ chưa xong | Trạng thái | Ảnh hưởng |
|---|---|---|
| **Hai người chấm độc lập** | `eval/review/` có 2 file nhưng cùng một người, và cả hai gắn hash câu trả lời cũ nên bị loại khỏi tổng hợp. Thực chất **0/20 đã chấm hợp lệ** | Ngưỡng 6 chưa đo được, kéo theo 4 và 5 chưa có xác nhận của người |
| **Trang mock chỉ nối 1 trong 4 route AI** | `/ai/explain/*`, `/ai/diagnosis/*`, `/ai/chat/*` có ở backend nhưng trang không gọi | Ngưỡng 7 chưa đo được trên đường AI 1, và §4 vì vậy khai mức Mock |
| **Ngân hàng câu hỏi đã mở rộng nhưng bộ đo thì chưa** | Backend nay có 20 câu phủ 16 node và `GET /quiz` nhận `count` từ 5 đến 20. Nhưng trang mock, golden set và cả ba bản luật vẫn chạy trên đúng 5 câu cũ | Ngưỡng 2 và 3 vẫn chỉ được kiểm trong phạm vi 5 lá đó. Muốn tính rộng hơn thì phải gán nhãn lại golden set cho bộ đề mới |
| **Bộ đề backend đã tách khỏi nguồn duy nhất** | `scripts/export_graph.js` sinh `quiz.json` từ `mockup/data.js`, nhưng 15 câu mới được thêm thẳng vào `quiz.json`. Chạy generator bây giờ sẽ **xoá mất 15 câu đó** (đã thử và hoàn nguyên) | Cơ chế chống trôi của §7 chỉ còn bảo vệ cây, không còn bảo vệ bộ đề |
| **Cây do mô hình sinh, một người chốt** | 38 node, 9 cạnh `prereq`, `conf` (33 node 0,9 và 5 node 0,7) chưa qua người thứ hai đối chiếu với transcript | Provenance chiếm 25% rubric nhưng dựa trên phép ánh xạ node sang mã đoạn chưa kiểm chéo |
| **`SLOW_SEC=25` và `RUSH_SEC=3`** | Data pack có thời gian tutor trả lời nhưng không có thời gian học viên làm quiz, nên không có gì để đối chiếu | Hai số này sai thì con số 100% của ngưỡng 2 mất ý nghĩa |
| **Log khảo sát** | Đã khảo sát n=31, đạt ngưỡng ít nhất 20 người, nhưng repo mới có bản tổng hợp biểu đồ | Chuẩn A chưa trọn vẹn, cần xuất CSV của Google Form vào `validation/` |
| **Đường chat ngoài phạm vi (lớp 3)** | Ràng buộc có trong `chat_prompts.py`, nhưng không case nào kiểm và trang mock chưa nối `/ai/chat/message` | Lớp 3 của §5 chưa có phép đo, chưa demo được đường này |
| **4 case `xfail` C23–C26** | Chưa build: engine không mang lịch sử vòng, trạng thái sau retest chưa vào phần tư vấn, prompt không nhận từng câu nền đã sai, resume chưa có case kiểm | Không tính vào ngưỡng 2, đưa vào backlog §8 |
| **Sinh câu hỏi nền có điều kiện** | Chưa làm, mô tả ở §4 | Làm ngưỡng 2 và 3 kém chắc chắn hơn con số 100% thể hiện |
| **Case từ chatlog thật** | Guide §2.6 yêu cầu ít nhất 10 trong 20 case lấy hoặc phát triển từ chatlog thật, nhưng cả 26 case hiện tại đều do nhóm tự dựng | Bộ case chưa đạt cơ cấu guide yêu cầu |

## §8. Phân công & kế hoạch

| Thành viên | MSHV | Mảng | Phần việc |
|---|---|---|---|
| Lê Anh Duy | 2A202602723 | spec, evidence, mock | Dựng repo, cây tri thức và trang mock; `scripts/mining.py`, bộ đo trong `eval/` và `scripts/`; viết spec |
| Lê Quang Thành | 2A202602647 | code backend, prompt | FastAPI, 4 route AI, prompt theo kịch bản, mở rộng ngân hàng câu hỏi lên 20 câu |
| Nguyễn Thị Phương Duyên | 2A202603001 | code frontend | React UI trong `codebase/frontend`, theme, màn quiz và luồng học |
| Đào Trọng Khang | 2A202602974 | demo, multi-prototype | Slide và kịch bản demo; dựng phương án UI thứ hai để so sánh |

- **Willing users: 3 người**, đều là học viên trong khoá và ngoài nhóm, đã nhận lời thử prototype. Danh tính giữ kín theo luật bảo mật của khoá; nhóm lưu tên và MSHV ngoài repo, đối chiếu được khi ban tổ chức yêu cầu.

  | Người thử | Vì sao sẵn sàng (nguyên văn rút gọn) |
  |---|---|
  | **A** | Muốn hệ thống nhanh hơn và chính xác hơn |
  | **B** | Hay phải mở lại slide, mà slide load rất lâu và tìm thì mất thời gian |
  | **C** | Thấy ứng dụng thú vị vì dùng Knowledge Graph, có tiềm năng |

- **Kế hoạch vòng validation** (bonus theo guide §4.2, làm trước CP5): mỗi người một phiên 10 phút theo 5 nhịp comfort, context, task theo outcome, quan sát im lặng, hỏi sau khi dùng. Giao task bằng kết quả cần đạt chứ không chỉ nút bấm. Log từng người một dòng trong `validation/`, kèm quote nguyên văn và mức nghiêm trọng. Nếu kịp thì mời thêm một người từ nhóm khác trong phòng.
- **Multi-prototype: đang làm.** Khang dựng một phương án UI thứ hai để đặt cạnh bản của Duyên. Theo guide §3.3, hai bản chỉ tính là multi-prototype khi khác nhau ở **một quyết định thiết kế có tên** (mức tự động, kiểu tương tác, hoặc dạng output), không phải khác giao diện. **Trục khác biệt chưa chốt** — phải chốt trước khi dựng, nếu không sẽ không so sánh được và không ghi điểm.

## §9. Changelog

| Thời điểm | Đổi gì | Vì sao |
|---|---|---|
| 17/9 | Dựng khung spec, chốt track C1, hướng adaptive-first, lát cắt, stack | Init repo |
| 17/9 | Mock CP2: quiz mỗi màn một câu, cho bỏ qua, đếm giờ từng câu và dùng thời gian làm tín hiệu (`slow`, `rush`) | Đúng hay sai không phân biệt được "biết chắc" với "đoán trúng" |
| 17/9 | Hệ thống không tự leo tầng, hết mỗi vòng dừng cho học viên chọn | Tự nhảy vòng là tước quyền quyết định của học viên |
| 17/9 | Tách AI 1 giải thích đáp án khỏi AI 2 chẩn đoán nền | Hai câu hỏi khác nhau, nhiều học viên chỉ cần cái thứ nhất |
| 18/9 | Quiz đổi 2 câu để có cặp câu cùng node cha | Bộ cũ mỗi câu một node cha khác nhau nên luật gom tín hiệu về cha chung không bao giờ chạy |
| 18/9 | Tách luật chẩn đoán ra file dùng chung cho demo và `eval/` | Bộ đo chép lại luật thì số đo sẽ trôi khỏi phiên bản chạy thật |
| 18/9 | Chạy golden set R0 được 17/20, lộ 3 lỗ hổng C07, C09, C10 | `eval/results.md` |
| 18/9 | Dựng lại cây từ `transcript-01-clean.md` gồm 30 node, provenance là mã đoạn `[T01-NNN]`, có `conf` | Cây cũ ghi số trang slide chưa đối chiếu, mà trích dẫn bịa là rủi ro nặng nhất của đề, chiếm 25% provenance |
| 18/9 | Thêm cạnh `prereq` tách khỏi quan hệ mục lục | Đề phân biệt `prerequisite` với `broader/narrower`, và lát cắt nói prerequisite nên không lấy mục lục thay thế |
| 18/9 | Luật từ chối chẩn đoán khi tín hiệu toàn `rush` hoặc `slow` tản mát | Đoán bừa tệ hơn nói "chưa đủ căn cứ", và đây cũng là yêu cầu uncertainty rõ ràng của đề |
| 18/9 | Kiểm vân tay bộ câu hỏi trong `run.py` | Case gắn theo vị trí câu hỏi, đổi quiz mà quên gán nhãn lại thì số đo vẫn đạt nhưng vô nghĩa |
| 18/9 | Nối Gemini qua backend, đo 20 lượt được 16/20 có căn cứ và 11/20 hữu ích | Số đo đầu tiên có AI thật. Có căn cứ không đồng nghĩa dạy được |
| 18/9 | Thêm suite chuỗi nhiều vòng gồm 5 phiên | Trước đó không phép đo nào chạm tới `/ai/explain/round`, tức cơ chế trung tâm chưa từng được đo |
| 18/9 | Bản chấm tay gắn theo hash câu trả lời | Nhận xét cho bản cũ dính vào bản mới thì số đo thành sai |
| 18/9 | Đếm lại toàn bộ evidence §1 bằng `scripts/mining.py`. *65% hỏi lại cùng một phần* thành **29%**, *11% quay lại buổi trước* bị bỏ, *15% câu hỏi ôn hoặc học lại* thành **2,3%** và hạ xuống mức minh hoạ | Số cũ đếm theo tin nhắn, mà trung bình 7,3 tin mỗi người nên hầu như ai cũng đạt "ít nhất 2 tin", lại không loại câu mẫu. Bản cũ cũng không có script trong repo nên không kiểm lại được |
| 18/9 | Thêm khảo sát n=31 theo chuẩn A vào §1 | Mining chứng minh pain tồn tại, khảo sát chứng minh học viên muốn nó được giải |
| 18/9 | Bỏ mệnh đề "chỗ hổng thường nằm ở prerequisite" khỏi §1 | Không có bằng chứng. Sản phẩm **kiểm** giả thuyết đó cho từng người và có ba kết luận phủ định, xem §4 |
| 18/9 | Bốn file prompt đang yêu cầu AI trích số trang slide, đổi sang mã đoạn `[T01-NNN]` | §4 định nghĩa số trang slide là trích dẫn bịa, mà ví dụ mẫu trong prompt lại dẫn mô hình làm đúng điều đó |
| 18/9 | Hạ mức prototype từ Working xuống Mock | Trang mock mới nối 1 trong 4 route AI |
| 18/9 | Chốt 7 ngưỡng tại CP4, mỗi ngưỡng neo vào một số liệu có thật | Yêu cầu của CP4 là chốt "thế nào là đạt" trước khi biết kết quả |
| 18/9 | Merge nhánh UI và `feat/ai-backend` vào main. Cây lên 38 node, ngân hàng câu hỏi lên 20 câu phủ 16 node, `GET /quiz` nhận `count` 5 đến 20 | Gộp việc của ba người trước CP4. Xung đột duy nhất ở `api_contract.md` mục `/quiz`, giữ bản mô tả có `count` vì khớp code thật |
| 18/9 | Phát hiện `quiz.json` đã tách khỏi `mockup/data.js`, chạy `export_graph.js` sẽ xoá 15 câu mới thêm | Ghi vào phần tự khai của §7 để không ai chạy generator rồi mất đề |
| 18/9 | Cập nhật số khảo sát trong canvas CP1 từ n=21 lên n=31 | Canvas chốt lúc form mới có 21 người trả lời; giữ số cũ thì canvas và spec vênh nhau 10 điểm phần trăm ở câu "vẫn chưa hiểu rõ" |
