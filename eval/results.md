# Kết quả chạy golden set

Sinh tự động bằng `node eval/run.js --write` · 2026-09-18

**20/20 case đạt (100%)** — luật chẩn đoán trong `mockup/engine.js`, không gọi AI.

20 case nhóm soạn + 0 case do thành viên chạy thật (👤).

| Case | Tình huống | Kỳ vọng | Hệ thống trả về | |
|---|---|---|---|---|
| C01 | Sai 2 câu, cả hai đều thuộc 3.1 Double Diamond | 3.1 Double Diamond: phân kỳ – hội tụ | 3.1 Double Diamond: phân kỳ – hội tụ | ✅ |
| C02 | Sai 2 câu, cả hai đều thuộc 1.1 Yêu cầu mơ hồ | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể | ✅ |
| C03 | Sai đúng 1 câu ở 3.2 Làm đúng cái sai | 3.2 Làm đúng cái sai vs làm sai cái đúng | 3.2 Làm đúng cái sai vs làm sai cái đúng | ✅ |
| C04 | Bỏ trống 2 câu của 3.1 Double Diamond | 3.1 Double Diamond: phân kỳ – hội tụ | 3.1 Double Diamond: phân kỳ – hội tụ | ✅ |
| C05 | Sai 1 câu + bỏ trống 1 câu, cùng mục 1.1 | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể | ✅ |
| C06 | Hoà 1-1: sai 1 câu ở mục 1.1 (chương 1) và 1 câu ở mục 3.1 (chương 3) | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể | ✅ |
| C07 | Hai tín hiệu ở mục 3.1 + một tín hiệu ở mục 1.1 (tiền đề của 3.1) | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể | ✅ |
| C08 | Đúng hết, nhưng 2 câu của mục 3.1 mất hơn 25s | 3.1 Double Diamond: phân kỳ – hội tụ | 3.1 Double Diamond: phân kỳ – hội tụ | ✅ |
| C09 | Đúng hết, chậm rải rác ở ba mục khác nhau | (không chẩn đoán) | (không chẩn đoán) | ✅ |
| C10 | Sai đúng 1 câu và bấm trong 2 giây | (không chẩn đoán) | (không chẩn đoán) | ✅ |
| C11 | Đúng hết, nhanh, dứt khoát | (không chẩn đoán) | (không chẩn đoán) | ✅ |
| C12 | Bỏ trống toàn bộ 5 câu | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể | ✅ |
| C13 | Mục 3.1: sai 2 câu quiz, vòng nền trả lời đúng cả 3 | 3.1 Double Diamond: phân kỳ – hội tụ → located @ 3.1 Double Diamond: phân kỳ – hội tụ | 3.1 Double Diamond: phân kỳ – hội tụ → located @ 3.1 Double Diamond: phân kỳ – hội tụ | ✅ |
| C14 | Mục 3.1: sai 2 câu nền, lên chương 3 thì trả lời đúng | 3.1 Double Diamond: phân kỳ – hội tụ → located @ Chương 3 · Tìm đúng vấn đề | 3.1 Double Diamond: phân kỳ – hội tụ → located @ Chương 3 · Tìm đúng vấn đề | ✅ |
| C15 | Mục 3.1: sai cả vòng mục lẫn vòng chương | 3.1 Double Diamond: phân kỳ – hội tụ → restart @ Chương 3 · Tìm đúng vấn đề | 3.1 Double Diamond: phân kỳ – hội tụ → restart @ Chương 3 · Tìm đúng vấn đề | ✅ |
| C16 | Mục 1.1: sai 2 câu quiz, vòng nền sai 2/3, lên chương 1 chỉ sai 1 | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể → located @ Chương 1 · Vì sao phải tìm đúng bài toán | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể → located @ Chương 1 · Vì sao phải tìm đúng bài toán | ✅ |
| C17 | Mục 3.2: sai quiz, sai cả vòng mục lẫn vòng chương 3 | 3.2 Làm đúng cái sai vs làm sai cái đúng → restart @ Chương 3 · Tìm đúng vấn đề | 3.2 Làm đúng cái sai vs làm sai cái đúng → restart @ Chương 3 · Tìm đúng vấn đề | ✅ |
| C18 | Vòng chẩn đoán bỏ trống 2/3 câu | 3.1 Double Diamond: phân kỳ – hội tụ → located @ Chương 3 · Tìm đúng vấn đề | 3.1 Double Diamond: phân kỳ – hội tụ → located @ Chương 3 · Tìm đúng vấn đề | ✅ |
| C19 | Vòng chẩn đoán đúng cả 3 nhưng câu nào cũng trên 25s | 3.1 Double Diamond: phân kỳ – hội tụ → located @ 3.1 Double Diamond: phân kỳ – hội tụ | 3.1 Double Diamond: phân kỳ – hội tụ → located @ 3.1 Double Diamond: phân kỳ – hội tụ | ✅ |
| C20 | Mục 1.1: bỏ trống 2 câu quiz, vòng nền sai 3/3, chương 1 sai 3/3 | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể → restart @ Chương 1 · Vì sao phải tìm đúng bài toán | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể → restart @ Chương 1 · Vì sao phải tìm đúng bài toán | ✅ |

## Case chưa đạt

Không có.
