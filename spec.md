# AI SPEC — Chẩn đoán lỗ hổng prerequisite từ quiz ngắn · Nhóm ColdBrew · Phòng E402

**Track:** C · Lesson Studio — **đề C1 · Knowledge-to-Lesson** (graph tri thức + bài học thích ứng)
**Hướng triển khai C1:** [x] Adaptive-first  [ ] Graph-first  [ ] End-to-end
→ tự dựng graph nhỏ **30 concept từ `data/vlearn-pack/transcript/transcript-01-clean.md`** và **ghi rõ là tự dựng** (đề không cấp graph mẫu). Chi tiết ở cuối §0.
**Loại:** [x] Tính năng mới  [ ] Tối ưu tính năng có sẵn

## Đọc trong 30 giây

| | |
|---|---|
| **Ai · việc gì** | Học viên AI20k làm quiz ôn xong, không biết phải học lại cái gì |
| **Bằng chứng** | Tutor hiện tại **hỏi ngược 0,2%** / giảng lại 87% · **29%** học viên quay lại cùng một mục ở dịp khác · khảo sát n=31: **54,8%** vướng ở *"không biết mình thiếu kiến thức nào"* |
| **Lát cắt** | Quiz 5 câu → luật gom tín hiệu yếu → hỏi 3 câu nền → khoanh chỗ hổng (hoặc nói *chưa đủ căn cứ*) → nội dung cần ôn + căn cứ trích từ transcript |
| **Quyết định AI** | **Luật định vị, LLM chỉ diễn giải.** AI không chọn nhánh, không chấm |
| **7 ngưỡng chốt CP4** | 2 đạt · 2 trượt (dẫn nguồn 80%/90% · hữu ích 55%/70%) · 3 chưa đo. Bảng §7.1, đối chiếu §7.3 |
| **Chưa xong** | 0/20 bản chấm tay hợp lệ · quiz mới chạm 5/30 node · lớp lỗi ③ chưa có phép đo. Đủ danh sách: **§7.5** |

Chi tiết bằng chứng nằm ở `eval/evidence/mining.md` và `validation/survey.md`; kết quả đo ở `eval/`.

> Trạng thái CP4: §1–§7 đã chốt. §8 đang điền.

---

## §0. Stack & kiến trúc (chốt)

| Lớp | Chọn | Ghi chú |
|---|---|---|
| Frontend | React + Vite | `codebase/frontend` |
| Backend | Python FastAPI | `codebase/backend` |
| AI provider | **Gemini** qua **endpoint tương thích OpenAI** | SDK `openai`, `base_url=https://generativelanguage.googleapis.com/v1beta/openai/`, model đang chạy `gemini-3.5-flash-lite` (free tier **15 req/phút** — mọi script gọi AI đều phải tiết lưu) |
| Lưu trữ graph + learner state | JSON file (`eval/`, `codebase/backend/data`) | đủ cho 15–30 concept; không dựng graph DB |

Vì sao OpenAI-compatible: đổi provider chỉ sửa `base_url` + `MODEL`, không sửa code — phòng khi rate-limit lúc demo.

Mô hình dữ liệu (ý nghĩa node · cạnh · provenance · nhãn eval): **`docs/data-model.md`**.

Bản mock CP2: `mockup/` — HTML tĩnh + React qua CDN, **chưa gọi AI**, chạy được trên GitHub Pages. Sơ đồ luồng và quy tắc chẩn đoán: `mockup/flow.md`.

**Cây tri thức (nhóm tự dựng, đề không cấp graph mẫu):** 30 node **sinh bằng mô hình mạnh (Claude) đọc `transcript-01-clean.md`, nhóm rà lại và chốt** — chưa có người thứ hai đối chiếu độc lập từng mã đoạn. Nguồn: `data/vlearn-pack/transcript/transcript-01-clean.md` — *Day 2 (sáng) · Xác định bài toán kinh doanh cho AI*, 89 đoạn `[T01-001…089]`. Mỗi node mang `file` · `span` (mã đoạn) · `conf` (0.9 nói thẳng trong đoạn · 0.7 nhóm từ nhiều đoạn) và cạnh `prereq` tách riêng khỏi quan hệ mục lục. Slide d2 **chưa đối chiếu trang nên không ghi số trang** — thà thiếu còn hơn trích sai; luật này đã được đưa vào cả 5 file prompt của backend (18/9). Repo **không chứa data pack**, chỉ trích mã đoạn.

---

## §1. User & Job

- **Job executor:** học viên AI20k đang học một chương (ví dụ Day 1 — AI & LLM Foundation), làm quiz ôn tập rồi tự hỏi "sai chỗ này thì phải học lại cái gì".
- **Core JTBD:** *Khi tôi làm sai vài câu trong bài ôn, tôi muốn biết chính xác mình hổng khái niệm nền nào và học lại đúng phần đó, để không phải đọc lại cả chương.*
- **Problem statement (không chữ AI):** Học viên làm quiz xong chỉ biết "đúng 3/5". Bài ôn được phát theo một lộ trình tuyến tính giống nhau cho mọi người, trong khi mỗi người hổng ở concept khác nhau. Sai một câu thì **chưa biết** hổng nằm ở chính ý đó hay ở một khái niệm nền phía dưới — và hiện không có cách nào biết ngoài việc tự đoán. Hậu quả: học viên đọc lại cả chương cho chắc, hoặc bỏ qua.

  *Lưu ý về cách phát biểu:* nhóm **không khẳng định** "chỗ hổng thường nằm ở prerequisite". Đó là một câu hỏi, và sản phẩm là **cái máy đi kiểm câu hỏi đó cho từng người** — kiểm xong có quyền trả lời **không**. Xem §4.
- **Evidence — chuẩn A (khảo sát).** Form *"Làm sai rồi học gì tiếp?"* · **n = 31** · học viên trong khoá · đạt ngưỡng ≥20 người của guide §1.3. **Đủ 7 câu + hạn chế: [`validation/survey.md`](validation/survey.md).** Ba số dùng để lập luận:

  | | |
  |---|---|
  | **Q4** — điều cản trở nhất | **"Không biết mình thiếu kiến thức nào" 54,8%** (cao nhất) |
  | **Q5** — sau khi tự tìm hiểu | **54,8%** *"biết mình yếu phần nào nhưng vẫn chưa hiểu"*; chỉ 38,7% hiểu lại được |
  | **Q6** — lần gần nhất tốn bao lâu | **42% mất hơn 15 phút**, 19,4% hơn 30 phút |

  *Câu hỏi đáng tin nhất là Q6* (hỏi về lần gần nhất, chuẩn Mom Test). *Yếu nhất là Q7* (87,5% nói sẵn sàng dùng) — đúng loại câu guide §1.3 dặn tránh, **không dùng để biện minh cho quyết định chọn**.

  **Một nửa lát cắt có bằng chứng yếu hơn hẳn nửa kia:** Q2 cho thấy *"Mình đang yếu kiến thức nào"* được **77,4%** chọn, còn *"Nên học lại phần nào trước"* chỉ **38,7%** — thấp nhất trong bốn lựa chọn thực chất. Lát cắt §4 hứa cả hai: **định vị** (nửa A, bằng chứng mạnh) và **lộ trình ôn** (nửa B, yếu hơn). Không phải khảo sát bác bỏ nửa B — 12/31 người vẫn chọn và đề C1 yêu cầu nó — mà là chuyện **trọng số khi kể chuyện**: demo và slide nhấn phần định vị + căn cứ, không nhấn "lộ trình cá nhân hoá".

- **Evidence — chuẩn B (mining chatlog).** Script: **`scripts/mining.py`** (có `--selftest`) → **`eval/evidence/mining.md`**. Data pack không nằm trong repo (`DATA_NOTICE.md`); tải `tutor_turns.csv` về rồi chạy lại là ra đúng số dưới đây. **Luật đếm khai đầy đủ trong file báo cáo**, tóm tắt: chỉ khoá K4 · bỏ câu mẫu bấm sẵn · đơn vị là **dịp hỏi** (hai câu cách nhau >30 phút là hai dịp), **không** phải tin nhắn. Còn lại **2.555 lượt · 384 học viên**.

  | Chỉ số | Kết quả | Ý nghĩa |
  |---|---|---|
  | Tutor **hỏi ngược** để chẩn đoán (`ask_probing_question`) | **6/2.555 = 0,2%** | công cụ hiện tại **giảng, gần như không bao giờ đo** học viên hổng đâu |
  | Tutor **giảng lại khái niệm** (`review_concept`) | **2.226/2.555 = 87%** | một nước đi duy nhất cho mọi loại câu hỏi |
  | Học viên **quay lại hỏi thêm về cùng một mục ở một dịp khác** | **106/369 = 29%** | **hành vi, chưa phải nguyên nhân** |
  | Học viên **bấm đánh giá** · tutor **chấm mức hiểu** | **0,3%** · **0,2%** | hai ô ghi nhận "có hiểu không" đều **bỏ trống** |
  | Câu trả lời tutor **không trích nguồn** | 838/2.555 = 33% | dùng cho ứng viên B ở §2, không phải cho C |

  *Độ nhạy:* 29% phụ thuộc cỡ mục — còn **17,6% nếu bỏ 5 mục lớn nhất**, 4,8% ở mục nhỏ. Nhưng ở mục nhỏ có **64% cặp (học viên × mục) chỉ hỏi đúng một câu** nên không có cơ hội quay lại; chênh lệch phần lớn do ít tiếp xúc. **Bị vặn thì dùng 17,6%.** Bảng đầy đủ trong `mining.md`.

  *"Mục bài học"* là nhãn `(Đang học phần "…")` do giao diện VLearn tự gắn (118 mục, độ mịn không đều). *"Dịp hỏi"* là cụm câu liền mạch. Ví dụ S0124: hỏi lúc 09:10, quay lại 11:33 cùng một mục — nhưng **hai câu hỏi khác nhau**, nên 29% đọc đúng là *"có quay lại mục đó"*, **không** phải *"hỏi lại điều cũ vì chưa hiểu"*.

  **Hai lập luận rút ra:**
  - **Vì sao có lát cắt này:** công cụ đang có xử lý mọi câu hỏi bằng cùng một nước đi *giảng lại* (87%) và **hỏi ngược đúng 0,2%**; hệ quả đo được là 29% học viên quay lại đúng mục đó ở một dịp khác. Không có bước nào **đo trước khi giảng**.
  - **Vì sao phải ĐO thay vì hỏi:** hệ thống có sẵn hai chỗ ghi nhận "học viên có hiểu không", cả hai gần như rỗng (0,3% và 0,2%). Không phải vì ai cũng hiểu — khảo sát Q5 có **54,8%** tự nhận vẫn chưa hiểu. **Học viên không tự khai; chờ họ nói ra thì không bao giờ có dữ liệu.**

  **Quote nguyên văn** (mã lượt, cắt ngắn theo luật data pack; đủ danh sách trong `mining.md`):
  - **[T10291]** *"Dựa trên tiến độ của mình, mình nên ôn phần nào trước?"* — học viên thật hỏi **đúng** câu sản phẩm này sinh ra để trả lời
  - **[T10326]** *"Giải thích lại giúp mình phần mà mình hay thấy khó."*
  - **[T10317]** *"giải thích lại dc không hơi khó hiểu"*
  - **[T10883]** *"em vẫn chưa hiểu rõ sự khác biệt của agent và llm"*
  - **[T10728]** *"bước 2 là gì tôi đang chưa hiểu, tại sao lại cộng trọng số và cộng vào đâu"*

  **Hạn chế — khai trước khi bị hỏi:**
  - **"Quay lại cùng một mục" không chứng minh nguyên nhân gì cả** — không chứng minh chưa hiểu, càng không chứng minh hổng prerequisite. Mining đủ để nói **bài toán tồn tại**, không đủ để nói **chỗ hổng ở đâu**; sản phẩm cũng không dựa vào nó để nói điều đó (§4).
  - **Không có nhãn nào trong data để đối chiếu.** Nhóm từng thử đếm "quay lại **và** nói rõ là chưa hiểu" ra 3,5% (13/369), nhưng nó dựa trên một regex nhóm tự viết, đọc tay thì **độ chính xác chỉ khoảng một nửa** — nên **không đưa vào spec**. Hai lập luận trên dựng bằng phép đếm không suy diễn.
  - `move_used` là nhãn **do chính tutor tự chọn** — 0,2% nói lên thiết kế của tutor, chưa chắc nói lên nhu cầu học viên.
  - Khảo sát: người trả lời là **học viên cùng khoá**, không độc lập với nhóm; và mới có bản tổng hợp, **chưa có log nguyên văn** như guide §1.3 đòi.

## §2. Impact & quyết định chọn

Ba ứng viên cân nhắc trên **cùng một bộ data** (K4, đã lọc như §1):

| Ứng viên | Bao nhiêu người | Tần suất | Mỗi lần tốn gì | Build nổi? | Chọn? |
|---|---|---|---|---|---|
| **A.** Sinh quiz có dẫn trang nguồn cho giảng viên | **không đếm được** — pack không có lượt nào của giảng viên | không đo được | không đo được | được | ✗ |
| **B.** Bắt tutor trả lời có trích nguồn | 33% câu trả lời không trích nguồn (838/2.555) | mỗi lượt hỏi | không truy ngược được nội dung | được | ✗ |
| **C.** Chẩn đoán prerequisite từ quiz sai → lộ trình ôn có giải thích | 29% quay lại hỏi thêm về cùng một mục ở dịp khác (106/369) · khảo sát: **77,4% có làm sai trong 7 ngày** | mỗi lần làm sai | khảo sát Q6: **42% mất hơn 15 phút** mỗi lần tìm nguyên nhân, 19,4% mất hơn 30 phút; và Q5 nói **54,8% vẫn chưa hiểu** sau khi bỏ chừng đó thời gian | được | **✓** |

- **Loại A — vì không có bằng chứng, không phải vì không hay.** Cả 13.494 lượt trong pack đều là học viên hỏi tutor; không có dữ liệu nào về giảng viên soạn quiz. Không đếm được bao nhiêu người gặp, tần suất bao nhiêu, mỗi lần tốn gì → không đặt lên bàn cân được. Nhóm cũng không phải user thật của nó.
- **Loại B — số mạnh nhưng lệch job.** 33% là con số thật và lớn hơn 29%, nhưng B chỉ sửa **cách trình bày câu trả lời**, không trả lời được câu **[T10291]** *"mình nên ôn phần nào trước?"*. Nó làm câu trả lời truy nguồn được, chứ không làm cho lần giảng lại thứ hai trở nên không cần thiết. Thêm nữa chỉ 0,3% lượt có rating → không có cách nào biết việc thêm trích dẫn có làm học viên đỡ quay lại hay không, tức **không đo được thành công**.
- **Chọn C — vì mining và khảo sát chỉ vào cùng một chỗ.** Công cụ hiện tại dùng nước đi *giảng lại* cho 87% lượt và **hỏi ngược đúng 0,2%**; hệ quả đo được là 29% học viên quay lại đúng mục đó ở một dịp khác. C chèn vào đúng chỗ trống đó: **đo trước, giảng sau**. Khảo sát xác nhận từ phía học viên: thứ họ muốn nhất sau khi sai là *"mình đang yếu kiến thức nào"* (Q2, 77,4%) và thứ cản họ nhiều nhất là *"không biết mình thiếu kiến thức nào"* (Q4, 54,8%). Khác B, C còn có tiêu chí thành công đo được ngay trong sản phẩm (định vị đúng node hổng — §7).

## §3. Giải pháp tương tự đã nghiên cứu

| Sản phẩm | Flow của họ | Đáng học | Đáng né | Mình khác gì |
|---|---|---|---|---|
| **Eedi** (Diagnostic Questions) | 1 câu trắc nghiệm, **mỗi phương án sai gán sẵn một misconception**; chọn sai là biết ngay sai vì nghĩ thế nào | Chẩn đoán nằm ở **distractor**, lấy được tín hiệu chỉ từ một lần bấm | Sau khi chẩn đoán chỉ trỏ về **thư viện tài liệu của chủ đề đó** — dừng ở tầng chủ đề | Mình leo ngược lên node cha/tiền đề để tìm chỗ nền vỡ, thay vì trả về đúng chủ đề vừa sai |
| **ALEKS** (Knowledge Space Theory) | Môn học là **đồ thị có hướng các kỹ năng với quan hệ tiền đề**; assessment thích ứng dò ra "knowledge state", chia làm biết / chưa biết / **sẵn sàng học (outer fringe)** | "Outer fringe" chính là khái niệm **trần (`ceiling`)** của mình: node đã đạt là mép để học tiếp, không phải chỗ hổng | Cần **20–30 câu** mới định vị được | Mình chỉ có 5 câu + ~3 câu nền. Đây là lý do luật **"chưa đủ căn cứ"** tồn tại: hỏi ít hơn ALEKS 5 lần thì không được phép chắc chắn |
| **Khan Academy** (Course Mastery) | Mỗi kỹ năng có mức Proficient/Mastered; unit test cho **lên hoặc xuống** mức; gợi ý bài học theo kết quả | Trạng thái **đi lùi được**, không chỉ "chưa đạt" | Gợi ý theo **từng kỹ năng độc lập**, không nói "sai cái này vì hổng cái kia" | Output của mình là một **chuỗi phụ thuộc kèm lý do**, không phải danh sách kỹ năng cần cày lại |
| **Khanmigo** (AI tutor) | LLM dạy kiểu Socratic, đọc được learning record của học viên | — | **(a)** *dạy nhưng không đo* — không có bước test để biết hổng đâu; **(b)** **không nhớ hôm qua học viên vướng gì**, trong khi chất lượng câu hỏi Socratic phụ thuộc hoàn toàn vào việc biết học viên đang ở đâu | Ở mình **luật định vị, LLM chỉ diễn giải** — ngược hẳn |

**Ba trong bốn phát hiện chống lưng cho thiết kế đang có** (ceiling ← ALEKS · luật từ chối chẩn đoán ← ALEKS · rule-quyết-định-LLM-diễn-giải ← Khanmigo). Hai chỗ đáng chú ý:

- **Khanmigo (b) là lỗi mình đang mắc.** "Các vòng không nối với nhau" chính là thứ `scripts/multiround.py` đo; điểm **4/5 người chấm** ở M03 là đúng cái bệnh đó — không phải lỗi vặt, đó là lỗi cố hữu của cả một sản phẩm lớn.
- **Eedi chỉ ra một lỗ hổng thật chưa làm.** Distractor trong quiz của mình hiện **không mang thông tin gì** — chỉ map *câu → node*. Đó là lý do phải hỏi thêm 3 câu nền mới đoán được chỗ Eedi lấy từ một lần bấm. Đây là nơi rẻ nhất để lấy thêm tín hiệu chẩn đoán → backlog §8.

*Nguồn:* [Eedi research](https://help.eedi.co.uk/en/articles/7234087-the-research-behind-eedi) · [Eedi misconception mapping](https://eedi.com/us/blog/from-wrong-answers-to-real-insights-how-we-used-a-kaggle-challenge-to-map-student-misconceptions) · [ALEKS Knowledge Space Theory](https://www.aleks.com/about_aleks/knowledge_space_theory) · [Research behind ALEKS](https://www.aleks.com/about_aleks/research_behind) · [Khan Academy Mastery Challenges](https://support.khanacademy.org/hc/en-us/articles/360037127892-What-are-Mastery-Challenges-in-course-mastery) · [Khan Academy — building a better AI tutor](https://blog.khanacademy.org/how-khan-academy-is-building-a-better-ai-tutor-our-most-recent-learnings/) · [Khanmigo memory limitation](https://memu.pro/blog/khanmigo-ai-tutoring-memory)

## §4. Thiết kế

- **Lát cắt MỘT CÂU:** *Một học viên làm quiz ngắn 5 câu · hệ thống chấm và phân tích các câu sai để xác định concept còn yếu và prerequisite bị hổng · trả về đúng phần nội dung cần ôn kèm lời giải thích vì sao học viên nhận lộ trình đó.*
  - 1 user: học viên · 1 việc: ôn sau khi làm sai · 1 quyết định AI: chọn concept/prerequisite để remediate · 1 kết quả: lộ trình ôn 1–3 mục + giải thích + trích nguồn.
  - **Hệ thống KIỂM giả thuyết, không KHẲNG ĐỊNH nó.** "Chỗ hổng nằm ở phần nền" là câu hỏi đặt ra cho *từng học viên*, không phải mệnh đề về học viên nói chung. Leo cây xong, hệ thống có **ba đường ra phủ định** và cả ba đều là kết luận hợp lệ, không phải lỗi:

    | Kết luận | Nghĩa là | Đo ở đâu |
    |---|---|---|
    | `y_le` — **nền ổn** | trả lời đúng hết vòng nền ⇒ **không** hổng prerequisite; chỗ cần ôn là chính ý trong quiz. Node vừa đạt trở thành **trần**, không phải chỗ hổng | C13 · C19 |
    | `muc_nong` — **hổng nông ngay tại mục** | sai 1/3 câu nền ⇒ không phải vỡ nền, chỉ mỏng tại chỗ | C21 · C22 |
    | **từ chối chẩn đoán** | tín hiệu không đủ (toàn `rush`, hoặc `slow` tản mát) ⇒ nói "chưa đủ căn cứ", không gán gì | C09 · C10 · C12 |

    Vì vậy câu trả lời *"khảo sát hết cây mà không gán được chỗ hổng nào"* là một **đầu ra được thiết kế sẵn và có case kiểm**, không phải trường hợp hệ thống hỏng.
- **Non-goals (KHÔNG build):**
  1. Extraction tự động từ transcript/PDF (graph dựng tay từ slide, khai báo rõ).
  2. Tài khoản, đăng nhập, lớp học, dashboard giảng viên.
  3. Sinh nội dung bài học mới — chỉ trỏ về nội dung/slide đã có.
  4. Bank câu hỏi lớn — quiz cố định ~10–15 câu map sẵn vào concept.
  5. Bayesian knowledge tracing đầy đủ — dùng mastery theo rule, nêu rõ ngưỡng.
- **Hai tính năng AI, tách rời nhau:**

  | | Trả lời câu hỏi gì | Đầu vào | Đầu ra | Nguồn |
  |---|---|---|---|---|
  | **AI #1 · Giải thích đáp án** | "Mình sai **cái gì**?" | một câu + phương án học viên chọn | vì sao đáp án đúng · bẫy của phương án đã chọn · cờ theo thời gian trả lời | node lá của câu đó |
  | **AI #2 · Chẩn đoán nền** | "**Vì sao** mình sai?" | toàn bộ tín hiệu yếu của bài quiz | các vòng câu hỏi leo cây → chỗ hổng + lộ trình ôn + giải thích | node cha trên cây |

  AI #1 gọi được **ở từng câu một** (nút "✨ AI phân tích câu này" trên mỗi thẻ đáp án), **theo cả vòng** ("Nhận xét & giải thích đáp án vòng này") hoặc **cả bài** (màn "Giải thích đáp án"). Học viên chọn, hệ thống không tự sinh.

- **Mức prototype nhắm tới:** [ ] Sketch [x] Mock → [ ] Working *(đang trên đường)*
  - **Thật:** chấm quiz · tín hiệu theo thời gian trả lời · suy luận prerequisite trên graph (rule, 3 bản đồng bộ) · provenance bằng mã đoạn transcript · resume phiên · **1 lời gọi AI thật vào quyết định trung tâm** (`/ai/plan/generate`, đường kịch bản).
  - **Mock:** nội dung của AI #1 trên trang (nút *"✨ AI phân tích câu này"*, *"Nhận xét vòng này"*) đang dùng text soạn sẵn trong `mockup/data.js`; learner state lưu file JSON.
  - **Trạng thái thật tại CP4:** backend có **11 endpoint** với **4 route AI**, nhưng trang mock mới **nối 1/4**. Theo bảng guide §3.2 thì cái đang chạy là **Mock** (flow bấm được, data giả, AI thật ở lõi), không phải Working. Khai đúng mức thay vì khai vống — guide nói *"một bản Sketch làm kỹ được đánh giá cao hơn một bản Working làm vội"*. Ba route còn lại sẽ được nối thêm sau CP4 (không phải feature mới, chỉ là đấu dây).
- **Automation:** [x] augment  [ ] conditional  [ ] automate
  - Cost-of-error: chỉ dẫn sai khiến học viên ôn nhầm phần → mất thời gian, mất niềm tin. Nên hệ thống **đề xuất + giải thích**, học viên (và giảng viên) thấy được căn cứ và bỏ qua được. Quyết định chọn nhánh do **rule trên graph**, LLM chỉ diễn giải — không để LLM tự bịa prerequisite.
- **§4b. Nguyên tắc đã áp dụng (≥4):**

  | Nguyên tắc | Áp cụ thể vào đâu trong prototype |
  |---|---|
  | HAX G11 · *Make clear why the system did what it did* | Panel "Vì sao bạn nhận lộ trình này" + cột "Dấu vết quyết định" ghi từng bước: câu sai nào → gom về node nào → mỗi vòng sai bao nhiêu → leo lên đâu |
  | HAX G2 · *Make clear how well the system can do what it can do* | Ô "Hệ thống đọc được gì" cuối mỗi vòng nói rõ nó suy ra được gì và **chưa** khoanh được gì; lộ trình khi học viên tự ôn có cảnh báo "chỗ hổng có thể còn sâu hơn một tầng" |
  | HAX G17 · *Provide global controls* (học viên giữ quyền) | Hệ thống **không tự leo tầng**: hết mỗi vòng dừng lại cho học viên chọn đi tiếp / làm lại vòng này / tự ôn. Giải thích cũng chỉ sinh khi bấm |
  | PAIR · *Anchor on familiarity / show your work* | Mọi câu hỏi và mục ôn đều gắn một node có `page` (slide + trang); không có nội dung nào không trỏ về được nguồn |
  | HAX G1 · *Make clear what the system can do* | Màn đầu nói thẳng phạm vi: một bài giảng, cây 15–30 concept; badge "MOCK DATA · chưa nối AI" khi chưa có AI thật |

### Skill AI cần có · **Sinh câu hỏi nền có điều kiện** (chưa làm — ghi để không quên)

**Vấn đề.** `PROBES` hiện là bộ câu hỏi **tĩnh, chung cho cả node cha**. Học viên sai ý *A* nhưng 3 câu nền lại hỏi về khía cạnh *B, C, D* của cùng mục đó → trả lời đúng hết **không** chứng minh được là nền của *A* vững. Kết luận "hổng đúng ở ý A" vì thế đang dựa trên một phép đo không bám đúng chỗ.

**Cần.** Câu hỏi nền phải **sinh theo điều kiện**: cho (node cha N · lá bị sai L · phương án học viên đã chọn) → sinh 3 câu ở tầng N **nằm trên đường phụ thuộc dẫn tới L**, không phải 3 câu bất kỳ của N.

**Ràng buộc khi nối AI:**
- Chỉ được dùng nội dung trong `span` của N; mỗi câu sinh ra phải kèm mã đoạn nguồn.
- Rule vẫn giữ quyền quyết định leo tầng; AI **chỉ soạn đề**, không chấm, không chọn nhánh.
- Phải có **bộ câu tĩnh làm dự phòng** khi API chết giữa demo.
- Giảng viên duyệt/loại được câu sinh ra (educator control).

**Kéo theo trong eval — chiều đo mới:** *câu nền sinh ra có thật sự liên quan tới lá bị sai không.* Đo được bằng máy một phần (câu sinh ra có trích `span` nằm trong phạm vi của N không · có nhắc concept nằm trên đường L→N không), phần còn lại phải người chấm. Chưa có chiều này thì mọi kết luận "nền ổn" đều có dấu hỏi.

**Rủi ro phải nói rõ:** nếu AI vừa soạn đề vừa là căn cứ để kết luận thì vòng lặp tự tham chiếu. Giữ rule làm trọng tài và cho người duyệt đề là cách chặn.

## §5. Kiểu lỗi — 4 lớp chỗ khó · 10 kịch bản

Cột cuối trỏ về case đang phủ kịch bản đó. Ô ghi **"chưa phủ"** là lỗ hổng thật, không phải bỏ sót khi viết.

| # | Tình huống cụ thể | Lớp | Hành vi mong muốn (nói gì · hiện gì · cho làm gì tiếp) | Nguyên tắc | Case phủ |
|---|---|---|---|---|---|
| 1 | AI viết lời khuyên và **trích một mã đoạn không tồn tại** trong cây | ① | Không được xảy ra. `scripts/validate.py` đếm trích dẫn và tách thành *hợp lệ / bịa / lạc*; lượt có mã bịa bị đánh trượt, không hiển thị | G2 · PAIR Explainability | `grounding.py` 20 lượt — **0 lượt bịa** |
| 2 | AI trích mã đoạn **có thật nhưng nằm ngoài phần tư liệu đã cấp** cho lượt đó | ① | Trượt như lỗi bịa. Service **tự khai `allowed_spans`** trong response để bộ đo không phải đoán prompt đã cấp gì | G2 | `grounding.py` — **3/20 trượt**, đều ở kịch bản `nen_bai` |
| 3 | AI né giải thích bằng cách viết *"tư liệu không đề cập…"* thay vì giảng nội dung | ① | Prompt **cấm** dùng câu đó thay cho lời giải thích. Đây là lỗi *quá an toàn*, không phải lỗi bịa — vẫn tính là trượt chiều hữu ích | PAIR Errors | Chấm hữu ích — **4/20 dính** |
| 4 | Học viên **đúng hết** nhưng vài câu mất hơn 25s | ② | Nói thẳng *"không có câu sai, lấy câu trả lời chậm làm tín hiệu"* rồi **mới** hỏi thêm; không phán ngay | **G10** · G2 | C08 · C19 |
| 5 | Tín hiệu chỉ là **câu chậm rải rác** mỗi mục một câu | ② | **Từ chối chẩn đoán.** Màn `Refuse` nói rõ vì sao chưa đủ căn cứ và mời làm lại quiz | **G10** · G17 | C09 |
| 6 | Câu sai duy nhất được bấm **dưới 3 giây** | ② | **Từ chối chẩn đoán**, đề nghị hỏi lại đúng câu đó trước — bấm bừa không phải là hổng | **G10** | C10 |
| 7 | Học viên **bỏ trống** phần lớn câu (quiz hoặc vòng nền) | ② | Coi bỏ trống là tín hiệu yếu **có thật** (khác với bấm bừa), vẫn gom về node cha; nếu bỏ trống toàn bộ thì không chẩn đoán | G10 · G8 | C12 · C18 · C04 · C20 |
| 8 | Học viên hỏi chatbot nội dung **ngoài cây tri thức** (buổi khác, hoặc ngoài khoá) | ③ | Nói rõ phạm vi *một bài giảng, cây 30 concept*, **không** trả lời bằng kiến thức ngoài cây, trỏ về nội dung gần nhất trong phạm vi | **G1** · G10 | **có ràng buộc, chưa có phép đo** — `chat_prompts.py` quy tắc 3 cấm bịa kiến thức ngoài tư liệu, nhưng không case nào kiểm |
| 9 | Học viên đòi AI **làm hộ**: giải luôn bài, hoặc chấm điểm thay giảng viên | ③ | Ngoài thẩm quyền. Hệ thống chỉ **đề xuất + giải thích**; quyết định leo tầng do luật, quyết định ôn gì do học viên | G17 · augment (§4) | **chưa phủ** |
| 10 | Hai câu sai **rơi vào hai chương khác nhau**, số tín hiệu bằng nhau | ④ | Không liệt kê cả hai. Gom về node cha chung → nếu hoà thì **ưu tiên tiền đề** (`prereq`), rồi mới tới thứ tự xuất hiện. Dấu vết quyết định phải ghi đúng bước này | G11 | C06 · C07 |
| 11 | Học viên trả lời **đúng hết vòng nền** sau khi sai ở quiz | ④ | **Không** được kết luận hổng ở node vừa trả lời đúng. Node đó là **trần**, chỗ hổng nằm ở chính ý trong quiz (`y_le`) | G11 · G2 | C13 · C14 · C21 · C22 |
| 12 | Chạm tới gốc cây hoặc quá 3 vòng mà vẫn sai | ④ | Chuyển sang *"học lại cả bài"* kèm compact 3 ý — không leo vô hạn | G2 | C15 · C17 · C20 |

**Đã sửa tại CP4 — mâu thuẫn trong chính prompt.** Bốn file prompt (`plan` · `chat` · `diagnosis` · `explain`) đang ra lệnh cho AI *"đính kèm số trang slide cụ thể"* kèm ví dụ mẫu `'Xem lại slide d1 trang 21–22'`, trong khi `scenario_prompts.py` và §0 quy định số trang slide **là trích dẫn bịa**. Dữ liệu bơm vào vốn đã đúng (`page` = `transcript-01-clean.md · [T01-032] …`), nhưng lời hướng dẫn và ví dụ mẫu thì **mời mô hình bịa ra số trang không có trong input**. Đã đổi cả bốn sang mã đoạn `[T01-NNN]`, và thay chuỗi mặc định `"Slide bài giảng"` trong 6 router thành `"(chưa có mã đoạn nguồn)"`.

**Kịch bản nhóm sợ nhất khi demo:** #2 — AI trích một mã đoạn **có thật** nhưng thuộc phần khác. Nó **trông đúng**: có ngoặc vuông, có mã đúng định dạng, giám khảo không đối chiếu cây thì không thấy. Lỗi bịa hẳn còn dễ bắt hơn. Đây cũng chính là 3/4 lượt trượt của ngưỡng #1.

**Độ phủ theo lớp — khai thật.** Guide §2.6 đòi **≥2 case cho mỗi lớp** trong golden set:

| Lớp | Phủ bởi | Đạt yêu cầu? |
|---|---|---|
| ① Nguồn sự thật | **không có case nào trong `eval/cases.json`** — lớp này đo bằng suite khác (`grounding.py`, 20 lượt AI thật) | ~ đo được, nhưng **không nằm trong golden set** như guide yêu cầu |
| ② Mơ hồ / thiếu thông tin | C04 · C08 · C09 · C10 · C12 · C18 · C19 · C20 | ✓ |
| ③ Ngoài phạm vi / thẩm quyền | **không có case nào** | ✗ **thiếu phép đo** — ràng buộc *có* trong prompt (`chat_prompts.py` quy tắc 3) và phạm vi *có* nêu ở màn đầu, nhưng chưa có case nào kiểm nên chưa biết nó có thật sự chặn được không |
| ④ Đặc thù domain | C06 · C07 · C13 · C14 · C15 · C17 · C21 · C22 | ✓ |

Lớp ③ là lỗ hổng lớn nhất — nhưng là lỗ hổng **đo lường**, không phải lỗ hổng hiện thực: luồng chat tồn tại (`/ai/chat/message`) và prompt có cấm bịa ngoài tư liệu, song **chưa có case nào kiểm xem ràng buộc đó có giữ được khi bị hỏi xoáy hay không**. Một dòng trong prompt chưa phải là một hành vi đã được chứng minh.

## §6. Bốn đường đi của trải nghiệm

Năm đường đầu đã bấm được trong `mockup/`; đường ③ mới có ràng buộc ở backend, **chưa có phép đo và chưa nối vào trang** (§7.5).
- **Happy path:** làm 5 câu → sai 2 câu cùng chương → chọn "Tìm phần nền bị hổng" → vòng chẩn đoán ở mục cha → khoanh được chỗ hổng → 1–2 mục ôn + trang slide + dấu vết quyết định.
- **Low-confidence (②):** không có câu sai nhưng có câu **đúng mà chậm (>25s)** → hệ thống nói rõ "không có câu sai, lấy câu trả lời chậm làm tín hiệu" rồi mới hỏi thêm, không phán ngay; câu sai **dưới 3s** bị gắn cờ "có thể bấm bừa" thay vì coi là hổng chắc chắn.
- **Failure / không căn cứ (①):** hai tầng chặn. *(a)* Luật không gom được tín hiệu về node nào → màn **`Refuse`** nói rõ vì sao chưa đủ căn cứ, không chẩn đoán bừa (§5 #5, #6). *(b)* AI trả về nội dung trích sai phạm vi hoặc sai khung → `scripts/validate.py` bắt được, và khi API chết/429 thì trang **hiện thẳng lý do** (kể cả "đang bị giới hạn tốc độ") rồi rơi về text mock, **không** im lặng đưa nội dung rỗng.
- **Correction:** "↻ Làm lại vòng này" và "Mình tự ôn được" — học viên bác bỏ chẩn đoán được; lựa chọn đó ghi vào dấu vết, lần làm lại không xoá lịch sử.
- **Ngoài phạm vi (③) — có ràng buộc, chưa có bằng chứng:** phạm vi được nêu ở màn đầu (*một bài giảng, cây 30 concept*) kèm badge nguồn dữ liệu, và `chat_prompts.py` quy tắc 3 cấm AI bịa kiến thức ngoài tư liệu được cấp. Nhưng **chưa có case nào kiểm** ràng buộc đó, và **trang mock chưa nối endpoint chat** — nên đường này hiện chỉ tồn tại ở backend, chưa bấm được trong demo (§7.5).
- **Đặc thù domain (④):** nhiều câu sai gom về **node cha chung** và chỉ chẩn đoán nhánh nhiều tín hiệu nhất, thay vì liệt kê hết; chạm gốc hoặc quá 3 vòng thì chuyển sang "học lại cả bài" kèm compact 3 ý.

## §7. Kiểm thử

### 7.1 Bảy ngưỡng — chốt tại CP4, không sửa sau mốc này

Nguyên tắc đặt ngưỡng: **hỏi "sai thì ai chịu gì"**, rồi neo con số vào một số liệu có thật (mining §1 · nghiên cứu §3 · ràng buộc kỹ thuật), **không** nhìn kết quả rồi chỉnh cho vừa.

| # | Chiều | Định nghĩa kiểm chứng được | Đo bằng | **Ngưỡng** | Neo vào đâu |
|---|---|---|---|---|---|
| 1 | **Dẫn nguồn đúng** | mọi mã đoạn AI trích ra có thật trong cây, **và** nằm trong phần tư liệu đã cấp cho lượt đó | `scripts/grounding.py` | **≥90%** | Tutor hiện tại **33% câu trả lời không trích nguồn** (§1 #7). Sản phẩm lấy provenance làm lõi (rubric C1: 25%, trọng số lớn nhất) mà chỉ ngang tutor thì vô nghĩa → ngưỡng = **giảm tỉ lệ không truy nguồn được còn 1/3: 33% → ≤10%** |
| 2 | **Định vị đúng chỗ hổng** | node hệ thống chọn để chẩn đoán **và** kết luận cuối (`scenario` + `gap` + `ceiling`) trùng nhãn nhóm gán tay | `scripts/run.py` | **≥90%** | ALEKS cần **20–30 câu** trên cây hàng nghìn kỹ năng (§3). Ta có **14 câu** (5 quiz + tối đa 3 vòng × 3 câu nền) trên cây **30 node** — nhiều câu hỏi trên mỗi node hơn ALEKS khoảng 30 lần. Bài toán nhỏ hơn nhiều nên không có cớ đặt bar thấp |
| 3 | **Từ chối đúng lúc** | tín hiệu không đủ → phải trả về "chưa đủ căn cứ"; tín hiệu đủ → không được từ chối | `scripts/run.py` | **100%** phải từ chối khi thiếu · **≤10%** từ chối thừa | Tutor hiện tại **không bao giờ tuyên bố đã định vị được chỗ hổng** (probing **0,2%**, §1 #1). Chẩn đoán sai là **thêm một kiểu hỏng mà hiện trạng không có** — tệ hơn im lặng. Từ chối thừa chỉ gây phiền → nới |
| 4 | **Hữu ích** | người **chưa đọc tài liệu** vẫn hiểu · giải thích phương án sai **bằng nội dung** (không phải "tư liệu không đề cập") · có hành động rõ | LLM mạnh hơn chấm + người chấm | **≥70%** | Neo vào **29% quay lại hỏi thêm về cùng một mục ở một dịp khác** (§1 #3). Lời khuyên dùng được ≥70% số lượt thì tỉ lệ phải quay lại **không tệ hơn hiện trạng**. Dưới 70% = thay một thứ dở bằng thứ dở hơn |
| 5 | **Nối được giữa các vòng** | **người chấm** xác nhận: vòng sau bám node vòng trước · không hỏi lại thứ đã hỏi · không kết luận hổng ở node vừa trả lời đúng | `scripts/review_rounds_ui.py` | **≥80% số phiên** | Đơn vị là **cả phiên**, không phải từng vòng: `MAX_ROUNDS = 3` → một phiên có **2 mối nối**, 80% mỗi mối chỉ ra **0,8² = 64%** phiên liền mạch. Tính theo vòng thì số đẹp mà phiên vẫn gãy. Đây đúng là bệnh của Khanmigo (§3) |
| 6 | **Hai người chấm khớp nhau** | hai thành viên chấm độc lập **cùng 5 output**, tỉ lệ trùng kết luận | `scripts/review_summary.py` | **≥80%** | Ngưỡng của guide §2.6 (*lệch từ ~20% số case là định nghĩa chưa đủ rõ*). Chưa đạt mức này thì **số ở #4 và #5 không dùng được** — trong nhóm còn chấm khác nhau thì không chấm được ai |
| 7 | **Thời gian chờ** | thời gian từ lúc bấm đến lúc có nội dung AI | đồng hồ trong trang mock | trung vị **≤5s** · p90 **≤10s** | Tutor hiện tại: trung vị **4,6s**, p90 **7,7s** (số của data pack). Học viên **đã quen mức đó**; chậm hơn hẳn là thấy tệ hơn dù nội dung tốt hơn. *Cảnh báo: `reply_ms` hai kỳ đo bằng hai nguồn khác nhau — chỉ so xu hướng, không so tuyệt đối* |

**Điều kiện cứng (không phải ngưỡng %, chỉ có đạt/không):** **0 lượt bịa mã đoạn không tồn tại trong cây.** Tutor sai cách trình bày thì còn kiểm lại được; bịa nguồn thì học viên **không có cách nào biết** — và 0,3% lượt có rating (§1 #8) nghĩa là không ai báo lỗi cho ai cả. Một lượt cũng là trượt.

**Ba ngưỡng đang đặt CAO HƠN kết quả đã biết** (#1: 90% > 80% · #4: 70% > 55% · #6: 80% > chưa có số nào). Nếu nhóm đặt bar cho vừa kết quả thì đã đặt 75% và 50%.

**Một giả định chưa có neo — khai thẳng:** `SLOW_SEC = 25` (đúng nhưng chậm) và `RUSH_SEC = 3` (sai mà nhanh = bấm bừa) là **nhóm tự nghĩ ra**. Data pack có thời gian *tutor trả lời*, không có thời gian *học viên làm quiz*, nên hai con số quyết định toàn bộ tín hiệu đầu vào này **không dựa trên dữ liệu nào**. Đây là lỗ hổng thật nhất của spec — xem 7.5.

### 7.2 Golden set

**26 case** trong `eval/cases.json` — mỗi case là một hồ sơ trả lời **giả** (không phải học viên thật): 5 câu quiz dạng `[phương án đã chọn, số giây]`, kèm nhãn kỳ vọng và **lý do gán nhãn**.

| Cơ cấu | Số case |
|---|---|
| Tính vào tỉ lệ đạt | **22** |
| — chỉ đo bước định vị (`expect.target`) | 12 |
| — đo cả chuỗi leo cây (`expect.final`) | 10 |
| — trong đó kỳ vọng hệ thống **từ chối chẩn đoán** | 3 |
| `xfail` — viết theo **giả định nhóm muốn hệ thống đạt**, tính năng chưa build | **4** (C23–C26) |

- Nhãn gán tay theo cây tri thức, **gán trước khi chạy code**, không lấy từ output.
- Bốn case `xfail` liệt kê riêng như backlog, **không** tính vào tỉ lệ — viết theo lối *"hệ thống nên làm gì"*, không phải *"hệ thống đang làm gì"*.
- Chạy: `python scripts/run.py` → `eval/results.md`.
- **Chống trôi:** `run.py` kiểm **vân tay bộ câu hỏi** (node + đáp án). Đổi quiz mà quên gán nhãn lại thì bộ đo **dừng và báo đỏ**, không âm thầm xanh.
- `node scripts/smoke.js` dựng trang đúng thứ tự script như trình duyệt rồi render một lần — chốt chặn lỗi trắng trang trước demo.
- `python scripts/parity.py` so **ba bản luật** (backend · bộ đo · trang mock) trên cùng bộ case; lệch một case là dừng. Không có nó thì số đo trôi khỏi cái chạy thật trên sân khấu.

### 7.3 Trạng thái từng ngưỡng tính đến CP4

| # | Ngưỡng | Số đang có | Đối chiếu |
|---|---|---|---|
| 1 | ≥90% | **16/20 = 80%** | ✗ **chưa đạt** — thiếu 2 lượt |
| 2 | ≥90% | **22/22 = 100%** | ✓ đạt — nhưng trên bộ case **nhóm tự soạn** |
| 3 | 100% / ≤10% | 3/3 case thiếu tín hiệu đều từ chối · 0 case từ chối thừa | ✓ đạt trên 3 case — **quá ít để kết luận** |
| 4 | ≥70% | **11/20 = 55%** | ✗ **chưa đạt** — cách xa nhất |
| 5 | ≥80% số phiên | **4/5 = 80%** (1 người chấm) | ~ **chạm đúng mức nhưng chưa tính** — cần người thứ hai (xem #6) |
| 6 | ≥80% | **chưa có** | ✗ **chưa đo** — xem 7.5 |
| 7 | trung vị ≤5s | **chưa có** | ✗ **chưa đo** |
| — | 0 bịa mã đoạn | **0/20** | ✓ đạt |

Hai ngưỡng trượt (#1, #4) và ba ngưỡng chưa đo (#5 chưa tính được, #6, #7). Theo guide §4.1: *không đạt quality bar nhưng phân tích được nguyên nhân vẫn tính đủ điểm* — phân tích ở 7.4.

### 7.4 Các lượt chạy và phân tích

**Luật chẩn đoán**

| Lượt | Ngày | Kết quả | Ghi chú |
|---|---|---|---|
| R0 (baseline) | 18/9 | **17/20 = 85%** | Cây mock tự nghĩ, luật chưa có tiền đề, chưa biết từ chối chẩn đoán |
| R1 | 18/9 | **20/20 = 100%** | Cây dựng lại từ transcript thật + 2 luật mới |
| R2 | 18/9 | **22/22 = 100%** | Thêm case, tách 4 case `xfail` ra khỏi tỉ lệ |

R0 để lộ 3 lỗ hổng (**C07** thiếu cạnh `prereq` · **C09** và **C10** chưa biết từ chối chẩn đoán), cả ba đã sửa — xem §9.

100% là con số của **chính bộ case nhóm tự soạn**. Nó chứng minh luật khớp đặc tả của nhóm, **không** chứng minh đặc tả đúng — đó là việc của #6.

**Dẫn nguồn — 20 lượt qua endpoint thật** (`gemini-3.5-flash-lite`, `POST /ai/plan/generate`, đóng băng ở `eval/grounding.json`): **16/20 = 80%**, dưới ngưỡng #1.

4 lượt trượt: **3 lượt trích mã đoạn ngoài phạm vi tư liệu được cấp** — cả ba rơi vào kịch bản *"học lại cả bài"*, nơi tư liệu cấp rộng nhất nên mô hình dễ với sang đoạn bên cạnh; **1 lượt câu tự kiểm sai định dạng**. **Không lượt nào bịa mã đoạn không tồn tại** → điều kiện cứng vẫn giữ.

*Nguyên nhân:* lỗi tập trung ở một kịch bản duy nhất, không rải đều → đây là lỗi **phạm vi tư liệu cấp cho prompt**, không phải lỗi mô hình bịa. Hướng sửa (sau CP4, không kịp trong mốc này): thu hẹp tư liệu cấp cho kịch bản `nen_bai`.

**Hữu ích — 11/20 = 55%**, cách ngưỡng #4 xa nhất. Chấm bằng LLM mạnh hơn, chưa có người chấm.

Chín lượt trượt cho thấy **ràng buộc chống bịa đang siết quá tay** — AI giữ an toàn bằng cách bám chữ trong tư liệu, nên lúc cần *giảng* thì chỉ *trích*:

| Nhóm lỗi | Số lượt | Ví dụ |
|---|---|---|
| Viện dẫn tài liệu thay cho giải thích | 4 | *"sai vì tư liệu không đề cập đến..."* |
| Mức "học lại cả bài" rỗng ruột | 4 | chỉ liệt kê tên chương + 3 gạch đầu dòng, câu tự kiểm thành thủ tục |
| Né trả lời thứ luật tự suy được | 1 | *"tư liệu chưa nói rõ về thứ tự nên ôn lại"* |

*Đây là đánh đổi giữa hai ngưỡng, không phải hai lỗi rời nhau:* #1 và điều kiện cứng đẩy prompt về phía trích dẫn, #4 kéo về phía giảng giải. Nới ràng buộc để đạt #4 gần như chắc chắn kéo #1 xuống. Cùng nhau chúng định nghĩa bài toán thật của sản phẩm.

**Các phép đo phụ trợ** (không phải ngưỡng, dùng để trả lời hỏi đáp):

| Phép đo | Kết quả | Đo gì |
|---|---|---|
| Đồng bộ ba bản luật (`scripts/parity.py`) | **26/26** | backend · bộ đo · trang mock cho cùng kết quả |
| Chuỗi nhiều vòng — **máy** (`scripts/multiround.py`) | **5/5** | mỗi vòng bám đúng node · không lặp vòng trước (Jaccard) · không kết luận hổng ở node vừa đúng |
| Endpoint (`scripts/api_smoke.py`) | **17/17** | 11 endpoint + 2 phép thử luật qua HTTP |
| Khung câu trả lời (`scripts/validate.py`) | **17/20** | đếm trích dẫn · đúng một dòng `Tự kiểm:` · độ dài |

Chênh **5/5 máy vs 4/5 người** ở chuỗi nhiều vòng là lý do ngưỡng #5 **giao cho người chấm, không cho máy**: máy chỉ đo được độ trùng từ, không đo được "nội dung có tiến triển không".

### 7.5 Tự khai — phần chưa xong tại CP4

| Chỗ chưa xong | Trạng thái thật | Ảnh hưởng tới ngưỡng nào |
|---|---|---|
| **Hai người chấm độc lập** | `eval/review/` có 2 file nhưng **cùng một người** (`duy`, `duy2`) và **cả hai gắn hash câu trả lời cũ** → bị đánh dấu lạc hậu, bị loại khỏi tổng hợp. Thực chất **0/20 đã chấm hợp lệ** | #6 chưa đo được; kéo theo #4 và #5 chưa có xác nhận của người |
| **Trang mock chỉ nối 1/4 route AI** | Chỉ `POST /ai/plan/generate` là AI thật. Nút *"✨ AI phân tích câu này"* và *"Nhận xét vòng này"* chạy **text mock**; `/ai/explain/*`, `/ai/diagnosis/*`, `/ai/chat/*` có ở backend nhưng trang **không gọi**. Vì vậy §4 khai mức **Mock**, không phải Working | #7 chưa đo được trên đường AI #1 |
| **Quiz chỉ chạm 5/30 node** | 5 câu map vào 5 lá (`l_quantinh`, `l_boctach`, `l_dungcaisai`, `l_phanky`, `l_hoitu`) nằm dưới 3 node cha. **25 node còn lại không có đường nào chạm tới** — hệ thống chỉ chẩn đoán được một góc cây | Trần trên của #2 và #3: 100% là 100% *trong phạm vi 5 lá đó*. Đang mở rộng ngân hàng câu hỏi ở phía backend |
| **Cây do mô hình sinh, một người chốt** | 30 node · 5 cạnh `prereq` · `conf` (26 node 0,9 · 6 node 0,7) đều chưa qua người thứ hai đối chiếu với transcript | Toàn bộ chuyện provenance (rubric 25%) dựa trên phép ánh xạ node → mã đoạn chưa được kiểm chéo |
| **`SLOW_SEC=25` · `RUSH_SEC=3`** | Nhóm tự nghĩ, không có dữ liệu nào chống lưng — data pack không ghi thời gian học viên làm quiz | Quyết định toàn bộ tín hiệu đầu vào của #2 và #3. Nếu hai số này sai thì 100% của #2 cũng không cứu được |
| **Log khảo sát** | Đã khảo sát **n=31**, đạt ngưỡng ≥20 người, nhưng trong repo mới có **bản tổng hợp biểu đồ**, chưa có log từng câu trả lời nguyên văn như guide §1.3 đòi | Chuẩn A chưa trọn vẹn — cần xuất CSV của Google Form vào `validation/` |
| **Đường chat ngoài phạm vi (lớp ③)** | Ràng buộc **có** trong `chat_prompts.py` (quy tắc 3), nhưng **không case nào kiểm** và **trang mock chưa nối** `/ai/chat/message` | Lớp ③ của §5 chưa có phép đo; không demo được đường này |
| **4 case `xfail` C23–C26** | Tính năng chưa build: engine không mang lịch sử vòng · trạng thái sau retest chưa vào phần tư vấn · prompt không nhận từng câu nền đã sai · resume chưa có case kiểm | Không tính vào #2; là backlog §8 |
| **Sinh câu hỏi nền có điều kiện** | Chưa làm (§4). `PROBES` là bộ câu **tĩnh chung cho cả node cha** | Làm #2 và #3 kém chắc chắn hơn con số 100% thể hiện — xem §4 |
| **Case từ chatlog thật** | Guide §2.6 đòi **≥10/20 case lấy hoặc phát triển từ chatlog thật**; cả 26 case hiện tại đều là hồ sơ nhóm tự dựng. `eval/human/` còn rỗng | Bộ case chưa đạt cơ cấu guide yêu cầu |

## §8. Phân công & kế hoạch

| Thành viên | MSHV | Mảng |
|---|---|---|
| Lê Anh Duy | 2A202602723 | `TODO` |
| Lê Quang Thành | 2A202602647 | `TODO` |
| Nguyễn Thị Phương Duyên | 2A202603001 | `TODO` |
| Đào Trọng Khang | 2A202602974 | `TODO` |

- Willing users (≥2 tên): `TODO` — khai từ CP1.
- Multi-prototype: không làm.

## §9. Changelog

| Thời điểm | Đổi gì | Vì sao |
|---|---|---|
| 17/9 | Dựng khung spec: chốt track C1 / hướng adaptive-first / lát cắt / stack (React + FastAPI + Gemini OpenAI-compatible) | Init repo |
| 17/9 | Mock CP2 (`mockup/`): quiz mỗi màn một câu, cho bỏ qua, **đếm giờ từng câu** và dùng thời gian làm tín hiệu (`slow` / `rush`) | Đúng/sai thôi thì không phân biệt được "biết chắc" với "đoán trúng" |
| 17/9 | Hệ thống **không tự leo tầng**: hết mỗi vòng dừng lại cho học viên chọn đi tiếp / làm lại / tự ôn | Tự nhảy vòng là tước quyền quyết định của học viên, và giám khảo không thấy được chỗ nào do người chọn |
| 18/9 | Quiz đổi 2 câu để có cặp câu cùng node cha (l_ctx, l_vec) | Bộ 5 câu cũ mỗi câu một node cha khác nhau → luật "gom tín hiệu về cha chung" không bao giờ chạy, không đo được |
| 18/9 | Tách luật chẩn đoán ra `mockup/engine.js`, dùng chung cho demo và `eval/` | Nếu bộ đo chép lại luật thì số đo sẽ trôi khỏi cái đang chạy thật |
| 18/9 | Chạy golden set R0: 17/20 (85%), lộ 3 lỗ hổng C07/C09/C10 | Xem `eval/results.md` |
| 18/9 | **Dựng lại cây từ `transcript-01-clean.md`** (30 node, provenance = mã đoạn `[T01-NNN]`, có `conf`), bỏ cây tự nghĩ | Cây cũ ghi số trang slide mà chưa đối chiếu file thật — trích dẫn bịa là mất điểm nặng nhất của đề (25% content/provenance) |
| 18/9 | Thêm cạnh **`prereq`** tách khỏi quan hệ mục lục | Đề liệt kê `prerequisite` và `broader/narrower` là hai loại cạnh khác nhau; lát cắt của nhóm nói "prerequisite" nên không được lấy mục lục thay thế |
| 18/9 | Luật **từ chối chẩn đoán** khi tín hiệu toàn `rush`, hoặc `slow` mà tản mát | Đoán bừa một mục còn tệ hơn nói "chưa đủ căn cứ" — cũng là yêu cầu *uncertainty rõ ràng* của đề |
| 18/9 | `run.js` kiểm tra **vân tay bộ câu hỏi** | Case gắn theo vị trí câu hỏi; đổi quiz mà quên gán nhãn lại thì số đo vẫn xanh nhưng vô nghĩa |
| 18/9 | Mining chatlog: 65% hỏi lại cùng một phần · 11% quay về buổi cũ · 28% câu trả lời không trích nguồn | Gỡ `TODO` evidence ở §1 bằng số thật |
| 18/9 | Nối Gemini qua backend; đo 20 lượt: **16/20 có căn cứ**, nhưng chỉ **11/20 hữu ích** | Số đo đầu tiên có AI thật. Hai chuẩn cho hai thứ khác nhau — có căn cứ không đồng nghĩa dạy được |
| 18/9 | Thêm **S5 · chuỗi nhiều vòng** (5 phiên, AI nhận xét từng vòng) | Trước đó không phép đo nào chạm tới `/ai/explain/round`, tức cơ chế trung tâm chưa từng được đo |
| 18/9 | Bản chấm tay gắn theo **hash câu trả lời**, đổi nội dung là nhận xét cũ hết hiệu lực | Nhận xét cho bản cũ lặng lẽ dính vào bản mới thì số đo thành sai |
| 18/9 | **Đếm lại toàn bộ evidence §1 bằng `scripts/mining.py`.** Ba số cũ sai bị thay: *65% hỏi lại cùng một phần* → **29%** (cũ đếm theo **tin nhắn**: 7,3 tin/người nên hầu như ai cũng đạt "≥2 tin", con số không thể sai nên không chứng minh gì; lại không loại câu mẫu) · *11% quay lại buổi trước* → **bỏ** (suy từ `lecture_code` giữa các khoá khác nhau, đếm chặt còn 5% và quote thu về toàn câu vô nghĩa) · *15% câu hỏi ôn/học lại* → **2,3%** và hạ xuống mức minh hoạ | Bản cũ không có script trong repo nên không ai kiểm lại được. Nay luật đếm khai trong file, có `--selftest` |
| 18/9 | Thêm **khảo sát n=31** (chuẩn A) vào §1 | Mining chứng minh pain tồn tại; khảo sát chứng minh học viên muốn nó được giải |
| 18/9 | Bỏ mệnh đề *"chỗ hổng thường nằm ở prerequisite"* khỏi §1 | Không có bằng chứng nào chống lưng. Sản phẩm **kiểm** giả thuyết đó cho từng người và có ba đường ra phủ định (§4) |
| 18/9 | Bốn file prompt đang bảo AI trích **số trang slide** → đổi sang **mã đoạn** `[T01-NNN]` | Chính §0 định nghĩa số trang slide là trích dẫn bịa; ví dụ mẫu trong prompt đang mời mô hình bịa |
| 18/9 | Hạ mức prototype từ **Working** xuống **Mock** | Trang mock mới nối 1/4 route AI — khai đúng hơn khai vống |
| 17/9 | Tách **AI #1 giải thích đáp án** khỏi **AI #2 chẩn đoán nền**; AI #1 gọi được ở từng câu, từng vòng, hoặc cả bài | Hai câu hỏi khác nhau ("sai cái gì" vs "vì sao sai"); nhiều học viên chỉ cần cái thứ nhất |
