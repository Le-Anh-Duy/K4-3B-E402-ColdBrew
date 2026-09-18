# ColdBrew frontend

React 18 + Vite. Giao diện giữ design system ColdBrew hiện tại và sử dụng luồng học thích ứng của mockup:

`đăng nhập → chọn bài → làm toàn bộ quiz → kết quả → giả thuyết → probe nhiều vòng → lộ trình → retest → đánh giá`

## Chạy

```powershell
cd codebase/frontend
npm install
npm run dev
```

Mở http://localhost:5173. Có thể chạy không cần backend; frontend tự chuyển sang dữ liệu demo. Tài khoản đăng nhập chỉ là identity demo: dùng email bất kỳ và mật khẩu từ 6 ký tự, không dùng mật khẩu thật.

Backend đầy đủ:

```powershell
cd codebase/backend
py -3.12 -m uvicorn app.main:app --reload --port 8000
```

Vite proxy `/api` tới `http://localhost:8000`. Có thể đặt `VITE_API_BASE_URL` khi backend chạy ở origin khác. Không đưa API key hoặc cấu hình provider vào frontend.

## Luồng học

- Quiz hiển thị mỗi màn một câu, cho quay lại, bỏ chọn, bỏ qua và ghi thời gian.
- Chỉ chấm sau khi nộp toàn bộ quiz để phản hồi của câu trước không ảnh hưởng câu sau.
- Tín hiệu gồm `ok`, `slow`, `wrong`, `rush`, `skip`.
- Sau kết quả, giải thích đáp án và chẩn đoán nền là hai nhánh độc lập.
- Trước probe, hệ thống trình bày tín hiệu, giả thuyết và độ chắc chắn để học viên xác nhận hoặc hỏi lại.
- Mỗi vòng probe dừng ở màn kết quả; học viên có thể đi tiếp, làm lại hoặc tự ôn.
- Lộ trình gắn với node và nguồn trong cây tri thức.
- Tự báo “đã ôn xong” mở retest; phải đúng toàn bộ mới xoá cờ cần ôn.
- Số sao/chip lý do đo chất lượng lời tư vấn, không thay đổi mastery.

Phiên đang làm và flow state được lưu ở localStorage để resume sau điều hướng hoặc reload. Khi backend hoạt động, frontend đồng thời cập nhật `/api/v0/session`.

## Cấu trúc

- `components/`: design-system component, layout và navigation.
- `screens/LearningScreen.jsx`: các màn của luồng học thích ứng và component trình bày.
- `services/learningService.js`: adapter duy nhất giữa UI, API v0 và fallback demo.
- `mocks/demo.js`: dữ liệu offline; đáp án chỉ tồn tại ở adapter demo.
- `api.js`: các request `/api/v0` cho quiz, graph, explain, chat, probes, diagnosis, plan và session.
- `tests/flows.spec.js`: browser test cho quiz theo lô, hypothesis, probe, plan, retest, rating, history và responsive.

## Backend được sử dụng

| Nghiệp vụ | Endpoint |
|---|---|
| Cây tri thức | `GET /api/v0/graph/tree` |
| Câu hỏi quiz | `GET /api/v0/quiz` |
| Chấm quiz và tín hiệu thời gian | `POST /api/v0/quiz/grade` |
| Giả thuyết chẩn đoán | `POST /api/v0/ai/diagnosis/hypothesis` |
| Chat phản biện | `POST /api/v0/ai/chat/message` |
| Lấy/chấm probe | `GET /api/v0/probes/{node}` · `POST /api/v0/probes/evaluate-round` |
| Sinh lộ trình | `POST /api/v0/ai/plan/generate` |
| Lưu phiên | `POST/PUT/GET /api/v0/session` |

Nếu graph API không sẵn sàng, trang chủ dùng catalog demo và toàn bộ luồng vẫn hoạt động offline. Nội dung offline được gắn nhãn rõ là demo và không tạo citation giả.

## Kiểm thử

```powershell
npm run build
npm run test:e2e
```

E2E mặc định chạy offline với Microsoft Edge và bỏ qua hai live test. Để kiểm tra backend thật:

```powershell
$env:RUN_LIVE_API_TESTS='1'
npm run test:e2e
```

Có thể đổi browser qua `PLAYWRIGHT_CHANNEL=chrome` hoặc `chromium` nếu browser tương ứng đã được Playwright cài đặt.

## Giới hạn hiện tại

- Authentication vẫn là demo phía trình duyệt.
- Fallback offline chỉ mô phỏng một tầng probe; leo cây đầy đủ cần backend.
- Câu hỏi đang làm được giữ khi điều hướng trong app; flow-level state được resume sau reload, nhưng lựa chọn chưa nộp ở ngay giữa một bộ câu hỏi chưa được phục hồi.
- Lịch sử hoàn thành lưu theo email trên trình duyệt; backend session hiện chưa phải kho dữ liệu người dùng production.
