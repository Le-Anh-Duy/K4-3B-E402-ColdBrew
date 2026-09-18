# S1 · Kết quả chạy golden set

Sinh tự động bằng `python scripts/run.py --write`

**22/22 case đạt (100%)** — luật chẩn đoán `scripts/engine.py`, không gọi AI.

22 case nhóm soạn + 0 case do thành viên chạy thật (👤).

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
| C09 | Đúng hết, chậm rải rác ở ba mục khác nhau | (ý trong quiz) | (ý trong quiz) | ✅ |
| C10 | Sai đúng 1 câu và bấm trong 2 giây | (ý trong quiz) | (ý trong quiz) | ✅ |
| C11 | Đúng hết, nhanh, dứt khoát | (ý trong quiz) | (ý trong quiz) | ✅ |
| C12 | Bỏ trống toàn bộ 5 câu | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể | ✅ |
| C13 | Mục 3.1: sai 2 câu quiz, vòng nền trả lời đúng cả 3 | 3.1 Double Diamond: phân kỳ – hội tụ → y_le · hổng: (ý trong quiz) · trần: 3.1 Double Diamond: phân kỳ – hội tụ | 3.1 Double Diamond: phân kỳ – hội tụ → y_le · hổng: (ý trong quiz) · trần: 3.1 Double Diamond: phân kỳ – hội tụ | ✅ |
| C14 | Mục 3.1: sai 2 câu nền, lên chương 3 thì trả lời đúng | 3.1 Double Diamond: phân kỳ – hội tụ → muc_duoi_tran · hổng: 3.1 Double Diamond: phân kỳ – hội tụ · trần: Chương 3 · Tìm đúng vấn đề | 3.1 Double Diamond: phân kỳ – hội tụ → muc_duoi_tran · hổng: 3.1 Double Diamond: phân kỳ – hội tụ · trần: Chương 3 · Tìm đúng vấn đề | ✅ |
| C15 | Mục 3.1: sai cả vòng mục lẫn vòng chương | 3.1 Double Diamond: phân kỳ – hội tụ → nen_bai · hổng: Chương 3 · Tìm đúng vấn đề · trần: Chương 3 · Tìm đúng vấn đề | 3.1 Double Diamond: phân kỳ – hội tụ → nen_bai · hổng: Chương 3 · Tìm đúng vấn đề · trần: Chương 3 · Tìm đúng vấn đề | ✅ |
| C16 | Mục 1.1: sai 2 câu quiz, vòng nền sai 2/3, lên chương 1 chỉ sai 1 | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể → muc_duoi_tran · hổng: 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể · trần: Chương 1 · Vì sao phải tìm đúng bài toán | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể → muc_duoi_tran · hổng: 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể · trần: Chương 1 · Vì sao phải tìm đúng bài toán | ✅ |
| C17 | Mục 3.2: sai quiz, sai cả vòng mục lẫn vòng chương 3 | 3.2 Làm đúng cái sai vs làm sai cái đúng → nen_bai · hổng: Chương 3 · Tìm đúng vấn đề · trần: Chương 3 · Tìm đúng vấn đề | 3.2 Làm đúng cái sai vs làm sai cái đúng → nen_bai · hổng: Chương 3 · Tìm đúng vấn đề · trần: Chương 3 · Tìm đúng vấn đề | ✅ |
| C18 | Vòng chẩn đoán bỏ trống 2/3 câu | 3.1 Double Diamond: phân kỳ – hội tụ → muc_duoi_tran · hổng: 3.1 Double Diamond: phân kỳ – hội tụ · trần: Chương 3 · Tìm đúng vấn đề | 3.1 Double Diamond: phân kỳ – hội tụ → muc_duoi_tran · hổng: 3.1 Double Diamond: phân kỳ – hội tụ · trần: Chương 3 · Tìm đúng vấn đề | ✅ |
| C19 | Vòng chẩn đoán đúng cả 3 nhưng câu nào cũng trên 25s | 3.1 Double Diamond: phân kỳ – hội tụ → y_le · hổng: (ý trong quiz) · trần: 3.1 Double Diamond: phân kỳ – hội tụ | 3.1 Double Diamond: phân kỳ – hội tụ → y_le · hổng: (ý trong quiz) · trần: 3.1 Double Diamond: phân kỳ – hội tụ | ✅ |
| C20 | Mục 1.1: bỏ trống 2 câu quiz, vòng nền sai 3/3, chương 1 sai 3/3 | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể → nen_bai · hổng: Chương 1 · Vì sao phải tìm đúng bài toán · trần: Chương 1 · Vì sao phải tìm đúng bài toán | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể → nen_bai · hổng: Chương 1 · Vì sao phải tìm đúng bài toán · trần: Chương 1 · Vì sao phải tìm đúng bài toán | ✅ |
| C21 | Mục 3.1: sai 2 câu quiz, vòng nền chỉ sai 1/3 | 3.1 Double Diamond: phân kỳ – hội tụ → muc_nong · hổng: 3.1 Double Diamond: phân kỳ – hội tụ · trần: 3.1 Double Diamond: phân kỳ – hội tụ | 3.1 Double Diamond: phân kỳ – hội tụ → muc_nong · hổng: 3.1 Double Diamond: phân kỳ – hội tụ · trần: 3.1 Double Diamond: phân kỳ – hội tụ | ✅ |
| C22 | Mục 1.1: sai 2 câu quiz, vòng nền chỉ sai 1/3 | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể → muc_nong · hổng: 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể · trần: 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể | 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể → muc_nong · hổng: 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể · trần: 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể | ✅ |

## 4 case chờ tính năng — giả định nhóm đặt ra, chưa build

| Case | Tình huống | Giả định phải đạt | Đang thiếu |
|---|---|---|---|
| C23 | Làm lại vòng: trượt vòng 1 ở mục 3.1, bấm làm lại, lần 2 đúng hết | lời tư vấn phải nhắc: lần đầu sai 2/3, làm lại mới đúng — nên ôn lại cho chắc | chưa build — engine không mang lịch sử vòng, prompt không nhận số lần làm lại |
| C24 | Học viên chọn tự ôn, sau đó kiểm tra lại đúng hết | kết luận ghi rõ: cờ hổng xoá nhờ kiểm tra lại, KHÔNG phải nhờ học viên tự khai | chưa build — trạng thái sau retest chưa được đưa vào phần tư vấn |
| C25 | Hai vòng: mục 3.1 trượt, chương 3 đạt — tư vấn phải nhắc đúng câu đã sai ở vòng 1 | nêu đích danh khía cạnh đã sai, không phải cả mục | chưa build — prompt chỉ nhận gap/trần, không nhận từng câu nền đã sai |
| C26 | Bỏ dở ở vòng 2, mở lại phiên | mở lại là vào thẳng vòng đang dở, dấu vết còn nguyên | chưa kiểm tự động — resume có chạy (localStorage) nhưng chưa có case nào kiểm |

## Case chưa đạt

Không có.
