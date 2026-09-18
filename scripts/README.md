# scripts/ — bộ đo, chia theo người

> Ý nghĩa dữ liệu mà các script này đọc: **[`docs/data-model.md`](../docs/data-model.md)**

Dữ liệu nằm ở `eval/`. Sửa `mockup/data.js` xong thì chạy lại `node scripts/export_graph.js`.

| Suite | Lệnh | Đo gì | Trạng thái |
|---|---|---|---|
| **S1 · Chẩn đoán** | `python scripts/run.py --write` | gap · trần · kịch bản · prompt được giao, trên 22 case | ✅ 22/22 |
| **S2 · Nội dung AI** | `python scripts/grounding.py` | mỗi lượt gọi Gemini: có trích dẫn · mã đoạn có thật · không nói ngoài cây · đủ khung của mức | ❌ chờ endpoint |
| **S3 · Người thật** | chạy trang mock → xuất case → điền nhãn vào `eval/human/` | nhãn người vs nhãn nhóm · sao lời tư vấn | ❌ số = 0 |
| **S4 · Không gãy & độ phủ** | `node scripts/smoke.js` · `python scripts/coverage.py` | trang có dựng được · % câu hỏi thật map được vào cây | ✅ smoke · ❌ coverage |

Chạy chung mỗi khi sửa luật:

```
node   scripts/export_graph.js   # nếu vừa sửa data.js
python scripts/run.py --write
python scripts/parity.py         # engine.py vs engine.js phải khớp
node   scripts/smoke.js          # trang không trắng
python scripts/calibrate.py      # ngưỡng thời gian, khi eval/human/ có dữ liệu
```

**`parity.py` là chốt chặn quan trọng nhất:** luật tồn tại hai bản — `scripts/engine.py` (bản đo, sau này là backend) và `mockup/engine.js` (bản chạy trang mock offline). Lệch nhau là số đo không còn nói về cái đang chạy. Khi backend FastAPI lên, `engine.js` bị xoá và parity hết nhiệm vụ.
