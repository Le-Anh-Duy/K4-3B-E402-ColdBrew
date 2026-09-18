# S2 · Số đo nội dung AI (CP3)

Model `gemini-3.5-flash-lite` · sinh bằng `python scripts/grounding.py --api` (qua backend thật)

**Thử 20 lượt, 16 lượt đạt (80%).**

Chuẩn đạt (chốt trước khi chạy): ① mọi mã đoạn trích ra tồn tại trong cây · ② không trích lạc ngoài tư liệu được cấp · ③ có trích dẫn và có câu tự kiểm.

| Case | Kịch bản | ① có thật | ② không lạc | ③ đủ khung | Đạt | ④ nối vòng | Hợp lý? (người tick) |
|---|---|---|---|---|---|---|---|
| P01 | y_le | ✅ | ✅ | ✅ | ✅ | — |  |
| P02 | y_le | ✅ | ✅ | ✅ | ✅ | — |  |
| P03 | y_le | ✅ | ❌ | ❌ | ❌ | — |  |
| P04 | muc_nong | ✅ | ✅ | ✅ | ✅ | — |  |
| P05 | muc_nong | ✅ | ✅ | ✅ | ✅ | — |  |
| P06 | muc_nong | ✅ | ✅ | ✅ | ✅ | — |  |
| P07 | muc_duoi_tran | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| P08 | muc_duoi_tran | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| P09 | muc_duoi_tran | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| P10 | nen_bai | ✅ | ❌ | ✅ | ❌ | — |  |
| P11 | nen_bai | ✅ | ✅ | ✅ | ✅ | — |  |
| P12 | nen_bai | ✅ | ❌ | ✅ | ❌ | — |  |
| P13 | y_le | ✅ | ✅ | ✅ | ✅ | — |  |
| P14 | muc_duoi_tran | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| P15 | y_le | ✅ | ✅ | ✅ | ✅ | — |  |
| P16 | y_le | ✅ | ✅ | ✅ | ✅ | — |  |
| P17 | muc_duoi_tran | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| P18 | nen_bai | ✅ | ✅ | ✅ | ✅ | — |  |
| P19 | y_le | ✅ | ✅ | ❌ | ❌ | — |  |
| P20 | muc_nong | ✅ | ✅ | ✅ | ✅ | — |  |

## Nội dung AI sinh ra

### P01 · y_le · hổng: (ý trong quiz)

```
Bước phân kỳ trong Double Diamond là mở rộng góc nhìn để thu insight [T01-071]. Phương án chọn "Vẽ ma trận tác động – nỗ lực" là sai về nội dung vì kỹ thuật này không phải là phân kỳ dùng để mở rộng góc nhìn thu insight theo định nghĩa của bài.
Tự kiểm: Bước phân kỳ dùng để làm gì và gồm kỹ thuật nào? — trả lời trôi trong 30 giây thì coi như đã nắm.

Pha hội tụ dùng các kỹ thuật như gom nhóm, Five Whys, lọc trùng [T01-074]. Phương án chọn "Mở rộng góc nhìn để có thêm insight" là sai về nội dung vì đây là đặc điểm của phân kỳ, không phải là hội tụ.
Tự kiểm: Pha hội tụ dùng những kỹ thuật nào? — trả lời trôi trong 30 giây thì coi như đã nắm.
```

### P02 · y_le · hổng: (ý trong quiz)

```
Phải bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-006] thay vì có quán tính nhảy thẳng vào giải pháp [T01-004] [T01-016]. Phương án chọn giải pháp phổ biến là sai về nội dung vì bài giảng khuyến nghị bóc tách yêu cầu rồi verify với stakeholder chứ không phải chọn giải pháp theo thị trường.
Tự kiểm: Bóc tách yêu cầu xong cần làm gì với stakeholder? — trả lời trôi trong 30 giây thì coi như đã nắm.
```

### P03 · y_le · hổng: (ý trong quiz)

```
Việc làm đúng cái sai (tức là làm một việc không cần làm hoặc giải quyết sai vấn đề) là nguy hiểm hơn vì nó lãng phí nguồn lực và thời gian đi sai hướng [T01-060, T01-061]. Phương án chọn "Làm sai cái đúng" là sai vì khi làm đúng cái đúng nghĩa là đang giải quyết đúng vấn đề, chỉ là thao tác chưa chuẩn nên dễ sửa chữa và ít nguy hiểm hơn việc làm hoàn toàn sai việc ngay từ đầu [T01-050, T01-060].

Tự kiểm: Vì sao làm đúng cái sai lại nguy hiểm hơn làm sai cái đúng? (trả lời trôi trong 30 giây thì coi như đã nắm).
```

### P04 · muc_nong · hổng: c3s1

```
Phần này bạn đang thiếu ý phân kỳ là mở rộng góc nhìn để thu insight [T01-071] và hội tụ dùng gom nhóm, Five Whys, lọc trùng [T01-074]. Kỹ thuật "Vẽ ma trận tác động – nỗ lực" là sai vì nó dùng để đánh giá giải pháp chứ không phải để mở rộng góc nhìn thu insight ở pha phân kỳ. Còn "Mở rộng góc nhìn để có thêm insight" là sai vì đó là bản chất của phân kỳ chứ không phải kỹ thuật gom nhóm, lọc trùng hay Five Whys của pha hội tụ.

Tự kiểm: Phân kỳ và hội tụ trong Double Diamond khác nhau thế nào? Trả lời trôi trong 30 giây thì coi như đã nắm.
```

### P05 · muc_nong · hổng: c1s1

```
Mình nhắc lại mảnh bạn đang thiếu là quán tính nhảy thẳng vào giải pháp và cách bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-004] [T01-006] [T01-016].
Bạn chọn giải pháp tốn nhiều tiền là sai về nội dung vì bản chất nguy hiểm nằm ở quán tính nhảy thẳng vào giải pháp, khiến ta làm sai ngay từ gốc mà không tìm đúng bài toán cần giải [T01-001] [T01-004] [T01-017].
Chọn giải pháp phổ biến là sai về nội dung vì khi gặp yêu cầu chung chung, ta cần bóc tách yêu cầu mơ hồ rồi verify với stakeholder chứ không áp dụng máy móc giải pháp ngoài thị trường [T01-006] [T01-016].
Tự kiểm: Bạn đã nhớ cách chuyển từ yêu cầu mơ hồ sang bài toán cụ thể chưa? Trả lời trôi trong 30 giây thì coi như đã nắm.
```

### P06 · muc_nong · hổng: c3s2

```
Bạn đang nhầm lẫn ở chỗ: làm sai cái đúng không nguy hiểm bằng làm đúng cái sai, vì làm đúng cái sai nghĩa là tối ưu hóa và làm rất nhanh một việc từ đầu đã không mang lại giá trị [T01-060] [T01-061]. Cách nhớ là "sai từ gốc" (làm đúng cái sai) thì công sức bỏ ra càng phá hủy kết quả nhiều hơn so với việc định hướng đúng nhưng thực hiện chưa chuẩn.

Tự kiểm: Tại sao làm đúng cái sai lại nguy hiểm hơn làm sai cái đúng? Trả lời trôi trong 30 giây thì coi như đã nắm.
```

### P07 · muc_duoi_tran · hổng: c3s1

```
Nền tảng của bạn ở Chương 3 · Tìm đúng vấn đề đã xác nhận ổn [T01-030] [T01-073]. Mục đang hổng là 3.1 Double Diamond với cấu trúc phân kỳ – hội tụ [T01-049] [T01-069] [T01-071] [T01-074]. Bạn đã nhầm lẫn kỹ thuật giữa hai pha này do chọn ma trận tác động - nỗ lực cho phân kỳ và chọn mở rộng góc nhìn cho hội tụ, trong khi thực tế phân kỳ là mở rộng góc nhìn để thu insight [T01-071] còn hội tụ là gom nhóm, Five Whys, lọc trùng [T01-074]. Bạn nên ôn lại theo thứ tự từ phân kỳ rồi đến hội tụ [T01-071] [T01-074].
Tự kiểm: Phân kỳ và hội tụ trong Double Diamond khác nhau thế nào? (trả lời trôi trong 30 giây thì coi như đã nắm).
```

### P08 · muc_duoi_tran · hổng: c1s1

```
Nền tảng của bạn ở Chương 1 · Vì sao phải tìm đúng bài toán đã được xác nhận ổn [T01-001] [T01-017], làm nhẹ gánh cho phần tiếp theo. 
Mục 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể cho thấy bạn đang hổng về việc quán tính nhảy thẳng vào giải pháp [T01-004] [T01-016] và cách bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-006]. 
Thứ tự bạn nên ôn lại là bắt đầu từ quán tính nhảy thẳng vào giải pháp, sau đó đến bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-004] [T01-006] [T01-016]. Ở câu 1, việc chọn giải pháp tốn nhiều tiền là sai về nội dung vì vấn đề nguy hiểm nằm ở quán tính nhảy thẳng vào giải pháp thay vì tìm đúng bài toán. Ở câu 2, chọn giải pháp phổ biến là sai về nội dung vì bài giảng khuyến nghị bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-006].

Tự kiểm: Quán tính nhảy thẳng vào giải pháp và việc bóc tách yêu cầu khác nhau như thế nào? (trả lời trôi trong 30 giây thì coi như đã nắm).
```

### P09 · muc_duoi_tran · hổng: c3s2

```
Nền về Chương 3 · Tìm đúng vấn đề của bạn đã xác nhận ổn [T01-030], [T01-073]. Tuy nhiên, bạn đang hổng ở phần 3.2 Làm đúng cái sai vs làm sai cái đúng khi chọn "Làm sai cái đúng" là nguy hiểm hơn [T01-050], [T01-059], [T01-060], [T01-061]. Phương án này sai về nội dung vì việc làm đúng cái sai mới là nguy hiểm hơn, bởi vì khi đó bạn tốn toàn bộ nguồn lực và thời gian để giải quyết một vấn đề không có thật hoặc đi lạc hướng hoàn toàn [T01-060], [T01-061]. Thứ tự bạn nên ôn lại là xem kỹ lại phần 3.2 để phân biệt rõ mức độ ảnh hưởng giữa làm đúng cái sai và làm sai cái đúng [T01-050], [T01-059], [T01-060], [T01-061].

Tự kiểm: Vì sao làm đúng cái sai lại nguy hiểm hơn làm sai cái đúng? (Trả lời trôi trong 30 giây thì coi như đã nắm).
```

### P10 · nen_bai · hổng: c3

```
Do bạn sai tới tận phần nền, mình đề nghị bạn học lại cả bài theo thứ tự các chương [T01-030].
Xác định đúng vấn đề trước; công nghệ chỉ là công cụ để giải nó [T01-004].
Double Diamond: phân kỳ rồi hội tụ, làm hai lần — vấn đề trước, giải pháp sau [T01-049].
Chọn việc bằng ma trận tác động – nỗ lực, ưu tiên high impact / low effort [T01-079].
Thứ tự các chương nên đi lại gồm Chương 1, Chương 2, Chương 3, và Chương 4 [T01-001], [T01-018], [T01-030], [T01-074].
Tự kiểm: Bạn đã làm lại quiz sau khi ôn chưa? Trả lời trôi trong 30 giây thì coi như đã nắm.
```

### P11 · nen_bai · hổng: c1

```
Bạn sai tới tận phần nền, không khoanh nhỏ hơn được. Mình đề nghị bạn học lại cả bài theo thứ tự. 

Ba ý cốt lõi của bài: Xác định đúng vấn đề trước; công nghệ chỉ là công cụ để giải nó [T01-004] | Double Diamond: phân kỳ rồi hội tụ, làm hai lần — vấn đề trước, giải pháp sau [T01-049] | Chọn việc bằng ma trận tác động – nỗ lực, ưu tiên high impact / low effort [T01-079].
Thứ tự các chương nên đi lại: Chương 1 · Vì sao phải tìm đúng bài toán, Chương 2 · Đặc thù của sản phẩm AI, Chương 3 · Tìm đúng vấn đề, Chương 4 · Chọn bài toán để làm.
Tự kiểm: Nhắc làm lại quiz sau khi ôn — bạn có thể giải thích lại quy trình Double Diamond và cách chọn bài toán không, trả lời trôi trong 30 giây thì coi như đã nắm?
```

### P12 · nen_bai · hổng: c3

```
* Xác định đúng vấn đề trước; công nghệ chỉ là công cụ để giải nó [T01-004]
* Double Diamond: phân kỳ rồi hội tụ, làm hai lần — vấn đề trước, giải pháp sau [T01-049]
* Chọn việc bằng ma trận tác động – nỗ lực, ưu tiên high impact / low effort [T01-079]

Thứ tự các chương nên đi lại: Chương 1 · Vì sao phải tìm đúng bài toán [T01-001], Chương 2 · Đặc thù của sản phẩm AI [T01-018], Chương 3 · Tìm đúng vấn đề [T01-030], Chương 4 · Chọn bài toán để làm [T01-074]. Bạn chọn làm sai cái đúng là sai vì làm sai cái đúng nghĩa là giải pháp sai cho vấn đề đúng, ta có thể sửa được giải pháp, còn làm đúng cái sai nghĩa là giải pháp rất tối ưu nhưng giải quyết nhầm vấn đề không có thật, lãng phí toàn bộ nguồn lực [T01-050], [T01-059], [T01-060], [T01-061].

Tự kiểm: Nhắc làm lại quiz sau khi ôn? (Cách dùng: trả lời trôi trong 30 giây thì coi như đã nắm).
```

### P13 · y_le · hổng: (ý trong quiz)

```
Bước phân kỳ dùng để mở rộng góc nhìn để thu insight [T01-071]. Phương án bạn chọn là bỏ trống, sai vì phân kỳ thực chất là mở rộng góc nhìn để thu insight chứ không phải không có kỹ thuật gì [T01-071].
Tự kiểm: Bước phân kỳ trong Double Diamond dùng để làm gì? — trả lời trôi trong 30 giây thì coi như đã nắm.
```

### P14 · muc_duoi_tran · hổng: c1s1

```
Nền tảng ở Chương 1 · Vì sao phải tìm đúng bài toán đã được xác nhận ổn [T01-001] [T01-017], giúp bạn giảm bớt gánh nặng khi học phần tiếp theo. Phần này tư liệu chưa nói rõ về thứ tự nên ôn lại. Mục bạn đang hổng là 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể [T01-004] [T01-006] [T01-016], nơi cần tránh quán tính nhảy thẳng vào giải pháp [T01-004] [T01-016] và thực hiện bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-006].

Tự kiểm: Vì sao phải bóc tách yêu cầu mơ hồ rồi verify với stakeholder trước khi làm? — trả lời trôi trong 30 giây thì coi như đã nắm.
```

### P15 · y_le · hổng: (ý trong quiz)

```
Bước phân kỳ là mở rộng góc nhìn để thu insight [T01-071]. Phương án chọn "Vẽ ma trận tác động – nỗ lực" là sai vì đây không phải là kỹ thuật mở rộng góc nhìn để thu insight [T01-071].
Tự kiểm: Bạn phân biệt thế nào giữa phân kỳ và hội tụ trong Double Diamond? Trả lời trôi trong 30 giây thì coi như đã nắm.

Pha hội tụ dùng các kỹ thuật gồm gom nhóm, Five Whys, lọc trùng [T01-074]. Phương án chọn "Mở rộng góc nhìn để có thêm insight" là sai vì đây là đặc điểm và mục đích của bước phân kỳ, không phải là kỹ thuật gom nhóm, Five Whys hay lọc trùng của pha hội tụ [T01-071] [T01-074].
Tự kiểm: Kỹ thuật nào được dùng trong pha hội tụ? Trả lời trôi trong 30 giây thì coi như đã nắm.
```

### P16 · y_le · hổng: (ý trong quiz)

```
Quán tính nhảy thẳng vào giải pháp là hiện tượng khi nhận yêu cầu mơ hồ, ta lập tức lao đi làm mà không xác định đúng bài toán [T01-004], [T01-016]. Bạn chọn phương án cho rằng việc này nguy hiểm vì tốn nhiều tiền là sai nội dung, vì tư liệu chỉ ra sự nguy hiểm nằm ở việc làm sai ngay từ đầu hoặc làm đúng cái sai, chứ tư liệu không nói nguyên nhân là tốn nhiều tiền [T01-001], [T01-017].
Tự kiểm: Quán tính nhảy thẳng vào giải pháp dẫn đến hậu quả gì cho công việc? (trả lời trôi trong 30 giây thì coi như đã nắm).
```

### P17 · muc_duoi_tran · hổng: c1s1

```
Nền tảng ở Chương 1 · Vì sao phải tìm đúng bài toán đã xác nhận ổn [T01-001] [T01-017]. Mục 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể đang nói về việc quán tính nhảy thẳng vào giải pháp và cách bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-004] [T01-006] [T01-016]. Bạn nên ôn lại theo thứ tự từ quán tính nhảy thẳng vào giải pháp đến bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-004] [T01-006] [T01-016]. Đối với câu hỏi về lý do thói quen nhảy thẳng vào giải pháp nguy hiểm, phương án chọn "Vì giải pháp thường tốn nhiều tiền" là sai vì nội dung này không phải là lý do được nhắc đến khi nói về quán tính nhảy thẳng vào giải pháp [T01-004] [T01-016].

Tự kiểm: Quán tính nhảy thẳng vào giải pháp là gì và ta cần làm gì với yêu cầu mơ hồ? (trả lời trôi trong 30 giây thì coi như đã nắm).
```

### P18 · nen_bai · hổng: c1

```
Chào bạn, mình thấy bạn sai tới tận phần nền nên không khoanh nhỏ hơn được. Mình đề nghị bạn học lại cả bài theo thứ tự.

- Ba ý cốt lõi của bài: Xác định đúng vấn đề trước; công nghệ chỉ là công cụ để giải nó [T01-004] | Double Diamond: phân kỳ rồi hội tụ, làm hai lần — vấn đề trước, giải pháp sau [T01-049] | Chọn việc bằng ma trận tác động – nỗ lực, ưu tiên high impact / low effort [T01-079]
- Thứ tự các chương nên đi lại: Chương 1 · Vì sao phải tìm đúng bài toán, sau đó đến Day 2 (sáng) · Xác định bài toán kinh doanh cho AI, tiếp theo là 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể, rồi 1.2 Product manager và project manager, sau đó tới Chương 2 · Đặc thù của sản phẩm AI, tiếp theo là Chương 3 · Tìm đúng vấn đề, và cuối cùng là Chương 4 · Chọn bài toán để làm.

Tự kiểm: Nhắc làm lại quiz sau khi ôn? — trả lời trôi trong 30 giây thì coi như đã nắm.
```

### P19 · y_le · hổng: (ý trong quiz)

```
Khi sếp đưa yêu cầu chung chung, cách làm đúng là bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-006]. Phương án chọn giải pháp phổ biến nhất trên thị trường là sai vì thực tế ta cần bóc tách yêu cầu mơ hồ rồi verify với stakeholder, chứ không phải đi theo quán tính nhảy thẳng vào giải pháp khi đối mặt với yêu cầu chung chung [T01-004] [T01-006].

Tự kiểm: Khi nhận yêu cầu mơ hồ từ sếp, bạn cần làm gì trước khi nghĩ đến giải pháp, trả lời trôi trong 30 giây thì coi như đã nắm.
```

### P20 · muc_nong · hổng: c3s1

```
Bạn đang nhầm lẫn giữa hai pha của Double Diamond: phân kỳ dùng để mở rộng góc nhìn để thu insight [T01-071], còn hội tụ dùng gom nhóm, Five Whys, lọc trùng [T01-074]. Cách nhớ là "Phân" là chia ra rộng để lấy insight, "Hội" là gom lại bằng Five Whys hay lọc trùng.

Tự kiểm: Phân kỳ và hội tụ trong Double Diamond khác nhau thế nào? (trả lời trôi trong 30 giây thì coi như đã nắm).
```
