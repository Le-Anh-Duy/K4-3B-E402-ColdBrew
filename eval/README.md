# eval/ — DỮ LIỆU của bộ đo

> Ý nghĩa từng trường dữ liệu, tên node, tên cạnh: **[`docs/data-model.md`](../docs/data-model.md)**

Chỉ chứa dữ liệu. Script nằm ở `scripts/`.

| File | Nội dung |
|---|---|
| `graph.json` | Cây tri thức, quiz, câu chẩn đoán — **sinh tự động** từ `mockup/data.js` bằng `node scripts/export_graph.js` |
| `cases.json` | 22 case gán nhãn tay. Hồ sơ trả lời **giả**, không dùng dữ liệu học viên thật |
| `human/` | Case do thành viên tự chạy trên trang mock rồi tự gán nhãn |
| `results.md` | Bảng kết quả lượt chạy gần nhất (sinh tự động) |

## Nhãn kỳ vọng gồm gì

```json
"expect": {
  "target": "c3s1",              // node được chọn để chẩn đoán (null = phải từ chối chẩn đoán)
  "final": {
    "scenario": "muc_duoi_tran", // kịch bản kết luận
    "gap": "c3s1",               // chỗ hổng (null = hổng ở chính ý trong quiz)
    "ceiling": "c3",             // node đã xác nhận ổn — trần của vùng hổng
    "prompt": "on_muc_co_tran"   // system prompt được giao cho AI ở kịch bản này
  }
}
```

**Bốn kịch bản:** `y_le` (nền tầng trên đúng hết → hổng ở chính ý) · `muc_nong` (sai 1/3 câu nền) · `muc_duoi_tran` (mục trượt, tầng trên đạt) · `nen_bai` (trượt tới nền, học lại cả bài).

Nguyên tắc gán nhãn: **chỗ hổng là node sâu nhất bị trượt**, node đạt là **trần** — không phải "hổng ở node vừa hỏi".

## Chưa phủ

Kịch bản "câu quiz gây nhiễu" (hổng-ở-ý nhưng hỏi thêm câu bám sát ý đó vẫn đúng) · retry vòng chẩn đoán · học viên chọn tự ôn · thời gian đúng bằng ngưỡng 25s/3s · nội dung do LLM sinh (suite S2).
