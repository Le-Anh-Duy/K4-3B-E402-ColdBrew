# Mockup CP2 · ColdBrew

Bản mock **bấm được**, mock data, chưa gọi AI.

```
python -m http.server 5500
# mở http://localhost:5500/mockup/   (chạy lệnh ở thư mục gốc repo)
```

`index.html` (theme + CDN React) · `app.jsx` (luồng) · `data.js` (cây tri thức + câu hỏi mock) · `flow.md` (sơ đồ luồng + sequence + quy tắc chẩn đoán).

**Quiz:** mỗi màn một câu, có đồng hồ đếm giờ, cho bỏ qua / bỏ chọn / quay lại câu trước.
**Tín hiệu yếu** = sai · bỏ trống · sai rất nhanh (<3s) · đúng nhưng chậm (>25s).

Hết mỗi vòng chẩn đoán có **màn quyết định**: đi tiếp lên tầng trên · làm lại vòng này · mình tự ôn được. Hệ thống không tự leo tầng.

Cây tri thức dựng tay từ `transcript-01-clean.md` (Day 2 sáng · Xác định bài toán kinh doanh cho AI), 30 node, provenance là mã đoạn `[T01-NNN]`.

Đường demo: sai câu 4 và 5 (đều thuộc mục *3.1 Double Diamond*) → *AI Suggestion* → chẩn đoán ở 3.1 → xem phân tích → kiểm tra tiếp *Chương 3* → lộ trình ôn + panel "vì sao" → tư vấn cách ôn → kiểm tra lại.
