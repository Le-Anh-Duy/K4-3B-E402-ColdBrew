# Mining bằng chứng — chatlog VLearn

Sinh bởi `scripts/mining.py` · 2026-09-18. Data pack không nằm trong repo; chạy lại script để tái lập.

## Luật đếm

- Quần thể: `cohort_hint == K4` (khoá hiện tại). Bỏ K3.
- **Bỏ câu mẫu bấm sẵn** (`is_preset`) — đó là nút của giao diện, không phải câu học viên nghĩ ra.
- Đơn vị **không phải turn**: hai câu của cùng một học viên cách nhau > 30 phút được tính là **hai dịp hỏi** khác nhau. Đếm theo turn thì mọi hội thoại dài hơn một tin đều bị tính là 'hỏi lại', con số sẽ phồng lên vô nghĩa.
- **Mục bài học** = nhãn trong tiền tố `(Đang học phần "…" của buổi này)` do giao diện VLearn tự gắn vào câu hỏi — không phải nhóm tự chia. K4 có 118 mục; độ mịn không đều.
- **Dịp hỏi** = một cụm câu hỏi liền mạch; cách nhau > 30 phút là hai dịp khác nhau.
- Chỉ số 3–5 là **hành vi**, không phải nguyên nhân: 'quay lại mục đó' không đồng nghĩa 'hỏi lại vì chưa hiểu'. Hai dịp hỏi về cùng một mục thường là hai câu hỏi khác nhau.
- Từ khoá cho chỉ số ôn/chưa hiểu: `ôn lại, học lại, xem lại, ôn tập, nhắc lại, giải thích lại, chưa hiểu, không hiểu, khó hiểu, vẫn chưa, quên mất, nên ôn, ôn phần, ôn thế nào, lú, rối quá`.

## Quy mô

| Lớp lọc | Lượt | Học viên |
|---|---|---|
| Toàn pack | 13494 | 1617 |
| K4 | 3097 | 448 |
| K4, bỏ câu mẫu | 2555 | 384 |
| … có nhãn phần học | 2468 | 369 |

## Kết quả

| # | Chỉ số | Kết quả |
|---|---|---|
| 1 | Tutor **hỏi ngược** để chẩn đoán (`ask_probing_question`) | 6/2555 = 0.2% |
| 2 | Tutor **giảng lại khái niệm** (`review_concept`) | 2226/2555 = 87% |
| 3 | Học viên **quay lại hỏi thêm về cùng một mục bài học ở một dịp khác** | 106/369 = 29% |
| 4 | … ở **≥3 dịp** | 25/369 = 6.8% |
| 5 | … quay lại **vào một ngày khác** | 26/369 = 7.0% |
| 6 | Câu hỏi mang ý *ôn / học lại / chưa hiểu* | 58/2555 = 2.3% |
| 7 | Câu trả lời tutor **không trích nguồn** | 838/2555 = 33% |
| 8 | Lượt có học viên **bấm đánh giá** (`rating`) | 8/2555 = 0.3% |
| 9 | Lượt có tutor **chấm mức hiểu** (`understanding_level`) | 6/2555 = 0.2% |

Khoảng cách giữa hai dịp hỏi liên tiếp về cùng một mục: trung vị **1.4 giờ**, p90 **22.3 giờ** (n=166 cặp) — tức không phải hỏi dồn một lúc, mà có cả quay lại hôm sau.

## Độ nhạy của chỉ số 3 theo cỡ mục

118 mục rất lệch cỡ: trung vị **7 lượt**, lớn nhất **269**. Mục càng to thì 'quay lại cùng mục' càng dễ xảy ra một cách tầm thường, nên phải kiểm:

| Giới hạn ở | Tỉ lệ |
|---|---|
| tất cả 118 mục | **106/369 = 28.7%** |
| bỏ 5 mục lớn nhất | 50/284 = 17.6% |
| chỉ mục lớn (> trung vị) | 104/357 = 29.1% |
| chỉ mục nhỏ (≤ trung vị) | 4/84 = 4.8% |

Con số **phụ thuộc mạnh vào cỡ mục**. Nhưng ở mục nhỏ, **64% cặp (học viên × mục) chỉ hỏi đúng một câu** — không có cơ hội quay lại — nên chênh lệch phần lớn là do **ít tiếp xúc**, không phải do mục to làm số phồng lên. Mức thận trọng nên báo cáo là con số **bỏ 5 mục lớn nhất**.

## Quote nguyên văn (mã lượt, cắt ngắn theo luật data pack)

*Minh hoạ định tính cho chỉ số 6, không phải thống kê — xem phần hạn chế.*

- **[T10291]** *"Dựa trên tiến độ của mình, mình nên ôn phần nào trước?"*
- **[T10317]** *"giải thích lại dc không hơi khó hiểu"*
- **[T10319]** *"Đừng cố hiểu cả hàm một lúc. Hãy hình dung call_openai như một hộp có 4 việc: nhận câu hỏi → gửi câu hỏi → lấy"*
- **[T10326]** *"Giải thích lại giúp mình phần mà mình hay thấy khó."*
- **[T10536]** *"Đang không hiểu gì chớt  Đoạn đang hỏi: “— vẽ dữ liệu nhiều chiều lên mặt phẳng.”"*
- **[T10696]** *"target của việc ôn tập là gì, kiểm tra cuối tuần à"*
- **[T10705]** *"tôi muốn hỏi về các bước làm bài, cách test. Tôi thấy lúc nộp lab là nộp link github mà hiện tại trong mục này"*
- **[T10728]** *"bước 2 là gì tôi đang chưa hiểu, tại sao lại cộng trọng số và cộng vào đâu"*
