# ColdBrew frontend

React 18 + Vite. Giao diện tiếng Việt: đăng nhập/đăng ký → chọn quiz → chẩn đoán demo → kiểm tra prerequisite tối đa hai vòng → tổng hợp hoặc ôn chuyên sâu.

## Chạy

```powershell
cd codebase/frontend
npm install
npm run dev
```

Mở http://localhost:5173. Không cần backend để trải nghiệm demo. Dùng email bất kỳ và mật khẩu từ 6 ký tự (không dùng mật khẩu thật). Đăng ký kiểm tra xác nhận mật khẩu; đây không phải dịch vụ tài khoản thật. Không lưu mật khẩu. Ghi nhớ đăng nhập dùng localStorage; mặc định dùng sessionStorage.

```powershell
npm run build
npm run test:e2e
```

E2E dùng Microsoft Edge cài trên máy. Đổi trình duyệt bằng `$env:PLAYWRIGHT_CHANNEL='chrome'` hoặc `'chromium'` (cần cài browser tương ứng cho Playwright).

## Cấu trúc và tích hợp

- `components/`: button, progress, answer/question card, feedback, layout và navigation.
- `screens/`: authentication, home/progress và luồng học.
- `services/authService.js`: identity demo, là điểm thay bằng authentication API thật.
- `services/learningService.js`: contract dữ liệu frontend; thay implementation bằng HTTP và map response backend tại đây. Các phương thức: getCatalog, startQuiz, grade, getSupport, getHistory, saveSession.
- `services/learningFlow.js`: chuyển trạng thái của luồng học, giới hạn hai vòng prerequisite.
- `mocks/demo.js`: dữ liệu minh họa, tách khỏi components. Quiz 3 hoặc 5 câu, bốn chủ đề. Đáp án nằm ở adapter demo; khi nối API, grading phải thực hiện ở backend.
- `tests/flows.spec.js`: browser tests A–F, đăng ký, navigation, hoàn thành quiz và mobile.

Giữ nguyên Vite proxy `/api` tới localhost:8000. Backend working tree hiện chỉ có `GET /api/health` và `GET /api/llm-check`. Không gọi `/api/v0/*` vì backend local không đăng ký các route đó. Nhận định nguyên nhân sai hiện là demo, không phải kết luận từ AI. Chưa có đường dẫn slide thật nên UI không tạo citation giả. Các mini lesson là nội dung demo.

## Kết nối backend hiện tại

Chạy backend trong terminal riêng, từ root repository:

```powershell
cd codebase/backend
py -3.12 -m uvicorn app.main:app --reload --port 8000
```

`app/llm.py` gọi `load_dotenv()` và đọc `GEMINI_API_KEY`, `OPENAI_BASE_URL`, `MODEL` ở backend. `.env` ở root được tìm bằng cơ chế đi lên thư mục cha. Không copy `.env` hoặc khóa provider vào frontend. Không cần frontend biết API key.

Frontend chỉ dùng `VITE_API_BASE_URL` (public backend origin, ví dụ `http://localhost:8000`). Để trống dùng Vite proxy hiện tại. `VITE_DATA_MODE=demo` tắt health check tự động để dùng offline; giá trị mặc định cho phép health check nhưng **không biến dữ liệu học tập thành API thật**.

| Function | Endpoint | Request | Response / nguồn dữ liệu |
|---|---|---|---|
| `backendService.health()` | GET `/api/health` | Không body | `{ ok: true, model: string }` |
| `backendService.checkLlm()` | GET `/api/llm-check` | Không body | `{ reply: string }`, lời gọi LLM thật tại backend |
| `learningService.getCatalog()` | Health check độc lập nếu online | Không body | Danh mục demo, vì chưa có API danh mục |
| `startQuiz`, `grade`, `explain` | Chưa có API nghiệp vụ | Không gửi HTTP | Demo hiện có |
| `getSupport`, `getReview` | Chưa có API nghiệp vụ | Không gửi HTTP | Câu tương tự, prerequisite, tổng hợp, ôn sâu: demo |
| `saveProgress`, `readSession` | Chưa có API phiên | Không gửi HTTP | Bộ nhớ frontend, không resume sau reload |
| `getHistory`, `saveSession` | Chưa có API lịch sử | Không gửi HTTP | localStorage theo email |
| `authService` | Chưa có API auth | Không gửi HTTP | Identity demo, không xác thực mật khẩu |

`apiClient.js` là nơi duy nhất gọi fetch. Lỗi HTTP chỉ đưa status ra frontend; không hiển thị nội dung lỗi provider. `checkLlm()` không trả mock thành công khi backend lỗi. Nút quiz không gọi `llm-check` vì endpoint đó chỉ gửi prompt cố định yêu cầu trả lời “ok”, không chấm hay giải thích câu hỏi.

Để kiểm tra thủ công bằng frontend service mà không thêm màn hình, mở DevTools Console trên Vite dev server:

```js
const { backendService } = await import('/src/services/backendService.js')
await backendService.health()
await backendService.checkLlm()
```

Health được kiểm tra tự động khi tải dashboard. Trạng thái kết nối có thể đọc bằng `learningService.getConnectionStatus()`; backend offline không chặn phần học demo.

## Kiểm thử tích hợp thật

Sau khi backend đang chạy, từ thư mục frontend:

```powershell
$env:RUN_LIVE_API_TESTS='1'
npm run test:e2e
```

Hai live tests gọi service từ trình duyệt qua Vite proxy tới backend, không mock response. Test LLM gọi provider thật qua `/api/llm-check`, không đọc `.env`, không ghi nội dung provider vào báo cáo. Các tests khác kiểm tra A–F, xử lý lỗi và bảo đảm không gọi route không tồn tại. Khi không bật `RUN_LIVE_API_TESTS`, hai live tests được bỏ qua; tests lỗi dùng response giả được ghi rõ trong tên/mã test.

Kết quả kiểm tra ngày 18/09/2026: build thành công; 15/16 E2E pass (gồm A–F và health thật). Live LLM test không đạt: backend trả HTTP 500; kiểm tra trực tiếp hàm `ask()` chỉ lấy loại lỗi/status cho thấy provider trả `NotFoundError` / HTTP 404. Chưa xác nhận nguyên nhân cụ thể ở URL/model/provider; không thay cấu hình `.env`, không sửa backend và không giả kết quả thành công.

Phiên đang làm được giữ khi điều hướng Trang chủ / Quiz / Tiến độ, nhưng chưa resume sau reload. Lịch sử các phiên đã kết thúc được lưu theo email trên trình duyệt; điểm chỉ tính câu quiz gốc, không tính câu củng cố. Quay lại Quiz sau nhánh ôn sẽ đi đến câu kế tiếp; dùng “Thử lại câu ban đầu” trong Tổng hợp để làm lại câu gốc. Kết thúc sớm lưu số câu đã làm, không đánh dấu cả quiz đã hoàn thành.

## Test tay A–F

Chọn mặc định Day 01 → Mô hình ngôn ngữ → 5 câu. Câu đầu: **A đúng**, B/C/D sai. Ví dụ tương tự: **B đúng**. Prerequisite cả hai vòng: **A đúng**, B sai. Basic question chuyên sâu: **A đúng**, B sai.

- A: đăng nhập → bắt đầu → A → Kiểm tra → Câu tiếp theo.
- B: câu đầu B → Kiểm tra → Xem giải thích → Thử một ví dụ khác → B → Kiểm tra → Quay lại Quiz.
- C: câu đầu B → giải thích → ví dụ khác → A (sai) → Kiểm tra → Kiểm tra kiến thức nền → vòng 1.
- D: câu đầu B → giải thích → Tiếp tục ôn → vòng 1 B → Kiểm tra → Tiếp tục vòng 2 → B → Kiểm tra → Chọn cách ôn tập → Tổng hợp kiến thức.
- E: như D tới chọn cách ôn → Ôn tập chuyên sâu → B → Kiểm tra → Ôn lại phần này.
- F: như E nhưng chọn A → Kiểm tra → Quay lại Quiz ban đầu hoặc Kết thúc phiên học.

Tạo quiz mới từ Trang chủ để bắt đầu lại mỗi nhánh. Vòng 1 hoặc 2 trả lời đúng sẽ đưa tới câu kiểm tra lại concept. Trả lời sai câu kiểm tra lại đưa tới ôn tập, không tạo vòng 3.

Font Be Vietnam Pro được đóng gói cục bộ bằng Fontsource; không cần gọi Google Fonts khi chạy ứng dụng.
