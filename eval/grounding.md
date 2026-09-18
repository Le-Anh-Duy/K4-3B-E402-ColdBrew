# S2 · Số đo nội dung AI (CP3)

Model `gemini-3.5-flash-lite` · sinh bằng `python scripts/grounding.py`

**Thử 20 lượt, 20 lượt đạt (100%).**

Chuẩn đạt (chốt trước khi chạy): ① mọi mã đoạn trích ra tồn tại trong cây · ② không trích lạc ngoài tư liệu được cấp · ③ có trích dẫn và có câu tự kiểm.

| Case | Kịch bản | ① có thật | ② không lạc | ③ đủ khung | Đạt | ④ nối vòng | Hợp lý? (người tick) |
|---|---|---|---|---|---|---|---|
| P01 | y_le | ✅ | ✅ | ✅ | ✅ | — |  |
| P02 | y_le | ✅ | ✅ | ✅ | ✅ | — |  |
| P03 | y_le | ✅ | ✅ | ✅ | ✅ | — |  |
| P04 | muc_nong | ✅ | ✅ | ✅ | ✅ | — |  |
| P05 | muc_nong | ✅ | ✅ | ✅ | ✅ | — |  |
| P06 | muc_nong | ✅ | ✅ | ✅ | ✅ | — |  |
| P07 | muc_duoi_tran | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| P08 | muc_duoi_tran | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| P09 | muc_duoi_tran | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| P10 | nen_bai | ✅ | ✅ | ✅ | ✅ | — |  |
| P11 | nen_bai | ✅ | ✅ | ✅ | ✅ | — |  |
| P12 | nen_bai | ✅ | ✅ | ✅ | ✅ | — |  |
| P13 | y_le | ✅ | ✅ | ✅ | ✅ | — |  |
| P14 | muc_duoi_tran | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| P15 | y_le | ✅ | ✅ | ✅ | ✅ | — |  |
| P16 | y_le | ✅ | ✅ | ✅ | ✅ | — |  |
| P17 | muc_duoi_tran | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| P18 | nen_bai | ✅ | ✅ | ✅ | ✅ | — |  |
| P19 | y_le | ✅ | ✅ | ✅ | ✅ | — |  |
| P20 | muc_nong | ✅ | ✅ | ✅ | ✅ | — |  |

## Nội dung AI sinh ra

### P01 · y_le · hổng: (ý trong quiz)

```
Phần này tư liệu chưa nói rõ. [T01-049] [T01-069] [T01-071] [T01-074]

Bạn chọn vẽ ma trận hoặc mở rộng góc nhìn là chưa đúng với kỹ thuật của từng pha [T01-071] [T01-074].

Pha hội tụ dùng những kỹ thuật nào theo tư liệu?
```

### P02 · y_le · hổng: (ý trong quiz)

```
Ý đó nói về việc từ yêu cầu mơ hồ cần chuyển thành bài toán cụ thể [T01-004], [T01-006], [T01-016].

Phương án bạn chọn là sai vì quán tính nhảy thẳng vào giải pháp không đề cập đến việc chọn giải pháp phổ biến nhất trên thị trường [T01-004], [T01-016].

Theo bạn, khi nhận được yêu cầu chung chung từ sếp thì bước đầu tiên cần làm là gì?
```

### P03 · y_le · hổng: (ý trong quiz)

```
Ý "Làm đúng cái sai" nguy hiểm hơn vì khi làm đúng cái sai, bạn đã giải quyết sai vấn đề [T01-060] [T01-061].

Phương án bạn chọn là sai vì "làm sai cái đúng" không phải là cái nguy hiểm hơn được nêu trong bài [T01-060] [T01-061].

Giữa việc làm đúng cái sai và làm sai cái đúng, cái nào nguy hiểm hơn theo bài giảng?
```

### P04 · muc_nong · hổng: c3s1

```
Bạn đang thiếu kiến thức về các kỹ thuật của pha phân kỳ, hội tụ và Double Diamond: phân kỳ – hội tụ [T01-049] [T01-069] [T01-071] [T01-074].
Bạn hãy nhớ rằng phân kỳ là mở rộng góc nhìn để thu insight [T01-071], còn hội tụ là gom nhóm, Five Whys, lọc trùng [T01-074].
Pha hội tụ trong Double Diamond dùng những kỹ thuật nào?
```

### P05 · muc_nong · hổng: c1s1

```
Bạn đang thiếu ý về quán tính nhảy thẳng vào giải pháp [T01-004] [T01-016]. Khi gặp yêu cầu, thay vì nhảy ngay vào giải pháp, bạn cần bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-006]. 

Cách nhớ là hãy dừng lại để bóc tách vấn đề trước khi nghĩ đến cách giải quyết.

Vì sao bạn lại dễ mắc quán tính nhảy thẳng vào giải pháp khi nghe một yêu cầu chung chung?
```

### P06 · muc_nong · hổng: c3s2

```
Phần bạn đang thiếu là làm đúng cái sai nguy hiểm hơn [T01-060] [T01-061]. 

Bạn hãy nhớ rằng việc cố gắng hoàn thành xuất sắc một việc từ đầu đã không cần thiết sẽ tai hại hơn nhiều so với việc thực hiện chưa chuẩn một mục tiêu đúng hướng [T01-060] [T01-061]. 

Vì sao việc làm đúng cái sai lại nguy hiểm hơn theo bài học?
```

### P07 · muc_duoi_tran · hổng: c3s1

```
Nền tảng ở Chương 3 · Tìm đúng vấn đề của bạn đã được xác nhận ổn [T01-030] [T01-073], nên chúng ta chỉ cần vá đúng mục đang hổng.
Mục 3.1 Double Diamond nhắc đến phân kỳ là mở rộng góc nhìn để thu insight, còn hội tụ là gom nhóm, Five Whys, lọc trùng [T01-049] [T01-069] [T01-071] [T01-074].
Thứ tự bạn nên ôn lại là xem lại khái niệm phân kỳ trước, rồi sau đó ôn tiếp sang pha hội tụ.
Kỹ thuật nào được dùng trong pha hội tụ để xử lý dữ liệu?
```

### P08 · muc_duoi_tran · hổng: c1s1

```
Nền Chương 1 · Vì sao phải tìm đúng bài toán đã xác nhận ổn [T01-001] [T01-017].
Mục 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể đang nói về quán tính nhảy thẳng vào giải pháp và việc bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-004] [T01-006] [T01-016].
Thứ tự nên ôn lại là xem lại Chương 1 rồi chuyển sang 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể.
Vì sao thói quen nhảy thẳng vào giải pháp lại nguy hiểm?
```

### P09 · muc_duoi_tran · hổng: c3s2

```
Nền tảng của bạn ở Chương 3 · Tìm đúng vấn đề đã được xác nhận ổn rồi, nên bây giờ chúng ta chỉ cần vá đúng mục đang hổng [T01-030] [T01-073].

Phần này tư liệu chưa nói rõ [T01-050] [T01-059] [T01-060] [T01-061].

Thứ tự nên ôn lại là xem xét nội dung 3.2 Làm đúng cái sai vs làm sai cái đúng [T01-050] [T01-059] [T01-060] [T01-061].

Giữa làm đúng cái sai và làm sai cái đúng, cái nào nguy hiểm hơn [T01-060] [T01-061]?
```

### P10 · nen_bai · hổng: c3

```
Học viên sai tới tận phần nền, không khoanh nhỏ hơn được. Đề nghị bạn học lại cả bài theo thứ tự, giọng bình tĩnh, không phán xét.

- Xác định đúng vấn đề trước; công nghệ chỉ là công cụ để giải nó [T01-004]
- Double Diamond: phân kỳ rồi hội tụ, làm hai lần — vấn đề trước, giải pháp sau [T01-049]
- Chọn việc bằng ma trận tác động – nỗ lực, ưu tiên high impact / low effort [T01-079]

Thứ tự các chương nên đi lại:
- Chương 3 · Tìm đúng vấn đề [T01-030] [T01-073]
- Day 2 (sáng) · Xác định bài toán kinh doanh cho AI [T01-001] [T01-089]
- 3.1 Double Diamond: phân kỳ – hội tụ [T01-049] [T01-069] [T01-071] [T01-074]
- 3.2 Làm đúng cái sai vs làm sai cái đúng [T01-050] [T01-059] [T01-060] [T01-061]
- 3.3 First principle thinking [T01-062] [T01-064] [T01-068]
- 3.4 Kỹ thuật khám phá vấn đề [T01-042] [T01-045] [T01-048] [T01-072]

Bạn có làm lại quiz sau khi ôn không?
```

### P11 · nen_bai · hổng: c1

```
Xác định đúng vấn đề trước; công nghệ chỉ là công cụ để giải nó [T01-004]
Double Diamond: phân kỳ rồi hội tụ, làm hai lần — vấn đề trước, giải pháp sau [T01-049]
Chọn việc bằng ma trận tác động – nỗ lực, ưu tiên high impact / low effort [T01-079]

Chương 1 · Vì sao phải tìm đúng bài toán [T01-001]
Day 2 (sáng) · Xác định bài toán kinh doanh cho AI [T01-001]
1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể [T01-004]
1.2 Product manager và project manager [T01-008]

Bạn có thể làm lại quiz sau khi ôn không?
```

### P12 · nen_bai · hổng: c3

```
Phần này tư liệu chưa nói rõ | Xác định đúng vấn đề trước; công nghệ chỉ là công cụ để giải nó [T01-004]
Double Diamond: phân kỳ rồi hội tụ, làm hai lần — vấn đề trước, giải pháp sau [T01-049]
Chọn việc bằng ma trận tác động – nỗ lực, ưu tiên high impact / low effort [T01-079]

Chương 3 · Tìm đúng vấn đề [T01-030] [T01-073]
Day 2 (sáng) · Xác định bài toán kinh doanh cho AI [T01-001] [T01-089]
3.1 Double Diamond: phân kỳ – hội tụ [T01-049] [T01-069] [T01-071] [T01-074]
3.2 Làm đúng cái sai vs làm sai cái đúng [T01-050] [T01-059] [T01-060] [T01-061]
3.3 First principle thinking [T01-062] [T01-064] [T01-068]
3.4 Kỹ thuật khám phá vấn đề [T01-042] [T01-045] [T01-048] [T01-072]

Bạn có thể làm lại quiz sau khi ôn không?
```

### P13 · y_le · hổng: (ý trong quiz)

```
Ý phân kỳ trong Double Diamond là mở rộng góc nhìn để thu insight [T01-071]. Phương án bạn chọn là bỏ trống vì chưa nêu được kỹ thuật mở rộng góc nhìn để thu insight này [T01-071]. Pha hội tụ dùng những kỹ thuật nào [T01-074]?
```

### P14 · muc_duoi_tran · hổng: c1s1

```
Phần nền Chương 1 · Vì sao phải tìm đúng bài toán đã xác nhận ổn [T01-001] [T01-017].
Mục 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể nói về việc quán tính nhảy thẳng vào giải pháp, cần bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-004] [T01-006] [T01-016].
Thứ tự nên ôn lại là nhìn lại quán tính nhảy thẳng vào giải pháp và cách bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-004] [T01-006] [T01-016].
Vì sao quán tính nhảy thẳng vào giải pháp lại nguy hiểm?
```

### P15 · y_le · hổng: (ý trong quiz)

```
Phân kỳ là mở rộng góc nhìn để thu insight, còn hội tụ là gom nhóm, Five Whys, lọc trùng [T01-071] [T01-074]. 

Bạn chọn nhầm vì đã nhầm lẫn kỹ thuật giữa hai pha này với nhau. 

Pha phân kỳ trong mô hình Double Diamond dùng để làm gì [T01-049] [T01-071]?
```

### P16 · y_le · hổng: (ý trong quiz)

```
Ý bạn vừa chọn ở câu 1 chưa chính xác vì phần này tư liệu chưa nói rõ [T01-004] [T01-006] [T01-016].
Phương án bạn chọn là sai vì tư liệu không đề cập đến việc giải pháp tốn nhiều tiền [T01-004] [T01-006] [T01-016].
Vì sao thói quen nhảy thẳng vào giải pháp lại nguy hiểm theo tư liệu?
```

### P17 · muc_duoi_tran · hổng: c1s1

```
Nền tảng của bạn ở Chương 1 · Vì sao phải tìm đúng bài toán đã xác nhận ổn [T01-001] [T01-017], nên ta chỉ cần vá đúng mục này.
Phần 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể nói về quán tính nhảy thẳng vào giải pháp và cách bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-004] [T01-006] [T01-016].
Bạn nên ôn lại theo thứ tự từ quán tính nhảy thẳng vào giải pháp đến bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-004] [T01-006] [T01-016].
Khi nhận yêu cầu mơ hồ, bạn cần làm gì trước khi đưa ra giải pháp?
```

### P18 · nen_bai · hổng: c1

```
- Xác định đúng vấn đề trước; công nghệ chỉ là công cụ để giải nó [T01-004]
- Double Diamond: phân kỳ rồi hội tụ, làm hai lần — vấn đề trước, giải pháp sau [T01-049]
- Chọn việc bằng ma trận tác động – nỗ lực, ưu tiên high impact / low effort [T01-079]

- Chương 1 · Vì sao phải tìm đúng bài toán [T01-001] [T01-017]
- Day 2 (sáng) · Xác định bài toán kinh doanh cho AI [T01-001] [T01-089]
- 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể [T01-004] [T01-006] [T01-016]
- 1.2 Product manager và project manager [T01-008] [T01-011]

Bạn có thể làm lại quiz sau khi ôn không?
```

### P19 · y_le · hổng: (ý trong quiz)

```
Cách làm đúng được khuyến nghị là bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-006]. 

Việc bạn chọn giải pháp phổ biến là do quán tính nhảy thẳng vào giải pháp khi đối mặt với yêu cầu mơ hồ [T01-004] [T01-016]. 

Khi sếp đưa yêu cầu chung chung, bạn cần làm gì trước khi nghĩ đến giải pháp [T01-004] [T01-016]?
```

### P20 · muc_nong · hổng: c3s1

```
Bạn đang thiếu kiến thức về kỹ thuật của pha hội tụ là gom nhóm, Five Whys, lọc trùng [T01-074] và bước phân kỳ dùng để mở rộng góc nhìn để thu insight [T01-071].
Bạn có thể nhớ đơn giản là phân kỳ là mở rộng ra, còn hội tụ là thu gọn lại bằng các cách như gom nhóm hay Five Whys.
Pha hội tụ trong Double Diamond sử dụng những kỹ thuật nào?
```
