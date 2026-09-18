# AI SPEC — Chẩn đoán lỗ hổng prerequisite từ quiz ngắn · Nhóm ColdBrew · Phòng E402

**Track:** C · Lesson Studio — **đề C1 · Knowledge-to-Lesson** (graph tri thức + bài học thích ứng)
**Hướng triển khai C1:** [x] Adaptive-first  [ ] Graph-first  [ ] End-to-end
→ tự dựng graph nhỏ **15–30 concept từ slide `data/vlearn-pack/slides/d1`, d2** và **ghi rõ là tự dựng** (đề không cấp graph mẫu).
**Loại:** [x] Tính năng mới  [ ] Tối ưu tính năng có sẵn

> Trạng thái: **bản CƠ BẢN (khung)**. Các mục đánh dấu `TODO` cần bằng chứng thật trước CP4.

---

## §0. Stack & kiến trúc (chốt)

| Lớp | Chọn | Ghi chú |
|---|---|---|
| Frontend | React + Vite | `codebase/frontend` |
| Backend | Python FastAPI | `codebase/backend` |
| AI provider | **Gemini** qua **endpoint tương thích OpenAI** | SDK `openai`, `base_url=https://generativelanguage.googleapis.com/v1beta/openai/`, model mặc định `gemini-2.5-flash` |
| Lưu trữ graph + learner state | JSON file (`eval/`, `codebase/backend/data`) | đủ cho 15–30 concept; không dựng graph DB |

Vì sao OpenAI-compatible: đổi provider chỉ sửa `base_url` + `MODEL`, không sửa code — phòng khi rate-limit lúc demo.

Bản mock CP2: `mockup/` — HTML tĩnh + React qua CDN, **chưa gọi AI**, chạy được trên GitHub Pages. Sơ đồ luồng và quy tắc chẩn đoán: `mockup/flow.md`.

**Cây tri thức (nhóm tự dựng, đề không cấp graph mẫu):** 30 node dựng tay từ `data/vlearn-pack/transcript/transcript-01-clean.md` — *Day 2 (sáng) · Xác định bài toán kinh doanh cho AI*, 89 đoạn `[T01-001…089]`. Mỗi node mang `file` · `span` (mã đoạn) · `conf` (0.9 nói thẳng trong đoạn · 0.7 nhóm từ nhiều đoạn) và cạnh `prereq` tách riêng khỏi quan hệ mục lục. Slide d2 **chưa đối chiếu trang nên không ghi số trang** — thà thiếu còn hơn trích sai. Repo **không chứa data pack**, chỉ trích mã đoạn.

---

## §1. User & Job

- **Job executor:** học viên AI20k đang học một chương (ví dụ Day 1 — AI & LLM Foundation), làm quiz ôn tập rồi tự hỏi "sai chỗ này thì phải học lại cái gì".
- **Core JTBD:** *Khi tôi làm sai vài câu trong bài ôn, tôi muốn biết chính xác mình hổng khái niệm nền nào và học lại đúng phần đó, để không phải đọc lại cả chương.*
- **Problem statement (không chữ AI):** Học viên làm quiz xong chỉ biết "đúng 3/5". Bài ôn được phát theo một lộ trình tuyến tính giống nhau cho mọi người, trong khi mỗi người hổng ở concept khác nhau — và cái hổng thật thường nằm ở **prerequisite** chứ không phải ở concept của câu hỏi. Hậu quả: học viên đọc lại cả chương hoặc bỏ qua, lỗ hổng nền tích lại sang ngày sau.
- **Evidence (chuẩn B · mining `data/vlearn-pack/chatlog/tutor_turns.csv`):** 13.494 turn tổng · K4: 3.097 turn / 448 học viên · course K4P1: **2.146 turn / 293 học viên**. 97% câu hỏi K4P1 mang sẵn nhãn vị trí học `(Đang học phần “…”)`, nên đếm được theo từng phần:

  | Chỉ số | Kết quả | Ý nghĩa |
  |---|---|---|
  | Học viên hỏi **≥2 lần trong cùng một phần học** | **189/293 = 65%** (≥3 lần: 132 = 45%) | quay vòng tại chỗ, hỏi rồi vẫn chưa thoát |
  | **Quay lại hỏi về buổi trước** sau khi đã sang buổi mới | 31/293 = **11%** | dấu hiệu hổng phần nền |
  | Câu hỏi mang ý *"ôn / học lại / chưa hiểu"* | 331/2.146 = **15%** | học viên tự biết mình hổng nhưng không biết hổng đâu |
  | Câu trả lời tutor **không có trích dẫn nguồn** | 3.781/13.494 = **28%** | nội dung không truy ngược được |

  Quote (mã turn, không dán nguyên văn dài):
  - **[T10291]** *"Dựa trên tiến độ của mình, mình nên ôn phần nào trước?"* — học viên thật hỏi đúng câu sản phẩm này sinh ra để trả lời
  - **[T10317]** *"giải thích lại dc không hơi khó hiểu"*
  - `TODO` bổ sung ≥3 quote nữa + script mining vào `eval/evidence/`

## §2. Impact & quyết định chọn

`TODO` — bảng ≥3 ứng viên (bao nhiêu người · tần suất · tốn gì mỗi lần · khả thi). Khung ứng viên đang cân nhắc:

| Ứng viên | Mô tả | Trạng thái |
|---|---|---|
| A. Sinh quiz có dẫn trang nguồn cho giảng viên | graph-first | loại — `TODO` lý do bằng số |
| B. Graph explorer + provenance QA | graph-first | loại — `TODO` |
| **C. Chẩn đoán prerequisite từ quiz sai → lộ trình ôn có giải thích** | adaptive-first | **CHỌN** — `TODO` lý do bằng số |

## §3. Giải pháp tương tự đã nghiên cứu

`TODO` — dự kiến: Khan Academy (mastery + prerequisite tree), Duolingo (spaced repetition/strength), VLearn Tutor hiện tại. Mỗi cái: flow / đáng học / đáng né / mình khác gì.

## §4. Thiết kế

- **Lát cắt MỘT CÂU:** *Một học viên làm quiz ngắn 5 câu · hệ thống chấm và phân tích các câu sai để xác định concept còn yếu và prerequisite bị hổng · trả về đúng phần nội dung cần ôn kèm lời giải thích vì sao học viên nhận lộ trình đó.*
  - 1 user: học viên · 1 việc: ôn sau khi làm sai · 1 quyết định AI: chọn concept/prerequisite để remediate · 1 kết quả: lộ trình ôn 1–3 mục + giải thích + trích nguồn slide.
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

- **Mức prototype:** [ ] Sketch [ ] Mock [x] Working
  - Thật: chấm quiz, tín hiệu theo thời gian trả lời, suy luận prerequisite trên graph (rule), LLM viết lời giải thích + gợi ý ôn, provenance (slide/trang), resume phiên.
  - Mock: graph tự dựng tay; nội dung ôn là trích dẫn slide có sẵn; learner state lưu file JSON.
  - Đã có ở CP2 (`mockup/`, mock data): toàn bộ luồng bấm được, cây tri thức, dấu vết quyết định, provenance, resume bằng `localStorage`.
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

## §5. Kiểu lỗi — 4 lớp chỗ khó (≥8 kịch bản)

`TODO` — bảng đầy đủ. Khung theo 4 lớp:

| Lớp | Kịch bản dự kiến |
|---|---|
| ① Nguồn sự thật | LLM giải thích bằng concept không có trong graph · trích sai trang slide |
| ② Mơ hồ / thiếu thông tin | chỉ sai 1/5 câu, không đủ tín hiệu · sai do bấm nhầm/đoán mò |
| ③ Ngoài phạm vi | học viên hỏi nội dung ngoài chương đã dựng graph |
| ④ Đặc thù domain | một khái niệm nhiều tên gọi (embedding/vector hoá) · hai câu sai trỏ về cùng một prerequisite gốc |

## §6. Bốn đường đi của trải nghiệm

Đã hiện thực trong mock CP2 (trừ hai dòng còn `TODO`):
- **Happy path:** làm 5 câu → sai 2 câu cùng chương → chọn "Tìm phần nền bị hổng" → vòng chẩn đoán ở mục cha → khoanh được chỗ hổng → 1–2 mục ôn + trang slide + dấu vết quyết định.
- **Low-confidence (②):** không có câu sai nhưng có câu **đúng mà chậm (>25s)** → hệ thống nói rõ "không có câu sai, lấy câu trả lời chậm làm tín hiệu" rồi mới hỏi thêm, không phán ngay; câu sai **dưới 3s** bị gắn cờ "có thể bấm bừa" thay vì coi là hổng chắc chắn.
- **Failure / không căn cứ (①):** `TODO` khi nối AI — nếu không map được câu sai về node nào, hiện "chưa xác định được" và trỏ về nội dung chương, không bịa concept ngoài cây.
- **Correction:** "↻ Làm lại vòng này" và "Mình tự ôn được" — học viên bác bỏ chẩn đoán được; lựa chọn đó ghi vào dấu vết, lần làm lại không xoá lịch sử.
- **Ngoài phạm vi (③):** `TODO` — hiện mới nêu phạm vi ở màn đầu (một bài giảng); cần câu trả lời rõ khi học viên hỏi nội dung ngoài cây.
- **Đặc thù domain (④):** nhiều câu sai gom về **node cha chung** và chỉ chẩn đoán nhánh nhiều tín hiệu nhất, thay vì liệt kê hết; chạm gốc hoặc quá 3 vòng thì chuyển sang "học lại cả bài" kèm compact 3 ý.

## §7. Kiểm thử

- **Chiều chất lượng:** (1) *Chẩn đoán đúng* — node hệ thống chọn để chẩn đoán, và kết luận cuối sau khi leo cây, trùng với nhãn nhóm gán tay cho từng hồ sơ trả lời. (2) *Có căn cứ* — mọi mục ôn trỏ được về slide/trang có thật. (3) *Giải thích hợp lệ* — lời giải thích chỉ nhắc concept có trong cây.
- **Golden set:** **20 case** trong `eval/cases.json` — mỗi case = 5 câu trả lời (phương án + số giây) của một hồ sơ học viên **giả**, kèm nhãn kỳ vọng (node cần chẩn đoán, kết luận cuối) và lý do gán nhãn. 10 case chỉ đo bước định vị, 8 case đo cả chuỗi leo cây, 3 case kỳ vọng hệ thống **từ chối chẩn đoán** vì tín hiệu không đủ.
  - Nhãn gán tay theo cây tri thức, **không lấy từ output của code**.
  - Chạy: `node eval/run.js --write` → `eval/results.md`. Bộ eval dùng **chung file luật** `mockup/engine.js` với trang demo nên số đo là số của đúng cái chạy trên sân khấu.
  - **Chống trôi:** `run.js` kiểm tra vân tay bộ câu hỏi (node + đáp án). Đổi quiz mà quên gán nhãn lại thì bộ đo **dừng và báo đỏ**, không âm thầm xanh.
  - `node eval/smoke.js` dựng trang đúng thứ tự script như trình duyệt rồi render một lần — chốt chặn lỗi trắng trang trước khi demo.
- **Quality bar** *(đề xuất — chốt tại CP4 21:00 18/9)*: "Đạt khi **≥90% case** của golden set ra đúng node chẩn đoán và đúng kết luận cuối, **và 100%** mục ôn đề xuất trỏ được về slide/trang có thật."
  - Khai báo trung thực: bar này đặt **sau** lượt chạy baseline R0 dưới đây (85%), và đặt cao hơn R0 để buộc sửa hai lỗ hổng đã lộ ra, chứ không hạ chuẩn cho vừa kết quả.
- **Kết quả các lượt chạy:**

  | Lượt | Ngày | Kết quả | Ghi chú |
  |---|---|---|---|
  | R0 (baseline) | 18/9 | **17/20 = 85%** | Cây mock tự nghĩ, luật chưa có tiền đề, chưa biết từ chối chẩn đoán |
  | R1 | 18/9 | **20/20 = 100%** | Cây dựng lại từ transcript thật + 2 luật mới bên dưới |

  R0 để lộ 3 lỗ hổng, cả ba đã sửa bằng chính dữ liệu thật:
  - **C07** — tín hiệu ở cả tiền đề lẫn node phụ thuộc, luật cũ chọn theo *số tín hiệu nhiều nhất*. Sửa bằng **cạnh `prereq`** trong cây (c3s1 ← c1s1): node được chọn mà tiền đề của nó cũng có tín hiệu thì **xuống tiền đề trước**.
  - **C09** — chỉ có câu chậm, tản mát mỗi mục một câu → nay **từ chối chẩn đoán**, nói rõ "chưa đủ căn cứ".
  - **C10** — câu sai duy nhất bấm dưới 3s → nay **từ chối chẩn đoán**, đề nghị hỏi lại câu đó trước.

  100% là con số của **chính bộ 20 case nhóm tự soạn** — chưa có case do người ngoài gán nhãn, nên chưa kết luận được là luật tổng quát tốt. Case chạy thật đang thu (`eval/human/`).

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
| 17/9 | Tách **AI #1 giải thích đáp án** khỏi **AI #2 chẩn đoán nền**; AI #1 gọi được ở từng câu, từng vòng, hoặc cả bài | Hai câu hỏi khác nhau ("sai cái gì" vs "vì sao sai"); nhiều học viên chỉ cần cái thứ nhất |
