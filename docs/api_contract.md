# ColdBrew API Contract (v0)

> **Dự án:** ColdBrew — Track C · Lesson Studio (Knowledge-to-Lesson)  
> **Phiên bản API:** `v0`  
> **Môi trường:** FastAPI Backend (`http://localhost:8000`) & React Vite Frontend (`http://localhost:5173`)  
> **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs) | **OpenAPI JSON:** [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

---

## 1. Quy Chuẩn Giao Tiếp Chung (Conventions)

1. **Base URL:** `http://localhost:8000/api/v0`
2. **Vite Proxy:** Mọi request từ Frontend cổng `5173` gọi tiền tố `/api/v0/...` được tự động proxy sang `http://localhost:8000/api/v0/...`.
3. **Mã hóa:** UTF-8 (`charset=utf-8`).
4. **Header Request:**
   ```http
   Content-Type: application/json
   Accept: application/json
   ```
5. **Định Dạng Response Thành Công (200 OK):** Trả về trực tiếp JSON Object hoặc JSON Array theo schema mô tả bên dưới.
6. **Định Dạng Response Lỗi Chuẩn (4xx, 5xx):**
   ```json
   {
     "detail": "Mô tả nguyên nhân lỗi cụ thể"
   }
   ```
7. **Mã Trạng Thái HTTP (Status Codes):**
   - `200 OK`: Yêu cầu thực thi thành công.
   - `400 Bad Request`: Dữ liệu gửi lên không hợp lệ hoặc thiếu logic nghiệp vụ.
   - `404 Not Found`: Không tìm thấy tài nguyên (Node ID, Session ID, v.v.).
   - `422 Unprocessable Entity`: Sai định dạng schema theo Pydantic.
   - `500 Internal Server Error`: Lỗi xử lý nội bộ server.
8. **Cơ Chế Dự Phòng AI (Safe Fallback):** Khi chưa cấu hình `GEMINI_API_KEY` hoặc gặp lỗi rate-limit/mạng, các endpoint AI tự động trả về nội dung giải thích dự phòng (fallback heuristic) được sinh từ dữ liệu cây tri thức và ngân hàng câu hỏi, đảm bảo hệ thống không bị gián đoạn.

---

## 2. Chi Tiết Các Endpoints (API Specification)

### 2.1. Quiz & Chấm Điểm Bài Thi

#### `GET /api/v0/quiz`
- **Mục đích:** Lấy danh sách câu hỏi trắc nghiệm ôn tập đầu vào cho màn hình Quiz.
- **Bảo mật:** Đáp án đúng (`answer`), giải thích (`why`), và bẫy (`traps`) bị loại bỏ khỏi response để chống lộ đề.
- **Request:** Không có Body hay Query Parameter.
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
- **Ví dụ cURL:**
  ```bash
  curl -X GET "http://localhost:8000/api/v0/quiz" -H "Accept: application/json"
  ```

---

#### `POST /api/v0/quiz/grade`
- **Mục đích:** Chấm điểm bài quiz kết hợp phân tích thời gian làm từng câu để phát hiện tín hiệu sư phạm: `rush` (< 3s), `slow` (> 25s), `wrong`, `skip`.
- **Request Body:**
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
- **Response `200 OK`:**
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

### 2.2. AI Giải Thích & Nhận Xét (AI Explanation)

#### `POST /api/v0/ai/explain/single`
- **Mục đích:** AI giải thích chi tiết một câu hỏi (Nút *"✨ AI phân tích câu này"* trên mỗi thẻ câu hỏi).
- **Request Body:**
  | Trường | Kiểu | Bắt buộc | Mô tả |
  |---|---|---|---|
  | `node_id` | `string` | Có | ID của node câu hỏi (vd: `l_token`, `l_vec`). |
  | `question` | `string` | Có | Nội dung câu hỏi. |
  | `options` | `List[string]` | Có | Danh sách 4 phương án lựa chọn. |
  | `correct_idx` | `int` | Có | Chỉ số đáp án đúng (0-based). |
  | `selected_idx` | `int \| null` | Không | Chỉ số phương án người học chọn (`null` nếu bỏ trống). |
  | `time_sec` | `int` | Có | Số giây làm câu hỏi này. |
  | `flag` | `string` | Có | Nhãn hành vi: `ok`, `slow`, `wrong`, `rush`, `skip`. |
- **Ví dụ Request Body:**
  ```json
  {
    "node_id": "l_token",
    "question": "Câu nào sau đây mô tả ĐÚNG NHẤT về token trong LLM?",
    "options": [
      "Mỗi token luôn tương ứng chính xác với một từ hoàn chỉnh",
      "Một từ dài hoặc phức tạp có thể bị tách thành nhiều token khác nhau",
      "Mỗi token luôn đại diện cho một câu hoàn chỉnh",
      "Token là đơn vị chỉ được sử dụng cho văn bản tiếng Anh"
    ],
    "correct_idx": 1,
    "selected_idx": 0,
    "time_sec": 2,
    "flag": "rush"
  }
  ```
- **Response `200 OK`:**
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
      "question": "Câu nào sau đây mô tả ĐÚNG NHẤT về token?",
      "options": ["Mỗi token là một từ", "Một từ dài có thể tách nhiều token", "Token là một câu", "Chỉ dùng cho tiếng Anh"],
      "correct_idx": 1,
      "selected_idx": 0,
      "time_sec": 2,
      "flag": "rush"
    }'
  ```

---

#### `POST /api/v0/ai/explain/round`
- **Mục đích:** AI nhận xét tổng hợp cả vòng chẩn đoán nền (Nút *"✨ Nhận xét & giải thích đáp án vòng này"* tại màn Review).
- **Request Body:**
  | Trường | Kiểu | Bắt buộc | Mô tả |
  |---|---|---|---|
  | `target_node_id` | `string` | Có | ID của node cha đang chẩn đoán (vd: `c3s1`). |
  | `round_num` | `int` | Có | Thứ tự vòng chẩn đoán hiện tại (1, 2, 3). |
  | `decision` | `string` | Có | Quyết định của engine: `locate`, `escalate`, `restart`. |
  | `records` | `List[RoundRecordIn]` | Có | Chi tiết các câu hỏi làm trong vòng vừa rồi. |
- **Ví dụ Request Body:**
  ```json
  {
    "target_node_id": "c3s1",
    "round_num": 1,
    "decision": "locate",
    "records": [
      {
        "question": "Embedding biến một đoạn văn bản thành định dạng nào?",
        "options": ["Một dãy số thực nhiều chiều (vector)", "Một bức ảnh", "Một câu tóm tắt", "Chuỗi MD5"],
        "correct_idx": 0,
        "selected_idx": 0,
        "sec": 5,
        "flag": "ok"
      }
    ]
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "summary": "Bạn trả lời đúng 2/3 câu nền tảng của mục 3.1 Embedding.",
    "per_question_notes": [
      "Câu 1: Nắm vững định nghĩa vector hoá.",
      "Câu 2: Nhầm lẫn nhẹ giữa hàm khoảng cách và mã hoá mật khẩu.",
      "Câu 3: Phân biệt tốt tính chất tất định của embedding."
    ],
    "advice": "Lỗ hổng không nằm ở gốc rễ khái niệm mà chỉ khu trú ở ứng dụng so sánh vector. Bạn có thể yên tâm chuyển sang bước nhận lộ trình ôn tập."
  }
  ```

---

### 2.3. AI Chatbot Phản Biện Chẩn Đoán

#### `POST /api/v0/ai/chat/message`
- **Mục đích:** Đối thoại giải đáp thắc mắc với AI tại màn Analysis (Nút *"💬 Chưa thuyết phục — hỏi thêm"*). Giúp học viên hiểu lý do hệ thống khoanh vùng lỗ hổng.
- **Ràng buộc an toàn:** Nội dung trả lời 100% neo chặt vào Slide bài học và Cây tri thức, không hallucinate thông tin bên ngoài.
- **Request Body:**
  | Trường | Kiểu | Bắt buộc | Mô tả |
  |---|---|---|---|
  | `target_node_id` | `string` | Có | Node đang bị khoanh vùng nghi vấn. |
  | `weak_signals` | `List[WeakSignalIn]` | Có | Danh sách tín hiệu yếu rút ra từ bài quiz (`node`, `label`, `flag`, `sec`). |
  | `message` | `string` | Có | Câu hỏi / lời phản biện của người học. |
  | `history` | `List[ChatMessage]` | Không | Lịch sử trao đổi trước đó (`role`: "user" \| "assistant", `content`). |
- **Ví dụ Request Body:**
  ```json
  {
    "target_node_id": "c3s1",
    "weak_signals": [
      {
        "node": "l_vec",
        "label": "Văn bản được vector hoá",
        "flag": "wrong",
        "sec": 12
      }
    ],
    "message": "Vì sao hệ thống lại cho rằng mình cần ôn lại phần Embedding?",
    "history": []
  }
  ```
- **Response `200 OK`:**
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

### 2.4. Cây Tri Thức (Knowledge Graph)

#### `GET /api/v0/graph/tree`
- **Mục đích:** Lấy toàn bộ cây tri thức 19 concepts phân cấp (Root $\to$ Chương $\to$ Mục $\to$ Lá) kèm liên kết số trang slide provenance chính xác.
- **Request:** Không có Body hay Query Parameter.
- **Response `200 OK`:**
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

### 2.5. Chẩn Đoán Nền & Quyết Định Thích Ứng (Probes)

#### `GET /api/v0/probes/{target_node_id}`
- **Mục đích:** Lấy bộ 3 câu hỏi chẩn đoán nền của node cha (vd: `c3s1`, `c1`, `c2`) cho màn Probe.
- **Path Parameter:**
  - `target_node_id` (`string`, bắt buộc): ID của node cha cần chẩn đoán.
- **Response `200 OK`:**
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
  - `404 Not Found`: Khi node ID không tồn tại hoặc chưa có bộ câu hỏi chẩn đoán.

---

#### `POST /api/v0/probes/evaluate-round`
- **Mục đích:** Chấm điểm vòng probe và áp dụng luật sư phạm thích ứng để đưa ra quyết định leo cây (`locate`, `escalate`, `restart`).
- **Quy tắc quyết định:**
  - `locate`: Sai $\le 1/3 \to$ Nền tảng vững, lỗ hổng chỉ ở chi tiết $\to$ Khoanh vùng tại node hiện tại.
  - `escalate`: Sai $\ge 2/3 \to$ Hổng ngay cả khái niệm nền $\to$ Leo lên node cha.
  - `restart`: Sai $\ge 2/3$ ở mức root hoặc đã vượt quá 3 vòng chẩn đoán.
- **Request Body:**
  | Trường | Kiểu | Bắt buộc | Mô tả |
  |---|---|---|---|
  | `target_node_id` | `string` | Có | Node đang được chẩn đoán. |
  | `round_num` | `int` | Có | Thứ tự vòng hiện tại (1, 2, 3). |
  | `picked` | `List[int \| null]` | Có | Chỉ số đáp án chọn cho 3 câu. |
  | `times` | `List[int]` | Có | Thời gian làm từng câu (giây). |
- **Response `200 OK`:**
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
      }
    ],
    "trace_entry": {
      "t": "Vòng 1 · 3.1 Embedding",
      "d": "sai/bỏ trống 0/3 (1 câu trả lời chậm)"
    }
  }
  ```

---

### 2.6. AI Giả Thuyết Chẩn Đoán (AI Diagnosis Hypothesis)

#### `POST /api/v0/ai/diagnosis/hypothesis`
- **Mục đích:** AI diễn giải giả thuyết chẩn đoán ban đầu tại màn Analysis dựa trên các tín hiệu yếu từ bài quiz, tuân thủ nguyên tắc HAX G11 và HAX G2.
- **Request Body:**
  | Trường | Kiểu | Mặc định | Mô tả |
  |---|---|---|---|
  | `target_node_id` | `string` | Bắt buộc | Node cha được chọn để kiểm tra nền. |
  | `hits` | `List[SignalHit]` | Bắt buộc | Danh sách tín hiệu yếu (`node`, `label`, `flag`, `sec`). |
  | `only_slow` | `boolean` | `false` | `true` nếu bài làm chỉ có câu trả lời chậm (>25s), không có câu sai. |
  | `rushed_any` | `boolean` | `false` | `true` nếu có câu sai dưới 3s (bấm vội). |
- **Response `200 OK`:**
  ```json
  {
    "target_node_id": "c3s1",
    "target_label": "3.1 Embedding",
    "slide_page": "Slide d1 · trang 21–22",
    "confidence": "trung bình",
    "confidence_explanation": "Mức chắc chắn trung bình: Có 1 câu sai thực sự nhưng cần kiểm tra thêm câu nền để khẳng định.",
    "hypothesis_text": "Tín hiệu yếu của bạn tập trung ở mục '3.1 Embedding'. Có khả năng bạn chưa nắm chắc nguyên lý biểu diễn văn bản trong không gian vector đa chiều.",
    "suggested_action": "Kiểm tra 3 câu nền của mục này để xác định chính xác bạn hổng ở tầng chi tiết hay ở tầng nguyên lý."
  }
  ```

---

### 2.7. AI Lộ Trình Ôn Tập (Remediation Plan)

#### `POST /api/v0/ai/plan/generate`
- **Mục đích:** AI tổng hợp lộ trình ôn tập thích ứng (1–3 mục) trích dẫn đúng số trang slide thật kèm panel giải trình lý do nhận lộ trình tại màn Plan.
- **Request Body:**
  | Trường | Kiểu | Bắt buộc | Mô tả |
  |---|---|---|---|
  | `verdict` | `string` | Có | Kết luận: `located`, `restart`, `self`, `accepted`. |
  | `target_node_id` | `string \| null` | Không | Node chốt lỗ hổng. |
  | `trace` | `List[TraceStep]` | Có | Toàn bộ các bước ghi trong "Dấu vết quyết định". |
- **Response `200 OK`:**
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

### 2.8. Quản Lý Phiên Làm Việc Người Học (Session Management)

#### `POST /api/v0/session`
- **Mục đích:** Khởi tạo phiên làm việc mới, cấp mã UUID và ghi file JSON trạng thái ban đầu tại `app/data/sessions/{id}.json`.
- **Request:** Không có Body.
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

---

#### `GET /api/v0/session/{session_id}`
- **Mục đích:** Khôi phục trạng thái làm bài từ file JSON khi người học tải lại trang hoặc đổi thiết bị.
- **Path Parameter:** `session_id` (`string`, bắt buộc).
- **Response `200 OK`:**
  ```json
  {
    "session_id": "8f3b2c14-52d6-47a3-b42e-cf619a8421d0",
    "state": {
      "stage": "analysis",
      "records": [
        {
          "node": "l_token",
          "sel": 1,
          "correct": true,
          "sec": 12,
          "flag": "ok",
          "answer": 1
        }
      ],
      "target": "c3s1",
      "round": 0,
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
  }
  ```
- **Mã lỗi:** `404 Not Found` nếu mã phiên không tồn tại.

---

#### `PUT /api/v0/session/{session_id}`
- **Mục đích:** Ghi đè trạng thái học tập mới nhất từ client vào file JSON lưu trữ.
- **Path Parameter:** `session_id` (`string`, bắt buộc).
- **Request Body:**
  | Trường | Kiểu | Bắt buộc | Mô tả |
  |---|---|---|---|
  | `stage` | `string` | Có | Giai đoạn hiện tại (`home`, `quiz`, `result`, `explain`, `analysis`, `probe`, `review`, `plan`). |
  | `records` | `List[dict]` | Không | Kết quả bài quiz ban đầu. |
  | `target` | `string \| null` | Không | Node đang chẩn đoán. |
  | `round` | `int` | Không | Thứ tự vòng chẩn đoán hiện tại. |
  | `retry` | `int` | Không | Số lần làm lại vòng. |
  | `hits` | `List[str]` | Không | Danh sách node có tín hiệu yếu. |
  | `round_recs` | `List[dict]` | Không | Kết quả các câu hỏi trong vòng probe. |
  | `decision` | `string \| null` | Không | Quyết định engine (`locate`, `escalate`, `restart`). |
  | `next_target` | `string \| null` | Không | Node tiếp theo nếu leo tầng. |
  | `trace` | `List[TraceStep]` | Không | Lịch sử dấu vết quyết định. |
  | `status` | `Dict[str, str]` | Không | Bản đồ trạng thái của từng node (`ok`, `wrong`, `slow`, v.v.). |
  | `verdict` | `string \| null` | Không | Kết luận lộ trình ôn tập. |
- **Response `200 OK`:** Trả về phiên với `state` đã cập nhật.

---

### 2.9. Health Check

#### `GET /api/v0/health`
- **Mục đích:** Kiểm tra trạng thái hoạt động của server và cấu hình AI.
- **Response `200 OK`:**
  ```json
  {
    "status": "healthy",
    "version": "v0",
    "gemini_configured": true
  }
  ```

---

## 3. Bảng Tra Cứu Trạng Thái & Hằng Số Sư Phạm (Data Dictionary & Enums)

| Tên Thuộc Tính | Giá Trị Hợp Lệ | Ý Nghĩa Sư Phạm & Ngưỡng Kích Hoạt |
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

## 4. Khai Báo TypeScript Interfaces Chuẩn (API Types)

Frontend Developers có thể sao chép trực tiếp các khai báo kiểu dữ liệu sau vào file `frontend/src/types/api.ts`:

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

export interface ExplainRoundRequest {
  target_node_id: string;
  round_num: number;
  decision: DecisionType;
  records: Array<{
    question: string;
    options: string[];
    correct_idx: number;
    selected_idx?: number | null;
    sec: number;
    flag: QuestionFlag;
  }>;
}

export interface ExplainRoundResponse {
  summary: string;
  per_question_notes: string[];
  advice: string;
}

export interface TraceStep {
  t: string;
  d: string;
}

export interface SignalHit {
  node: string;
  label: string;
  flag: QuestionFlag;
  sec: number;
}

export interface DiagnosisHypothesisRequest {
  target_node_id: string;
  hits: SignalHit[];
  only_slow?: boolean;
  rushed_any?: boolean;
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

export interface PlanGenerateRequest {
  verdict: VerdictType;
  target_node_id?: string | null;
  trace: TraceStep[];
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

export interface ChatRequest {
  target_node_id: string;
  weak_signals: Array<{
    node: string;
    label?: string;
    flag: QuestionFlag;
    sec: number;
  }>;
  message: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
  grounded_node: string;
  slide_page: string;
  suggested_actions: string[];
}

export interface TreeNode {
  id: string;
  label: string;
  page: string;
  parent: string | null;
  compact?: string[];
  content_summary?: string;
}

export interface TreeResponse {
  nodes: Record<string, TreeNode>;
}

export interface SessionState {
  stage: string;
  records?: Record<string, any>[];
  target?: string | null;
  round?: number;
  retry?: number;
  hits?: string[];
  round_recs?: Record<string, any>[];
  decision?: string | null;
  next_target?: string | null;
  trace?: TraceStep[];
  status?: Record<string, string>;
  verdict?: string | null;
}

export interface SessionResponse {
  session_id: string;
  state: SessionState;
}
```

---

## 5. Lệnh Kiểm Thử cURL (Smoke Test)

```powershell
# 1. Kiểm tra Health
curl http://localhost:8000/api/v0/health

# 2. Lấy Cây tri thức
curl http://localhost:8000/api/v0/graph/tree

# 3. Lấy đề Quiz
curl http://localhost:8000/api/v0/quiz

# 4. Chấm điểm Quiz
curl -X POST http://localhost:8000/api/v0/quiz/grade `
  -H "Content-Type: application/json" `
  -d '{"picked":[1,0,1,0,0],"times":[10,12,14,8,9]}'

# 5. Lấy câu hỏi chẩn đoán Probe cho node c3s1
curl http://localhost:8000/api/v0/probes/c3s1

# 6. Đánh giá vòng Probe
curl -X POST http://localhost:8000/api/v0/probes/evaluate-round `
  -H "Content-Type: application/json" `
  -d '{"target_node_id":"c3s1","round_num":1,"picked":[0,0,0],"times":[5,6,7]}'
```
