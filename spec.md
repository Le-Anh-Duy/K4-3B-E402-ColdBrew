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

Bản mock CP2: `mockup/` — HTML tĩnh + React qua CDN + mock data, **chưa gọi AI**, chạy được trên GitHub Pages. Sơ đồ luồng và quy tắc chẩn đoán: `mockup/flow.md`.

---

## §1. User & Job

- **Job executor:** học viên AI20k đang học một chương (ví dụ Day 1 — AI & LLM Foundation), làm quiz ôn tập rồi tự hỏi "sai chỗ này thì phải học lại cái gì".
- **Core JTBD:** *Khi tôi làm sai vài câu trong bài ôn, tôi muốn biết chính xác mình hổng khái niệm nền nào và học lại đúng phần đó, để không phải đọc lại cả chương.*
- **Problem statement (không chữ AI):** Học viên làm quiz xong chỉ biết "đúng 3/5". Bài ôn được phát theo một lộ trình tuyến tính giống nhau cho mọi người, trong khi mỗi người hổng ở concept khác nhau — và cái hổng thật thường nằm ở **prerequisite** chứ không phải ở concept của câu hỏi. Hậu quả: học viên đọc lại cả chương hoặc bỏ qua, lỗ hổng nền tích lại sang ngày sau.
- **Evidence:** `TODO` — dự kiến chuẩn B (mining `data/vlearn-pack/chatlog/tutor_turns.csv`, 13.494 turn): đếm tỉ lệ câu hỏi lặp lại cùng một concept nền, và câu hỏi ở chương sau nhưng nội dung thuộc chương trước → dấu hiệu hổng prerequisite. Kèm ≥5 quote nguyên văn (ghi mã `T#####`, không dán dài). Log đầy đủ để trong `eval/evidence/`.

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

- **Chiều chất lượng:** (1) *Chẩn đoán đúng* — concept/prerequisite hệ thống chỉ ra trùng với đáp án chuẩn nhóm gán tay cho từng hồ sơ trả lời. (2) *Có căn cứ* — mọi mục ôn trỏ được về slide/trang có thật. (3) *Giải thích hợp lệ* — lời giải thích chỉ nhắc concept có trong graph.
- **Golden set:** `TODO` ≥20 case trong `eval/golden_set.json` — mỗi case = một bộ 5 câu trả lời (hồ sơ học viên giả) + concept yếu kỳ vọng + prerequisite kỳ vọng.
- **Quality bar:** `TODO` — chốt trước 21:00 17/9 (CP4), giữ nguyên sau đó.
- **Kết quả các lượt chạy:** `TODO` bảng %.

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
| 17/9 | Tách **AI #1 giải thích đáp án** khỏi **AI #2 chẩn đoán nền**; AI #1 gọi được ở từng câu, từng vòng, hoặc cả bài | Hai câu hỏi khác nhau ("sai cái gì" vs "vì sao sai"); nhiều học viên chỉ cần cái thứ nhất |
