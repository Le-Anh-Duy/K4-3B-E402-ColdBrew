# ColdBrew API Contract (v0)

> **Dự án:** ColdBrew — Track C · Lesson Studio (Knowledge-to-Lesson)  
> **Phiên bản API:** `v0`  
> **Cập nhật lần cuối:** 2026-09-18  
> **Môi trường:** FastAPI Backend (`http://localhost:8000`) & React Vite Frontend (`http://localhost:5173`)  
> **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs) | **OpenAPI JSON:** [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

---

## 1. Quy Chuẩn Giao Tiếp Chung (Conventions)

1. **Base URL:** `http://localhost:8000/api/v0`
2. **Vite Proxy Config:** Frontend gọi trực tiếp `/api/v0/...` (hoặc thông qua `src/api.js`). Vite proxy cấu hình tại `vite.config.js` tự động chuyển tiếp tới Backend port 8000.
3. **Mã hóa:** UTF-8 (`charset=utf-8`).
4. **Header Request:**
   ```http
   Content-Type: application/json
   Accept: application/json
   ```
5. **Cấu trúc Response Thành Công (200 OK):** Trả về trực tiếp JSON Object hoặc JSON Array như định nghĩa bên dưới.
6. **Cấu trúc Response Lỗi Chuẩn (4xx, 5xx):**
   ```json
   {
     "detail": "Mô tả nguyên nhân lỗi cụ thể"
   }
   ```
7. **Cơ chế Fallback AI an toàn:** Khi `GEMINI_API_KEY` chưa khai báo hoặc gặp lỗi rate-limit/network, Backend **không crash 500** mà tự động trả về nội dung giải thích dự phòng (fallback heuristic) bám sát dữ liệu slide có trong `tree.json` / `quiz.json` / `probes.json`.

---

## 2. Chi Tiết Endpoints: Backend 1 (Quiz, AI Explain & Chatbot)

### 2.1. Quiz & Chấm Điểm Bài Thi

#### `GET /api/v0/quiz`
- **Mục đích:** Lấy danh sách câu hỏi trắc nghiệm ôn tập đầu vào cho màn hình Quiz.
- **Bảo mật:** Đáp án đúng (`answer`), giải thích (`why`), và bẫy (`traps`) bị loại bỏ khỏi response để chống lộ đề.
- **Query Parameter:** `count` — số câu cần lấy, là số nguyên từ `5` đến `20`, mặc định `5`.
- **Response `200 OK`:**
  ```json
  [
    {
      "id": "q1",
      "node": "l_token",
      "q": "Câu nào sau đây mô tả ĐÚNG NHẤT về token trong mô hình ngôn ngữ lớn (LLM)?",
      "options": [
        "Mỗi token luôn tương ứng chính xác với một từ hoàn chỉnh",
        "Một từ dài hoặc phức tạp có thể bị tách thành nhiều token khác nhau",
        "Mỗi token luôn đại diện cho một câu hoàn chỉnh",
        "Token là đơn vị chỉ được sử dụng cho văn bản tiếng Anh"
      ]
    }
  ]
  ```
- **Mã lỗi:**
  - `500 Internal Server Error`: Không nạp được file `quiz.json`.
- **Ví dụ cURL:**
  ```bash
  curl -X GET "http://localhost:8000/api/v0/quiz?count=12" -H "Accept: application/json"
  ```

---

### 2.2. `POST /api/v0/quiz/grade`
- **Mục đích:** Chấm điểm bài quiz kết hợp phân tích thời gian làm từng câu để phát hiện các tín hiệu sư phạm: `rush` (< 3s), `slow` (> 25s), `wrong`, `skip` (bỏ trống).
- **Request Body (`QuizGradeIn`):**
  | Trường | Kiểu | Bắt buộc | Mô tả |
  |---|---|---|---|
  | `picked` | `List[int \| null]` | Có | Mảng chỉ số đáp án chọn (0-based). `null` nếu bỏ trống. |
  | `times` | `List[int]` | Có | Mảng số giây làm bài tương ứng từng câu. |
- **Ví dụ Request Body:**
  ```json
  {
    "picked": [1, 0, 1, 0, 0],
    "times": [12, 28, 2, 15, 8]
  }
  ```
- **Response `200 OK` (`QuizGradeOut`):**
  ```json
  {
    "records": [
      {
        "node": "l_token",
        "sel": 1,
        "correct": true,
        "sec": 12,
        "flag": "ok",
        "answer": 1,
        "why": "Tokenizer cắt theo mẫu ký tự hay gặp, nên một từ dài có thể thành nhiều token...",
        "trap": null
      },
      {
        "node": "l_ctx",
        "sel": 0,
        "correct": true,
        "sec": 28,
        "flag": "slow",
        "answer": 0,
        "why": "Context window là giới hạn tính bằng token...",
        "trap": null
      },
      {
        "node": "l_vec",
        "sel": 1,
        "correct": false,
        "sec": 2,
        "flag": "rush",
        "answer": 0,
        "why": "Embedding biến văn bản thành vector số...",
        "trap": "Nhầm vector hoá với nén ảnh làm sai căn bản về định dạng vector."
      }
    ],
    "correct_count": 4,
    "total_count": 5,
    "total_sec": 65
  }
  ```
- **Ví dụ cURL:**
  ```bash
  curl -X POST "http://localhost:8000/api/v0/quiz/grade" \
    -H "Content-Type: application/json" \
    -d '{"picked": [1,0,1,0,0], "times": [12,28,2,15,8]}'
  ```

---

### 2.3. `POST /api/v0/ai/explain/single`
- **Mục đích:** Kích hoạt AI Gemini khi học viên bấm *"✨ AI phân tích câu này"* trên từng thẻ kết quả tại màn Result hoặc Explain.
- **Request Body (`ExplainSingleIn`):**
  | Trường | Kiểu | Bắt buộc | Mô tả |
  |---|---|---|---|
  | `node_id` | `string` | Có | ID của node câu hỏi (vd: `l_token`, `l_vec`). |
  | `question` | `string` | Có | Nội dung câu hỏi. |
  | `options` | `List[string]` | Có | Danh sách 4 phương án lựa chọn. |
  | `correct_idx` | `int` | Có | Chỉ số đáp án đúng (0-based). |
  | `selected_idx` | `int \| null` | Không | Chỉ số phương án học viên chọn (`null` nếu bỏ trống). |
  | `time_sec` | `int` | Có | Số giây học viên làm câu hỏi này. |
  | `flag` | `string` | Có | Nhãn hành vi: `ok`, `slow`, `wrong`, `rush`, `skip`. |
- **Response `200 OK` (`ExplainSingleOut`):**
  ```json
  {
    "why": "Tokenizer cắt theo mẫu ký tự hay gặp, nên một từ dài có thể thành nhiều token, còn từ ngắn chỉ một token.",
    "trap": "Nhầm 'token = từ' là nhầm lẫn phổ biến nhất, dẫn đến việc tính sai dung lượng context window.",
    "timing_note": "Bạn làm trong 2s — nhanh hơn thời gian đọc đề, khả năng cao là bấm vội chứ chưa hẳn đã hổng kiến thức.",
    "slide_page": "Slide d1 · trang 5"
  }
  ```
- **Ví dụ cURL:**
  ```bash
  curl -X POST "http://localhost:8000/api/v0/ai/explain/single" \
    -H "Content-Type: application/json" \
    -d '{
      "node_id": "l_token",
      "question": "Câu nào đúng về token?",
      "options": ["Mỗi token là một từ", "Một từ dài có thể thành nhiều token", "Token là một câu", "Chỉ dùng cho tiếng Anh"],
      "correct_idx": 1,
      "selected_idx": 0,
      "time_sec": 2,
      "flag": "rush"
    }'
  ```

---

### 2.4. `POST /api/v0/ai/explain/round`
- **Mục đích:** Kích hoạt AI phân tích tổng quan kết quả sau khi hoàn thành 3 câu chẩn đoán nền ở màn Review (Nút *"✨ Nhận xét & giải thích đáp án vòng này"*).
- **Request Body (`ExplainRoundIn`):**
  | Trường | Kiểu | Bắt buộc | Mô tả |
  |---|---|---|---|
  | `target_node_id` | `string` | Có | ID của node cha đang chẩn đoán (vd: `c3s1`). |
  | `round_num` | `int` | Có | Thứ tự vòng chẩn đoán hiện tại (1, 2, 3). |
  | `decision` | `string` | Có | Quyết định của engine: `locate`, `escalate`, `restart`. |
  | `records` | `List[RoundRecordIn]` | Có | Chi tiết 3 câu làm trong vòng vừa rồi. |
- **Response `200 OK` (`ExplainRoundOut`):**
  ```json
  {
    "summary": "Bạn trả lời đúng 2/3 câu nền tảng của mục 3.1 Embedding.",
    "per_question_notes": [
      "Câu 1: Nắm vững định nghĩa vector hoá.",
      "Câu 2: Nhầm lẫn nhẹ giữa hàm khoảng cách và mã hoá mật khẩu.",
      "Câu 3: Phân biệt tốt tính chất tất định của embedding."
    ],
    "advice": "Lỗ hổng không nằm ở gốc rễ khái niệm mà chỉ khu trú ở ứng dụng so sánh vector. Bạn có thể yên tâm chuyển sang bước tạo lộ trình ôn tập."
  }
  ```

---

### 2.5. `POST /api/v0/ai/chat/message`
- **Mục đích:** Đối thoại với AI phản biện tại màn Analysis (Nút *"💬 Chưa thuyết phục — hỏi thêm"*). Giúp học viên thắc mắc vì sao hệ thống nghi ngờ mình hổng mục này.
- **Ràng buộc an toàn:** Hệ thống kiểm tra nghiêm ngặt, chỉ cho phép đối thoại xoay quanh cây tri thức và slide bài học. Nghiêm cấm bịa đặt concept ngoài bài học.
- **Request Body (`ChatIn`):**
  | Trường | Kiểu | Bắt buộc | Mô tả |
  |---|---|---|---|
  | `target_node_id` | `string` | Có | Node đang bị khoanh vùng nghi vấn. |
  | `weak_signals` | `List[WeakSignalIn]` | Có | Danh sách tín hiệu yếu rút ra từ bài quiz (`node`, `label`, `flag`, `sec`). |
  | `message` | `string` | Có | Câu hỏi / lời phản bác của học viên. |
  | `history` | `List[ChatMessage]` | Không | Lịch sử chat trước đó (`role`: "user" \| "assistant", `content`). Mặc định `[]`. |
- **Response `200 OK` (`ChatOut`):**
  ```json
  {
    "reply": "Hệ thống khoanh vùng vào '3.1 Embedding' vì bạn làm sai câu hỏi 'Văn bản được vector hoá' (mất 12s). Trong bài giảng Day 1 (Slide d1 · trang 21), đây là bước tiên quyết để LLM tìm kiếm ngữ nghĩa.",
    "grounded_node": "3.1 Embedding",
    "slide_page": "Slide d1 · trang 21–22",
    "suggested_actions": [
      "Kiểm tra 3 câu nền",
      "Xem lại slide trang 21",
      "Bỏ qua và tự ôn"
    ]
  }
  ```

---

## 3. Chi Tiết Endpoints: Backend 2 (Cây Tri Thức, Probes, Lộ Trình & Session)

### 3.1. `GET /api/v0/graph/tree`
- **Mục đích:** Nạp toàn bộ cây tri thức 19 concepts phân cấp (Root $\to$ Chương $\to$ Mục $\to$ Lá) kèm liên kết số trang slide provenance chính xác.
- **Response `200 OK` (`TreeResponse`):**
  ```json
  {
    "nodes": {
      "root": {
        "id": "root",
        "label": "Day 1 · AI & LLM Foundation",
        "page": "Slide d1 · trang 1–29",
        "parent": null,
        "compact": [
          "LLM sinh văn bản bằng cách đoán token kế tiếp, không tra cứu dữ liệu (trang 4–9)",
          "Prompt là cách ta đặt ràng buộc cho phần sinh đó (trang 12–18)",
          "RAG gắn thêm nguồn ngoài để câu trả lời có căn cứ (trang 20–27)"
        ]
      },
      "c1": {
        "id": "c1",
        "label": "Chương 1 · LLM hoạt động thế nào",
        "page": "Slide d1 · trang 4–11",
        "parent": "root"
      },
      "c3s1": {
        "id": "c3s1",
        "label": "3.1 Embedding",
        "page": "Slide d1 · trang 21–22",
        "parent": "c3"
      },
      "l_vec": {
        "id": "l_vec",
        "label": "Văn bản được vector hoá",
        "page": "Slide d1 · trang 21",
        "parent": "c3s1",
        "content_summary": "Biến văn bản thành vector để máy tính so sánh khoảng cách và độ tương đồng."
      }
    }
  }
  ```

---

### 3.2. `GET /api/v0/probes/{target_node_id}`
- **Mục đích:** Lấy 3 câu hỏi chẩn đoán nền của node cha (vd: `c3s1`, `c1`, `c2`) để tiến hành chẩn đoán sâu ở màn Probe.
- **Path Parameter:**
  - `target_node_id` (`string`, bắt buộc): ID của node cha cần chẩn đoán.
- **Response `200 OK` (`ProbesOut`):**
  ```json
  {
    "target_node_id": "c3s1",
    "target_label": "3.1 Embedding",
    "slide_page": "Slide d1 · trang 21–22",
    "questions": [
      {
        "id": 0,
        "q": "Embedding biến một đoạn văn bản thành định dạng nào?",
        "options": [
          "Một dãy số thực nhiều chiều (vector)",
          "Một bức ảnh bitmap",
          "Một câu tóm tắt ngắn hơn",
          "Một chuỗi mã hoá MD5"
        ]
      },
      {
        "id": 1,
        "q": "Mục đích chính của việc so sánh hai vector embedding là gì?",
        "options": [
          "Đo mức độ tương đồng về mặt ngữ nghĩa",
          "Nén dung lượng lưu trữ của văn bản",
          "Tăng tốc độ hiển thị font chữ",
          "Mã hoá bảo mật thông tin người dùng"
        ]
      },
      {
        "id": 2,
        "q": "Đặc điểm cơ bản của mô hình embedding đối với cùng một câu văn đầu vào là gì?",
        "options": [
          "Luôn sinh ra cùng một vector cố định trong cùng không gian",
          "Mỗi lần chạy sinh ra một vector ngẫu nhiên khác nhau",
          "Chỉ tạo ra vector nếu câu văn có độ dài dưới 10 từ",
          "Vector có số chiều thay đổi tuỳ thuộc vào tâm trạng mô hình"
        ]
      }
    ]
  }
  ```
- **Mã lỗi:**
  - `404 Not Found`: Khi node ID không tồn tại hoặc không có bộ câu hỏi chẩn đoán được định nghĩa.

---

### 3.3. `POST /api/v0/probes/evaluate-round`
- **Mục đích:** Chấm điểm vòng probe và áp dụng thuật toán thích ứng (Adaptive Diagnostic Engine) để đưa ra quyết định leo cây.
- **Thuật toán sư phạm (Rule-based Decision):**
  - **`locate` (Khoanh vùng tại chỗ):** Số câu sai $\le 1/3 \to$ Nền tảng node cha vững vàng, chỗ hổng chỉ nằm cục bộ ở lá $\to$ Dừng và sinh lộ trình ôn node hiện tại.
  - **`escalate` (Leo lên tầng trên):** Số câu sai $\ge 2/3 \to$ Hổng ngay cả khái niệm nền của node cha $\to$ Leo lên node cha cấp cao hơn (`c3s1` $\to$ `c3`).
  - **`restart` (Học lại toàn diện):** Nếu đã leo lên tận node gốc (`root`) mà vẫn sai $\ge 2/3$, hoặc vượt quá số vòng tối đa (`MAX_ROUNDS = 3`).
- **Request Body (`EvaluateRoundIn`):**
  | Trường | Kiểu | Bắt buộc | Mô tả |
  |---|---|---|---|
  | `target_node_id` | `string` | Có | Node đang được chẩn đoán. |
  | `round_num` | `int` | Có | Thứ tự vòng hiện tại (1, 2, 3). |
  | `picked` | `List[int \| null]` | Có | Chỉ số các đáp án được chọn cho 3 câu. |
  | `times` | `List[int]` | Có | Thời gian làm bài từng câu tính theo giây. |
- **Response `200 OK` (`EvaluateRoundOut`):**
  ```json
  {
    "decision": "locate",
    "next_target": null,
    "next_target_label": null,
    "bad_count": 0,
    "slow_count": 1,
    "records": [
      {
        "node": "c3s1",
        "sel": 0,
        "correct": true,
        "sec": 6,
        "flag": "ok",
        "answer": 0,
        "why": "Embedding là hàm biến văn bản thành vector số...",
        "trap": null
      },
      {
        "node": "c3s1",
        "sel": 0,
        "correct": true,
        "sec": 26,
        "flag": "slow",
        "answer": 0,
        "why": "Khoảng cách vector phản ánh mức độ gần gũi ngữ nghĩa...",
        "trap": null
      },
      {
        "node": "c3s1",
        "sel": 0,
        "correct": true,
        "sec": 8,
        "flag": "ok",
        "answer": 0,
        "why": "Mô hình embedding mang tính tất định...",
        "trap": null
      }
    ],
    "trace_entry": {
      "t": "Vòng 1 · 3.1 Embedding",
      "d": "sai/bỏ trống 0/3 (1 câu trả lời chậm)"
    }
  }
  ```

---

### 3.4. `POST /api/v0/ai/diagnosis/hypothesis`
- **Mục đích:** AI diễn giải giả thuyết chẩn đoán ban đầu tại màn Analysis dựa trên các tín hiệu yếu thu thập từ bài quiz.
- **Tiêu chuẩn thiết kế:** Tuân thủ nguyên tắc **HAX G11** (*Make clear why the system did what it did*) và **HAX G2** (*Make clear how well the system can do what it can do*).
- **Request Body (`DiagnosisHypothesisIn`):**
  | Trường | Kiểu | Mặc định | Mô tả |
  |---|---|---|---|
  | `target_node_id` | `string` | Bắt buộc | Node cha được hệ thống chọn để chẩn đoán. |
  | `hits` | `List[SignalHit]` | Bắt buộc | Danh sách các tín hiệu yếu từ bài quiz (`node`, `label`, `flag`, `sec`). |
  | `only_slow` | `boolean` | `false` | `true` nếu bài làm không có câu sai nào, chỉ có câu đúng mà làm chậm (>25s). |
  | `rushed_any` | `boolean` | `false` | `true` nếu có câu sai dưới 3s (nghi ngờ bấm vội/đoán mò). |
- **Response `200 OK` (`DiagnosisHypothesisOut`):**
  ```json
  {
    "target_node_id": "c3s1",
    "target_label": "3.1 Embedding",
    "slide_page": "Slide d1 · trang 21–22",
    "confidence": "trung bình",
    "confidence_explanation": "Mức chắc chắn trung bình: Có 1 câu sai thực sự nhưng chưa đủ khẳng định nếu không kiểm tra các khái niệm nền.",
    "hypothesis_text": "Tín hiệu yếu của bạn tập trung ở mục '3.1 Embedding'. Có khả năng bạn chưa nắm chắc nguyên lý biểu diễn văn bản trong không gian vector đa chiều.",
    "suggested_action": "Kiểm tra 3 câu nền của mục này để xác định chính xác bạn hổng ở tầng chi tiết hay ở tầng nguyên lý."
  }
  ```

---

### 3.5. `POST /api/v0/ai/plan/generate`
- **Mục đích:** AI tổng hợp lộ trình ôn tập thích ứng (Remediation Plan) tại màn Plan, kèm giải trình minh bạch lý do nhận lộ trình.
- **Nguyên tắc Provenance (PAIR):** 100% các mục ôn tập phải trích dẫn đúng số trang slide thật (`Slide d1 · trang X`), tuyệt đối không đưa vào tài liệu ngoài hoặc khái niệm không có trong bài giảng.
- **Request Body (`PlanGenerateIn`):**
  | Trường | Kiểu | Bắt buộc | Mô tả |
  |---|---|---|---|
  | `verdict` | `string` | Có | Kết luận: `located`, `restart`, `self` (tự ôn), `accepted` (đồng thuận sau chat). |
  | `target_node_id` | `string \| null` | Không | Node chốt lỗ hổng. |
  | `trace` | `List[TraceStep]` | Có | Toàn bộ các bước trong cột "Dấu vết quyết định" (`t`: tiêu đề, `d`: diễn giải). |
- **Response `200 OK` (`PlanGenerateOut`):**
  ```json
  {
    "title": "Lộ trình ôn tập: 3.1 Embedding",
    "verdict": "located",
    "target_node_id": "c3s1",
    "items": [
      {
        "text": "Đọc lại Slide d1 trang 21–22: Định nghĩa vector và cơ chế ánh xạ văn bản vào không gian đa chiều",
        "slide_page": "Slide d1 · trang 21–22"
      },
      {
        "text": "Làm lại ví dụ tính khoảng cách Cosine ở trang 22",
        "slide_page": "Slide d1 · trang 22"
      }
    ],
    "why_explanation": "Hệ thống xác định lỗ hổng khu trú tại mục 3.1 Embedding vì: Bài quiz đầu vào bạn làm sai câu vector hoá (12s), nhưng khi kiểm tra 3 câu nền ở Vòng 1, bạn đã trả lời đúng hoàn toàn các câu hỏi nguyên lý.",
    "compact_summary": null,
    "provenance_confirmed": true
  }
  ```

---

### 3.6. Quản Lý Phiên Làm Việc Học Viên (Learner State Session)

Cụm endpoint này hiện thực hóa yêu cầu của **Spec §0** (Lưu trữ trạng thái người học vào file JSON tại `codebase/backend/app/data/sessions/{session_id}.json`) giúp học viên có thể tạm dừng và khôi phục bài học bất kỳ lúc nào.

#### A. Tạo phiên mới: `POST /api/v0/session`
- **Mục đích:** Khởi tạo một phiên chẩn đoán mới, sinh mã UUID và tạo file JSON trạng thái ban đầu.
- **Request:** Không body.
- **Response `200 OK`:**
  ```json
  {
    "session_id": "8f3b2c14-52d6-47a3-b42e-cf619a8421d0",
    "state": {
      "stage": "home",
      "records": [],
      "target": null,
      "round": 0,
      "retry": 0,
      "hits": [],
      "round_recs": [],
      "decision": null,
      "next_target": null,
      "trace": [],
      "status": {},
      "verdict": null
    }
  }
  ```

#### B. Khôi phục phiên: `GET /api/v0/session/{session_id}`
- **Mục đích:** Nạp lại toàn bộ tiến trình học tập từ file JSON khi học viên tải lại trang hoặc đổi thiết bị.
- **Path Parameter:** `session_id` (UUID).
- **Response `200 OK`:** Cấu trúc tương tự `POST /session` với đầy đủ lịch sử bài làm.
- **Mã lỗi:** `404 Not Found` nếu mã phiên không tồn tại.

#### C. Cập nhật tiến trình phiên: `PUT /api/v0/session/{session_id}`
- **Mục đích:** Đồng bộ trạng thái hiện tại từ React state vào file lưu trữ.
- **Path Parameter:** `session_id` (UUID).
- **Request Body (`SessionStateIn`):**
  ```json
  {
    "stage": "probe",
    "records": [{"node": "l_token", "sel": 1, "correct": true, "sec": 12, "flag": "ok"}],
    "target": "c3s1",
    "round": 1,
    "retry": 0,
    "hits": ["l_vec"],
    "round_recs": [],
    "decision": null,
    "next_target": null,
    "trace": [
      { "t": "Sai / bỏ trống", "d": "Văn bản được vector hoá (sai, 12s)" },
      { "t": "Định vị", "d": "1 tín hiệu thuộc '3.1 Embedding' → kiểm tra 3 câu nền" }
    ],
    "status": { "l_token": "ok", "l_vec": "wrong" },
    "verdict": null
  }
  ```
- **Response `200 OK`:** Trả về phiên với `state` đã cập nhật.

---

### 3.7. `GET /api/v0/health`
- **Mục đích:** Endpoint kiểm tra sức khỏe dịch vụ (Liveness check) cho thanh điều hướng Frontend.
- **Response `200 OK`:**
  ```json
  {
    "status": "healthy",
    "version": "v0",
    "gemini_configured": true
  }
  ```

---

### 3.8. Đánh Giá & Nhận Xét Phiên Học (User Feedback & Review)

#### `POST /api/v0/feedback` hoặc `POST /api/v0/session/{session_id}/feedback`
- **Mục đích:** Tiếp nhận đánh giá số sao (1-5), các lý do chọn nhanh (chip tags) và nhận xét đóng góp ý kiến của học viên sau khi kết thúc phiên quiz hoặc lộ trình ôn tập.
- **Request Body:**
  ```json
  {
    "session_id": "6b4c4a53-ede0-4005-8c37-c78ee7b39523",
    "stars": 5,
    "reasons": ["Vừa đủ, dùng được", "Đúng chỗ mình hổng"],
    "comment": "Giải thích chi tiết và gợi ý ôn tập rất hữu ích!",
    "node_id": "c3s1",
    "topic": "3.1 Double Diamond: phân kỳ – hội tụ"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "ok": true,
    "id": "a8fd7eb7-05d0-4f1c-9972-a48a383607f2",
    "session_id": "6b4c4a53-ede0-4005-8c37-c78ee7b39523",
    "stars": 5,
    "reasons": ["Vừa đủ, dùng được", "Đúng chỗ mình hổng"],
    "comment": "Giải thích chi tiết và gợi ý ôn tập rất hữu ích!",
    "node_id": "c3s1",
    "topic": "3.1 Double Diamond: phân kỳ – hội tụ",
    "created_at": "2026-09-18T20:41:00.123456",
    "message": "Đã lưu nhận xét và đánh giá phiên học thành công"
  }
  ```

#### `GET /api/v0/session/{session_id}/feedback`
- **Mục đích:** Lấy thông tin nhận xét và đánh giá đã lưu của một phiên học cụ thể.
- **Response `200 OK`:** Trả về đối tượng `FeedbackOut`.
- **Mã lỗi:** `404 Not Found` nếu phiên chưa tồn tại hoặc chưa có nhận xét.

#### `GET /api/v0/feedback`
- **Mục đích:** Lấy danh sách các nhận xét gần nhất từ học viên (hỗ trợ phân tích chất lượng bài học).
- **Query Parameter:** `limit` — số lượng tối đa bản ghi cần lấy (mặc định 20).
- **Response `200 OK`:** Danh sách `FeedbackOut[]`.

---

## 4. Bảng Tra Cứu Trạng Thái & Hằng Số Sư Phạm (Data Dictionary & Enums)

| Tên Trường / Tham số | Giá Trị Hợp Lệ | Ý Nghĩa Sư Phạm & Quy Tắc Kích Hoạt |
|---|---|---|
| `flag` (cờ làm bài) | `ok` | Trả lời đúng, thời gian làm bài bình thường ($\le 25s$). |
| | `slow` | Trả lời đúng nhưng thời gian kéo dài ($> 25s$). Tín hiệu lưỡng lự, nắm chưa vững. |
| | `wrong` | Trả lời sai, thời gian suy nghĩ hợp lý ($\ge 3s$). Lỗ hổng kiến thức thực thụ. |
| | `rush` | Trả lời sai dưới $3s$. Nghi ngờ học viên đoán mò, bấm vội hoặc không đọc kỹ đề. |
| | `skip` | Bỏ trống không trả lời câu hỏi. |
| `decision` (quyết định leo cây) | `locate` | Chốt lỗ hổng tại node hiện tại (sai $\le 1/3$ câu hỏi nền). |
| | `escalate` | Sai $\ge 2/3$ câu hỏi nền $\to$ Hổng cả kiến thức nền $\to$ Leo lên node cha. |
| | `restart` | Chẩn đoán đến đỉnh cây hoặc quá 3 vòng mà vẫn sai $\ge 2/3 \to$ Gợi ý học lại bài. |
| `confidence` (độ tin cậy) | `cao` | Nhiều câu sai cùng một cụm hoặc học viên xác nhận trong chat. |
| | `trung bình` | Chỉ có 1 câu sai hoặc kết hợp giữa câu sai và câu làm chậm. |
| | `thấp` | Không có câu sai, chỉ dựa trên câu làm chậm (>25s) hoặc câu bấm vội (<3s). |
| `verdict` (kết luận lộ trình) | `located` | Lộ trình khoanh vùng chính xác tại một node cụ thể trên cây. |
| | `restart` | Lộ trình tổng quan đề xuất đọc lại toàn bộ bài học từ đầu. |
| | `self` | Học viên chủ động chọn "Mình tự ôn được" (HAX G17 - Trao quyền tự quyết). |
| | `accepted` | Học viên đồng thuận với giả thuyết sau khi trao đổi với Chatbot. |
| **Ngưỡng thời gian** | `SLOW_SEC = 25` | Quá 25 giây được coi là làm chậm. |
| | `RUSH_SEC = 3` | Dưới 3 giây được coi là bấm vội. |
| | `MAX_ROUNDS = 3`| Tối đa 3 vòng chẩn đoán trước khi buộc dừng để tránh làm mệt học viên. |

---

## 5. Khai Báo TypeScript Interfaces Chuẩn (Cho Frontend Devs)

Frontend Developers có thể sao chép trực tiếp định nghĩa dưới đây vào file `frontend/src/types/api.ts`:

```typescript
export type QuestionFlag = 'ok' | 'slow' | 'wrong' | 'rush' | 'skip';
export type DecisionType = 'locate' | 'escalate' | 'restart';
export type ConfidenceLevel = 'thấp' | 'trung bình' | 'cao';
export type VerdictType = 'located' | 'restart' | 'self' | 'accepted';

export interface QuizQuestion {
  id: string;
  node: string;
  q: string;
  options: string[];
}

export interface QuestionRecord {
  node: string;
  sel: number | null;
  correct: boolean;
  sec: number;
  flag: QuestionFlag;
  answer: number;
  why?: string;
  trap?: string | null;
}

export interface QuizGradeResponse {
  records: QuestionRecord[];
  correct_count: number;
  total_count: number;
  total_sec: number;
}

export interface ExplainSingleRequest {
  node_id: string;
  question: string;
  options: string[];
  correct_idx: number;
  selected_idx: number | null;
  time_sec: number;
  flag: QuestionFlag;
}

export interface ExplainSingleResponse {
  why: string;
  trap?: string | null;
  timing_note?: string | null;
  slide_page?: string | null;
}

export interface TraceStep {
  t: string;
  d: string;
}

export interface DiagnosisHypothesisResponse {
  target_node_id: string;
  target_label: string;
  slide_page: string;
  confidence: ConfidenceLevel;
  confidence_explanation: string;
  hypothesis_text: string;
  suggested_action: string;
}

export interface RemediationItem {
  text: string;
  slide_page: string;
}

export interface PlanGenerateResponse {
  title: string;
  verdict: VerdictType;
  target_node_id?: string | null;
  items: RemediationItem[];
  why_explanation: string;
  compact_summary?: string[] | null;
  provenance_confirmed: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
  grounded_node: string;
  slide_page: string;
  suggested_actions: string[];
}
```

---

## 6. Hướng Dẫn Kiểm Thử & Chạy Nghiệm Thu (Verification)

### Kiểm tra tự động bằng cURL (Smoke Test toàn bộ 12 API):
```powershell
# 1. Kiểm tra Health
curl http://localhost:8000/api/v0/health

# 2. Lấy Cây tri thức
curl http://localhost:8000/api/v0/graph/tree

# 3. Lấy đề Quiz
curl http://localhost:8000/api/v0/quiz

# 4. Chấm điểm Quiz
curl -X POST http://localhost:8000/api/v0/quiz/grade -H "Content-Type: application/json" -d '{\"picked\":[1,0,1,0,0],\"times\":[10,12,14,8,9]}'

# 5. Lấy câu hỏi Probe cho node c3s1
curl http://localhost:8000/api/v0/probes/c3s1

# 6. Đánh giá vòng Probe
curl -X POST http://localhost:8000/api/v0/probes/evaluate-round -H "Content-Type: application/json" -d '{\"target_node_id\":\"c3s1\",\"round_num\":1,\"picked\":[0,0,0],\"times\":[5,6,7]}'
```

---

# Bổ sung sau khi hoà với nhánh `mockup` (v0.2)

> Ba bản luật (backend · bộ đo · trang mock) nay chạy **cùng một cơ chế**, kiểm bằng
> `python scripts/parity.py`. Rà toàn bộ endpoint: `python scripts/api_smoke.py`.

## 1 · Dữ liệu đổi nguồn — provenance là MÃ ĐOẠN, không phải số trang slide

`app/data/{tree,quiz,probes}.json` giờ **sinh tự động** từ `mockup/data.js` bằng
`node scripts/export_graph.js`. **Đừng sửa tay ba file này**, sửa xong chạy lại là mất.

Cây dựng từ `transcript-01-clean.md` (Day 2 sáng · Xác định bài toán kinh doanh cho AI).
Mỗi node có thêm `file` · `span` (mã đoạn `[T01-xxx]`) · `conf` (0.9 nói thẳng / 0.7 nhóm lại)
· `prereq` (tiền đề, **khác** `parent` là quan hệ mục lục).

Số trang slide cũ (`"Slide d1 · trang 21–22"`) **đã bỏ** — chưa đối chiếu PDF nên ghi vào là trích dẫn bịa.

## 2 · `POST /probes/evaluate-round`

**Thêm vào request:**

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `last_failed` | `string?` | Node sâu nhất đã TRƯỢT ở các vòng trước. **FE phải mang theo qua từng vòng** |

**Thêm vào response:**

| Trường | Ý nghĩa |
|---|---|
| `gap` / `gap_label` | Chỗ hổng thật — node sâu nhất bị trượt. `null` = hổng ở chính ý trong quiz |
| `ceiling` / `ceiling_label` | Trần: node trả lời ĐẠT, tức nền từ đó trở lên ổn |
| `scenario` | `y_le` · `muc_nong` · `muc_duoi_tran` · `nen_bai` · `leo` |
| `prompt_key` | System prompt mà luật giao cho AI ở kịch bản đó |

**Vì sao cần `last_failed`:** node trả lời đạt là *trần*, không phải chỗ hổng. Không mang
theo lịch sử thì vòng 2 đúng hết sẽ bị kết luận nhầm là "hổng ở chương" — trong khi chương
vừa làm đúng.

```
vòng 1: POST {target_node_id:"c3s1", round_num:1, picked, times}
        → decision "escalate", next_target "c3"      (ghi nhớ failed = "c3s1")
vòng 2: POST {target_node_id:"c3", round_num:2, picked, times, last_failed:"c3s1"}
        → decision "locate", scenario "muc_duoi_tran", gap "c3s1", ceiling "c3"
```

## 3 · `POST /ai/plan/generate`

**Đường mới (nên dùng):** truyền `scenario` + `gap_node_id` + `ceiling_node_id` + `records`
→ backend chọn **system prompt theo kịch bản**, AI chỉ viết chữ trong khung.
Không truyền `scenario` thì vẫn chạy đường cũ.

| Thêm vào response | Ý nghĩa |
|---|---|
| `advice_text` | Nguyên văn AI viết — **FE hiển thị trường này** |
| `allowed_spans` | Danh sách mã đoạn đã cấp cho prompt. Bộ đo chấm "có trích lạc không" theo đây |
| `scenario` · `prompt_key` | Để hiển thị và để đối chiếu |

`items[].slide_page` giữ tên cũ cho FE khỏi phải đổi, nhưng nội dung nay là nguồn dạng
`transcript-01-clean.md · [T01-049] [T01-071]`.

## 4 · Bốn kịch bản → bốn prompt

| Kịch bản | Khi nào | AI được giao |
|---|---|---|
| `y_le` | probe tầng trên đúng hết | giải thích đúng ý bị sai, cấm mở rộng |
| `muc_nong` | sai 1/3 câu nền | nhắc mảnh còn thiếu |
| `muc_duoi_tran` | mục trượt, tầng trên đạt | nhắc nền đã ổn rồi vá mục |
| `nen_bai` | trượt tới nền, hết đường leo | tóm tắt cả bài + thứ tự chương |

Mọi prompt đều buộc: chỉ dùng tư liệu được cấp · mỗi ý kèm mã đoạn · không lấy lý do
"tư liệu không đề cập" thay cho giải thích · kết bằng dòng `Tự kiểm:`.

## 5 · Chống rate limit

Mọi script gọi LLM đều giãn **tối thiểu 1.5s/lời gọi** và nghỉ 6s sau mỗi 10 lời gọi
(`scripts/grounding.py`, `scripts/api_smoke.py`). FE gọi liên tiếp nhiều node thì nên
làm tương tự, hoặc gom về một lời gọi.
