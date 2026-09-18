# S2 · Số đo nội dung AI (CP3)

Model `gemini-3.5-flash-lite` · sinh bằng `python scripts/grounding.py`

**Thử 20 lượt, 19 lượt đạt (95%).**

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
| P09 | muc_duoi_tran | ✅ | ❌ | ❌ | ❌ | ✅ |  |
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
Phân kỳ là mở rộng góc nhìn để thu insight còn hội tụ dùng gom nhóm, Five Whys và lọc trùng [T01-071] [T01-074]. Bạn chọn nhầm vì đã nhầm lẫn kỹ thuật giữa hai pha này với nhau. Vì sao bước phân kỳ lại giúp thu được insight?
```

### P02 · y_le · hổng: (ý trong quiz)

```
Ý này nói về việc chúng ta cần bóc tách yêu cầu mơ hồ rồi verify với stakeholder, thay vì có quán tính nhảy thẳng vào giải pháp [T01-004] [T01-006] [T01-016].
Phương án bạn chọn là sai vì tư liệu không đề cập đến việc chọn giải pháp phổ biến nhất trên thị trường khi sếp đưa yêu cầu chung chung [T01-001].
Khi nhận được một yêu cầu mơ hồ từ sếp, bạn cần làm gì trước khi nghĩ đến giải pháp?
```

### P03 · y_le · hổng: (ý trong quiz)

```
Ý "Làm đúng cái sai nguy hiểm hơn" có nghĩa là việc thực hiện chính xác một công việc nhưng lại nhầm lẫn ngay từ đầu về bản chất vấn đề cần giải quyết [T01-060] [T01-061].

Phương án bạn chọn là "Làm sai cái đúng" là chưa chính xác vì theo bài học, việc làm đúng cái sai mới là điều nguy hiểm hơn [T01-060] [T01-061].

Tại sao việc thực hiện hoàn hảo một yêu cầu bị xác định nhầm ngay từ đầu lại mang tính rủi ro cao hơn so với việc làm chưa tốt một việc đúng hướng?
```

### P04 · muc_nong · hổng: c3s1

```
Bạn đang thiếu ý phân kỳ là mở rộng góc nhìn để thu insight [T01-071] và hội tụ gồm gom nhóm, Five Whys, lọc trùng [T01-074].
Cách nhớ là phân kỳ thì mở rộng ra để lấy insight [T01-071], còn hội tụ thì thu hẹp lại bằng gom nhóm, Five Whys và lọc trùng [T01-074].
Kỹ thuật nào dùng để gom nhóm và lọc trùng trong quá trình xử lý vấn đề?
```

### P05 · muc_nong · hổng: c1s1

```
Bạn đang thiếu ý bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-006] và quán tính nhảy thẳng vào giải pháp [T01-004]. 

Bạn hãy nhớ rằng thay vì vội vàng chọn giải pháp hay nhảy thẳng vào giải pháp, mình cần đi từ yêu cầu mơ hồ để làm rõ bài toán [T01-004] [T01-006]. 

Khi nhận một yêu cầu chung chung từ sếp, bạn cần làm gì trước khi nghĩ đến giải pháp [T01-006]?
```

### P06 · muc_nong · hổng: c3s2

```
Bạn đang thiếu ý làm đúng cái sai nguy hiểm hơn [T01-060] [T01-061].

Cách nhớ là làm đúng cái sai nghĩa là thực hiện rất chuẩn xác một việc từ đầu đã không mang lại giá trị giải quyết đúng vấn đề [T01-060] [T01-061].

Theo bạn, giữa việc làm sai cái đúng và làm đúng cái sai, điều gì sẽ lãng phí nguồn lực hơn [T01-050] [T01-060] [T01-061]?
```

### P07 · muc_duoi_tran · hổng: c3s1

```
Nền tảng ở Chương 3 về tìm đúng vấn đề đã được xác nhận ổn [T01-030] [T01-073], bạn chỉ cần vá đúng mục này.
Mục 3.1 Double Diamond nhắc rằng phân kỳ là mở rộng góc nhìn để thu insight [T01-071], còn hội tụ là gom nhóm, Five Whys, lọc trùng [T01-074].
Thứ tự nên ôn lại là xem lại khái niệm phân kỳ rồi đến hội tụ trong Double Diamond [T01-049] [T01-069].
Pha hội tụ trong Double Diamond dùng những kỹ thuật nào?
```

### P08 · muc_duoi_tran · hổng: c1s1

```
Nền tảng của bạn ở Chương 1 · Vì sao phải tìm đúng bài toán đã xác nhận ổn [T01-001], [T01-017], giờ chỉ cần vá đúng mục hổng.

Mục hổng 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể đang nói về việc quán tính nhảy thẳng vào giải pháp và cách bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-004], [T01-006], [T01-016].

Thứ tự nên ôn lại là nhìn nhận lại quán tính nhảy thẳng vào giải pháp trước, rồi học cách bóc tách yêu cầu mơ hồ để verify với stakeholder [T01-004], [T01-006], [T01-016].

Khi nhận một yêu cầu mơ hồ, bạn cần làm gì trước khi nghĩ đến giải pháp [T01-004], [T01-006], [T01-016]?
```

### P09 · muc_duoi_tran · hổng: c3s2

```
Phần nền Chương 3 · Tìm đúng vấn đề của bạn đã được xác nhận ổn rồi [T01-030, T01-073].

Mục 3.2 Làm đúng cái sai vs làm sai cái đúng nói rằng làm đúng cái sai nguy hiểm hơn [T01-050, T01-059, T01-060, T01-061].

Bạn nên ôn lại thứ tự từ việc tìm đúng vấn đề đến phần làm đúng cái sai và làm sai cái đúng [T01-050, T01-059, T01-060, T01-061, T01-030, T01-073].

Giữa việc làm đúng cái sai và làm sai cái đúng, tình huống nào nguy hiểm hơn theo bài giảng?
```

### P10 · nen_bai · hổng: c3

```
- Xác định đúng vấn đề trước; công nghệ chỉ là công cụ để giải nó [T01-004]
- Double Diamond: phân kỳ rồi hội tụ, làm hai lần — vấn đề trước, giải pháp sau [T01-049]
- Chọn việc bằng ma trận tác động – nỗ lực, ưu tiên high impact / low effort [T01-079]

Thứ tự các chương nên đi lại:
- Day 2 (sáng) · Xác định bài toán kinh doanh cho AI [T01-001] [T01-089]
- Chương 3 · Tìm đúng vấn đề [T01-030] [T01-073]
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

Chương 1 · Vì sao phải tìm đúng bài toán [T01-001] [T01-017]
Day 2 (sáng) · Xác định bài toán kinh doanh cho AI [T01-001] [T01-089]
1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể [T01-004] [T01-006] [T01-016]
1.2 Product manager và project manager [T01-008] [T01-011]

Bạn có làm lại quiz sau khi ôn không?
```

### P12 · nen_bai · hổng: c3

```
Xác định đúng vấn đề trước; công nghệ chỉ là công cụ để giải nó [T01-004]
Double Diamond: phân kỳ rồi hội tụ, làm hai lần — vấn đề trước, giải pháp sau [T01-049]
Chọn việc bằng ma trận tác động – nỗ lực, ưu tiên high impact / low effort [T01-079]

Bạn cần học lại cả bài theo thứ tự sau:
- Day 2 (sáng) · Xác định bài toán kinh doanh cho AI [T01-001] [T01-089]
- Chương 3 · Tìm đúng vấn đề [T01-030] [T01-073]
- 3.1 Double Diamond: phân kỳ – hội tụ [T01-049] [T01-069] [T01-071] [T01-074]
- 3.2 Làm đúng cái sai vs làm sai cái đúng [T01-050] [T01-059] [T01-060] [T01-061]
- 3.3 First principle thinking [T01-062] [T01-064] [T01-068]
- 3.4 Kỹ thuật khám phá vấn đề [T01-042] [T01-045] [T01-048] [T01-072]

Bạn có làm lại quiz sau khi ôn không?
```

### P13 · y_le · hổng: (ý trong quiz)

```
Phân kỳ là mở rộng góc nhìn để thu insight, còn hội tụ là gom nhóm, Five Whys, và lọc trùng [T01-071] [T01-074].
Bạn chọn sai vì chưa nắm đúng các kỹ thuật cụ thể dùng trong từng pha của viên kim cương thứ nhất [T01-049] [T01-071] [T01-074].
Kỹ thuật nào giúp gom nhóm, dùng Five Whys và lọc trùng trong quá trình tìm đúng vấn đề? [T01-030] [T01-074]
```

### P14 · muc_duoi_tran · hổng: c1s1

```
Phần nền Chương 1 · Vì sao phải tìm đúng bài toán đã xác nhận ổn [T01-001] [T01-017], bạn chỉ cần vá đúng mục đang hổng.

Mục 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể nói về việc quán tính nhảy thẳng vào giải pháp rất nguy hiểm [T01-004] [T01-016], và cần bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-006].

Thứ tự nên ôn lại là nhìn nhận lại quán tính nhảy thẳng vào giải pháp trước, sau đó học cách bóc tách yêu cầu mơ hồ rồi verify với stakeholder.

Vì sao việc bóc tách yêu cầu mơ hồ rồi verify với stakeholder lại quan trọng trước khi làm giải pháp?
```

### P15 · y_le · hổng: (ý trong quiz)

```
Bước phân kỳ trong Double Diamond là mở rộng góc nhìn để thu insight [T01-071]. 

Bạn chọn phương án này cho pha hội tụ là sai vì pha hội tụ dùng các kỹ thuật gom nhóm, Five Whys, lọc trùng [T01-074]. 

Pha hội tụ sử dụng những kỹ thuật nào?
```

### P16 · y_le · hổng: (ý trong quiz)

```
Quán tính nhảy thẳng vào giải pháp là thói quen khiến ta lao vào giải quyết ngay vấn đề mà chưa tìm hiểu kỹ, dẫn đến nguy cơ làm đúng cái sai [T01-004] [T01-016] [T01-017].

Phương án bạn chọn là sai vì quán tính này nguy hiểm do làm đúng cái sai chứ không phải vì giải pháp tốn nhiều tiền [T01-004] [T01-016] [T01-017].

Vì sao thói quen nhảy thẳng vào giải pháp lại khiến bạn dễ làm đúng cái sai?
```

### P17 · muc_duoi_tran · hổng: c1s1

```
Nền tảng của bạn ở Chương 1 · Vì sao phải tìm đúng bài toán đã được xác nhận ổn [T01-001], [T01-017], chúng ta chỉ cần vá đúng mục này nhé. 
Phần này tư liệu chưa nói rõ về quán tính nhảy thẳng vào giải pháp và các bước phân kỳ, hội tụ chi tiết. 
Thứ tự bạn nên ôn lại là từ yêu cầu mơ hồ đến bài toán cụ thể [T01-004], [T01-006], [T01-016]. 
Theo bạn, khi nhận được một yêu cầu mơ hồ từ sếp, bạn cần làm gì để tránh quán tính nhảy thẳng vào giải pháp [T01-004], [T01-006], [T01-016]?
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
Khi sếp đưa yêu cầu chung chung, cách làm được bài giảng khuyến nghị là bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-006]. 
Phương án chọn giải pháp phổ biến là sai vì bạn đang mắc quán tính nhảy thẳng vào giải pháp thay vì bóc tách yêu cầu mơ hồ [T01-004], [T01-016]. 
Bạn cần làm gì trước khi đưa ra bất kỳ giải pháp nào cho yêu cầu chung chung của sếp?
```

### P20 · muc_nong · hổng: c3s1

```
Phân kỳ là mở rộng góc nhìn để thu insight, còn hội tụ dùng gom nhóm, Five Whys, lọc trùng [T01-071] [T01-074].
Bạn có thể nhớ phân kỳ là mở ra còn hội tụ là thu gọn lại.
Pha hội tụ trong Double Diamond dùng những kỹ thuật nào?
```
