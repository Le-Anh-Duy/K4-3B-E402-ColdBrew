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

Giữ nguyên Vite proxy `/api` tới localhost:8000. Chưa giả định endpoint nghiệp vụ mới, chưa gọi `/api/llm-check`. Thay adapter theo API được team bàn giao; không cần thay prompt/tools từ frontend. Nhận định nguyên nhân sai hiện là demo, không phải kết luận từ AI. Chưa có đường dẫn slide thật nên UI không tạo citation giả. Các mini lesson là nội dung demo.

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
