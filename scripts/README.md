# scripts/ — bộ đo, chia theo người

> Ý nghĩa dữ liệu mà các script này đọc: **[`docs/data-model.md`](../docs/data-model.md)**

Dữ liệu nằm ở `eval/`. Sửa `mockup/data.js` xong thì chạy lại `node scripts/export_graph.js`.

| Suite | Lệnh | Đo gì | Trạng thái |
|---|---|---|---|
| **S1 · Chẩn đoán** | `python scripts/run.py --write` | gap · trần · kịch bản · prompt được giao, trên 22 case | ✅ 22/22 |
| **S2 · AI-response check** | `python scripts/grounding.py [--api]` | 20 hồ sơ qua Gemini thật: mã đoạn có thật · không trích lạc · đủ khung (+ ④ nối vòng, báo riêng) | ✅ 20/20 |
| **S3 · Người chấm AI-response** | `python scripts/review_ui.py` → `python scripts/review_summary.py` | 3 câu người phải trả lời + mức đồng thuận giữa các người chấm | ⏳ chờ nhóm chấm |
| **S4 · Không gãy & độ phủ** | `node scripts/smoke.js` · `python scripts/coverage.py` | trang có dựng được · % câu hỏi thật map được vào cây | ✅ smoke · ❌ coverage |

Chạy chung mỗi khi sửa luật:

```
node   scripts/export_graph.js   # nếu vừa sửa data.js
python scripts/run.py --write
python scripts/parity.py         # engine.py vs engine.js phải khớp
node   scripts/smoke.js          # trang không trắng
python scripts/calibrate.py      # ngưỡng thời gian, khi eval/human/ có dữ liệu
```

## Kiểm tự động một câu trả lời lẻ

```
python scripts/validate.py "<câu trả lời của AI>" [kịch bản]
```

`scripts/validate.py` là **bộ kiểm độc lập, nằm ngoài backend** — service lo sinh nội dung,
soi nội dung là việc của bộ đo. Không gọi LLM, chạy tức thì. Nó đếm và soi:

| Kiểm | Nội dung |
|---|---|
| Trích dẫn | tổng số lần trích · số mã đoạn khác nhau · tách **hợp lệ / bịa (không có trong cây) / lạc (có trong cây nhưng ngoài tư liệu đã cấp)** |
| Đủ số trích | theo kịch bản: `y_le` ≥1 · `muc_nong` ≥1 · `muc_duoi_tran` ≥2 · `nen_bai` ≥3 |
| Đúng khung | có **đúng một** dòng mở đầu bằng `Tự kiểm:` |
| Độ dài | 25–320 từ (ngắn hơn là rỗng ruột, dài hơn là lan man) |

`grounding.py` gọi chính hàm này cho từng lượt (tiêu chí ⑤), nên số đo một câu lẻ và số đo cả
lượt luôn khớp định nghĩa.

## Chấm tay — mỗi người một bản

```
python scripts/grounding.py      # AI sinh sẵn câu trả lời, đóng băng vào eval/grounding.json
python scripts/review_ui.py      # mở localhost:5599, nhập TÊN, chấm 3 câu mỗi thẻ
python scripts/review_summary.py # gộp các bản chấm + đo đồng thuận
```

Mỗi người nhập tên riêng khi mở UI, bản chấm lưu vào `eval/review/<tên>.json`, **không đè lên nhau**.
`review_summary.py` in tỉ lệ từng người, **mức khớp giữa từng cặp** và danh sách **chỗ chấm lệch**.
Theo §2.6 của đề: hai người lệch quá 20% số case thì **định nghĩa "đạt" còn mơ hồ** — sửa định nghĩa
chứ không phải sửa sản phẩm.

**`parity.py` là chốt chặn quan trọng nhất:** luật tồn tại hai bản — `scripts/engine.py` (bản đo, sau này là backend) và `mockup/engine.js` (bản chạy trang mock offline). Lệch nhau là số đo không còn nói về cái đang chạy. Khi backend FastAPI lên, `engine.js` bị xoá và parity hết nhiệm vụ.
