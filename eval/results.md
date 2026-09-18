# Kết quả chạy golden set

Sinh tự động bằng `node eval/run.js --write` · 2026-09-18

**17/20 case đạt (85%)** — luật chẩn đoán trong `mockup/engine.js`, không gọi AI.

20 case nhóm soạn + 0 case do thành viên chạy thật (👤).

| Case | Tình huống | Kỳ vọng | Hệ thống trả về | |
|---|---|---|---|---|
| C01 | Sai 2 câu, cả hai đều thuộc 3.1 Embedding | 3.1 Embedding | 3.1 Embedding | ✅ |
| C02 | Sai 2 câu, cả hai đều thuộc 1.1 Token | 1.1 Token & tokenization | 1.1 Token & tokenization | ✅ |
| C03 | Sai đúng 1 câu ở 2.2 Few-shot | 2.2 Few-shot | 2.2 Few-shot | ✅ |
| C04 | Bỏ trống 2 câu của 3.1 Embedding | 3.1 Embedding | 3.1 Embedding | ✅ |
| C05 | Sai 1 câu token + bỏ trống 1 câu token | 1.1 Token & tokenization | 1.1 Token & tokenization | ✅ |
| C06 | Hoà 1-1: sai 1 câu token (chương 1) và 1 câu embedding (chương 3) | 1.1 Token & tokenization | 1.1 Token & tokenization | ✅ |
| C07 | Hai tín hiệu ở embedding + một tín hiệu ở token (chương nền) | 1.1 Token & tokenization | 3.1 Embedding | ❌ |
| C08 | Đúng hết, nhưng 2 câu embedding mất hơn 25s | 3.1 Embedding | 3.1 Embedding | ✅ |
| C09 | Đúng hết, chậm rải rác ở ba mục khác nhau | (không chẩn đoán) | 1.1 Token & tokenization | ❌ |
| C10 | Sai đúng 1 câu và bấm trong 2 giây | (không chẩn đoán) | 3.1 Embedding | ❌ |
| C11 | Đúng hết, nhanh, dứt khoát | (không chẩn đoán) | (không chẩn đoán) | ✅ |
| C12 | Bỏ trống toàn bộ | 1.1 Token & tokenization | 1.1 Token & tokenization | ✅ |
| C13 | Embedding: sai 2 câu quiz, vòng nền trả lời đúng cả 3 | 3.1 Embedding → located @ 3.1 Embedding | 3.1 Embedding → located @ 3.1 Embedding | ✅ |
| C14 | Embedding: sai 2 câu nền, lên chương RAG thì trả lời đúng | 3.1 Embedding → located @ Chương 3 · RAG | 3.1 Embedding → located @ Chương 3 · RAG | ✅ |
| C15 | Embedding: sai cả vòng mục lẫn vòng chương | 3.1 Embedding → restart @ Chương 3 · RAG | 3.1 Embedding → restart @ Chương 3 · RAG | ✅ |
| C16 | Token: sai 2 câu quiz, vòng nền sai 2/3, lên chương 1 chỉ sai 1 | 1.1 Token & tokenization → located @ Chương 1 · LLM hoạt động thế nào | 1.1 Token & tokenization → located @ Chương 1 · LLM hoạt động thế nào | ✅ |
| C17 | Few-shot: sai quiz, sai cả vòng mục lẫn vòng chương 2 | 2.2 Few-shot → restart @ Chương 2 · Prompting | 2.2 Few-shot → restart @ Chương 2 · Prompting | ✅ |
| C18 | Vòng chẩn đoán bỏ trống 2/3 câu | 3.1 Embedding → located @ Chương 3 · RAG | 3.1 Embedding → located @ Chương 3 · RAG | ✅ |
| C19 | Vòng chẩn đoán đúng cả 3 nhưng câu nào cũng trên 25s | 3.1 Embedding → located @ 3.1 Embedding | 3.1 Embedding → located @ 3.1 Embedding | ✅ |
| C20 | Token: bỏ trống 2 câu quiz, vòng nền sai 3/3, chương 1 sai 3/3 | 1.1 Token & tokenization → restart @ Chương 1 · LLM hoạt động thế nào | 1.1 Token & tokenization → restart @ Chương 1 · LLM hoạt động thế nào | ✅ |

## Case chưa đạt

- **C07** — Có tín hiệu ở cả chương nền lẫn chương sau thì phải xử nền trước, dù chương sau nhiều câu sai hơn — sai nền thì ôn embedding cũng vô ích
- **C09** — Tín hiệu tản mát, không chụm vào mục nào — hệ thống nên nói chưa đủ căn cứ thay vì chọn đại một mục
- **C10** — Bấm nhanh hơn thời gian đọc hết đề thì nhiều khả năng là bấm bừa, không phải không biết — nên hỏi lại câu đó trước khi chẩn đoán
