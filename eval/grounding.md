# S2 · Số đo nội dung AI (CP3)

Model `gemini-3.5-flash-lite` · sinh bằng `python scripts/grounding.py --api` (qua backend thật)

**Thử 20 lượt, 16 lượt đạt (80%).**

Chuẩn đạt (chốt trước khi chạy): ① mọi mã đoạn trích ra tồn tại trong cây · ② không trích lạc ngoài tư liệu được cấp · ③ có trích dẫn và có câu tự kiểm.

| Case | Kịch bản | ① có thật | ② không lạc | ③ đủ khung | Đạt | ④ nối vòng | Hợp lý? (người tick) |
|---|---|---|---|---|---|---|---|
| P01 | y_le | ✅ | ✅ | ❌ | ❌ | — |  |
| P02 | y_le | ✅ | ✅ | ✅ | ✅ | — |  |
| P03 | y_le | ✅ | ✅ | ✅ | ✅ | — |  |
| P04 | muc_nong | ✅ | ✅ | ✅ | ✅ | — |  |
| P05 | muc_nong | ✅ | ✅ | ✅ | ✅ | — |  |
| P06 | muc_nong | ✅ | ✅ | ✅ | ✅ | — |  |
| P07 | muc_duoi_tran | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| P08 | muc_duoi_tran | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| P09 | muc_duoi_tran | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| P10 | nen_bai | ✅ | ❌ | ❌ | ❌ | — |  |
| P11 | nen_bai | ✅ | ❌ | ✅ | ❌ | — |  |
| P12 | nen_bai | ✅ | ❌ | ✅ | ❌ | — |  |
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
Phân kỳ trong viên kim cương thứ nhất là mở rộng góc nhìn để thu insight [T01-071]. Phương án chọn "Vẽ ma trận tác động – nỗ lực" là sai vì đây không phải là kỹ thuật mở rộng góc nhìn để thu insight của bước phân kỳ [T01-071].
Tự kiểm: Bạn phân biệt thế nào giữa phân kỳ và hội tụ, trả lời trôi trong 30 giây thì coi như đã nắm.

Pha hội tụ dùng các kỹ thuật là gom nhóm, Five Whys, lọc trùng [T01-074]. Phương án chọn "Mở rộng góc nhìn để có thêm insight" là sai vì đây là mô tả của bước phân kỳ chứ không phải kỹ thuật của pha hội tụ [T01-071] [T01-074].
Tự kiểm: Kỹ thuật nào được dùng trong pha hội tụ, trả lời trôi trong 30 giây thì coi như đã nắm.
```

### P02 · y_le · hổng: (ý trong quiz)

```
Quán tính nhảy thẳng vào giải pháp là hiện tượng từ yêu cầu mơ hồ dẫn đến việc chọn ngay giải pháp mà chưa tìm đúng bài toán [T01-004], [T01-016]. Phương án chọn "vì giải pháp thường tốn nhiều tiền" là sai vì tư liệu chỉ ra sự nguy hiểm nằm ở việc làm sai cái sai và chưa tìm đúng bài toán, không đề cập đến chi phí tiền bạc [T01-001], [T01-017].
Tự kiểm: Quán tính nhảy thẳng vào giải pháp dẫn đến hậu quả gì, trả lời trôi trong 30 giây thì coi như đã nắm?

Cách làm được khuyến nghị khi sếp đưa yêu cầu chung chung là bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-006]. Phương án chọn "chọn giải pháp phổ biến nhất trên thị trường" là sai vì cách làm này rơi vào quán tính nhảy thẳng vào giải pháp khi chưa qua bước bóc tách và verify [T01-004], [T01-006].
Tự kiểm: Khi nhận yêu cầu chung chung từ sếp, bạn cần làm gì trước khi nghĩ đến giải pháp, trả lời trôi trong 30 giây thì coi như đã nắm?
```

### P03 · y_le · hổng: (ý trong quiz)

```
Việc làm đúng cái sai (tức là làm một việc không giải quyết đúng gốc rễ vấn đề) thực chất là làm sai ngay từ gốc, khiến công sức bỏ ra trở nên vô nghĩa [T01-060] [T01-061]. Phương án chọn "Làm sai cái đúng" là sai vì bản chất cái đã chọn là đúng rồi nhưng thực hiện chưa chuẩn thì vẫn có cơ hội sửa chữa và định hướng lại, không nguy hiểm bằng việc đi lạc hướng ngay từ đầu [T01-060] [T01-061].

Tự kiểm: Vì sao làm đúng cái sai lại nguy hiểm hơn làm sai cái đúng theo bài học? — trả lời trôi trong 30 giây thì coi như đã nắm.
```

### P04 · muc_nong · hổng: c3s1

```
Bạn đang nhầm lẫn giữa hai pha của Double Diamond: phân kỳ dùng để mở rộng góc nhìn để thu insight, còn hội tụ dùng gom nhóm, Five Whys, lọc trùng [T01-049] [T01-069] [T01-071] [T01-074].
Cách nhớ là phân kỳ nghĩa là mở rộng ra để tìm thông tin, hội tụ nghĩa là gom lại và chắt lọc.
Phương án chọn "Vẽ ma trận tác động – nỗ lực" ở câu 4 là sai vì đó không phải là kỹ thuật dùng để mở rộng góc nhìn để thu insight trong pha phân kỳ. Phương án chọn "Mở rộng góc nhìn để có thêm insight" ở câu 5 là sai vì đó là mô tả của pha phân kỳ chứ không phải các kỹ thuật gom nhóm, Five Whys, lọc trùng của pha hội tụ [T01-071] [T01-074].

Tự kiểm: Sự khác nhau giữa mục đích của pha phân kỳ và pha hội tụ trong Double Diamond là gì? — trả lời trôi trong 30 giây thì coi như đã nắm.
```

### P05 · muc_nong · hổng: c1s1

```
Bạn đang bị thiếu ý về quán tính nhảy thẳng vào giải pháp và cách bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-004] [T01-006] [T01-016]. Ở câu 1, đáp án "giải pháp tốn nhiều tiền" là sai về nội dung vì tư liệu tập trung vào việc chưa tìm đúng bài toán đã vội lao vào giải quyết [T01-001] [T01-017]. Ở câu 2, chọn giải pháp phổ biến là sai vì ta cần bóc tách yêu cầu mơ hồ rồi verify với stakeholder thay vì mắc kẹt trong quán tính nhảy thẳng vào giải pháp [T01-004] [T01-006] [T01-016]. Cách nhớ là luôn đi từ yêu cầu mơ hồ sang bài toán cụ thể thay vì đoán mò [T01-004] [T01-006] [T01-016].
Tự kiểm: Vì sao phải bóc tách yêu cầu mơ hồ rồi verify với stakeholder? (trả lời trôi trong 30 giây thì coi như đã nắm).
```

### P06 · muc_nong · hổng: c3s2

```
Bạn đang nhầm lẫn ở chỗ: làm sai cái đúng không nguy hiểm bằng làm đúng cái sai, vì làm đúng cái sai nghĩa là bạn đang tạo ra một sản phẩm chạy mượt mà nhưng phục vụ sai mục đích hoặc giải quyết sai vấn đề [T01-050, T01-060, T01-061]. Cách nhớ là "làm đúng" cái "sai" thì công sức đổ sông đổ biển nhiều hơn là làm sai một việc đáng lẽ ra phải đúng [T01-060, T01-061].

Tự kiểm: Vì sao làm đúng cái sai lại nguy hiểm hơn làm sai cái đúng theo tư liệu [T01-060]? (Trả lời trôi trong 30 giây thì coi như đã nắm).
```

### P07 · muc_duoi_tran · hổng: c3s1

```
Nền tảng ở Chương 3 · Tìm đúng vấn đề đã được bạn xác nhận ổn [T01-030] [T01-073]. Mục đang hổng là 3.1 Double Diamond: phân kỳ – hội tụ [T01-049] [T01-069] [T01-071] [T01-074], nơi bạn đã nhầm lẫn kỹ thuật giữa phân kỳ và hội tụ. Thứ tự nên ôn lại là xem kỹ lại định nghĩa của phân kỳ là mở rộng góc nhìn để thu insight [T01-071], còn hội tụ là gom nhóm, Five Whys, lọc trùng [T01-074]. (Phương án chọn "Vẽ ma trận tác động – nỗ lực" là sai vì nó không thuộc pha phân kỳ theo tư liệu, còn "Mở rộng góc nhìn để có thêm insight" là sai vì đó là kỹ thuật của phân kỳ chứ không phải hội tụ [T01-071] [T01-074]).
Tự kiểm: Bạn phân biệt thế nào giữa việc mở rộng góc nhìn để thu insight và việc gom nhóm, Five Whys, lọc trùng? (Trả lời trôi trong 30 giây thì coi như đã nắm).
```

### P08 · muc_duoi_tran · hổng: c1s1

```
Phần nền Chương 1 · Vì sao phải tìm đúng bài toán đã xác nhận ổn [T01-001] [T01-017].
Bạn đang hổng ở phần 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể, cụ thể là việc quán tính nhảy thẳng vào giải pháp [T01-004] [T01-016] và bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-006].
Thứ tự bạn nên ôn lại là xem xét lại quán tính nhảy thẳng vào giải pháp trước, sau đó đến cách bóc tách yêu cầu mơ hồ rồi verify với stakeholder.
Ở câu 1, việc chọn giải pháp tốn nhiều tiền là sai vì tư liệu chỉ rõ quán tính nhảy thẳng vào giải pháp là do vướng vào quán tính nhảy thẳng vào giải pháp [T01-004] [T01-016], chứ bản chất không phải do tốn tiền. Ở câu 2, việc chọn giải pháp phổ biến nhất là sai vì cách làm đúng được khuyến nghị là bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-006].

Tự kiểm: Bạn hãy giải thích lại vì sao không nên nhảy thẳng vào giải pháp? — trả lời trôi trong 30 giây thì coi như đã nắm.
```

### P09 · muc_duoi_tran · hổng: c3s2

```
Nền tảng "Chương 3 · Tìm đúng vấn đề" của bạn đã được xác nhận ổn [T01-030], [T01-073]. 

Tại mục 3.2 Làm đúng cái sai vs làm sai cái đúng, bạn đã chọn phương án "Làm sai cái đúng" là nguy hiểm hơn [T01-050], [T01-059], [T01-060], [T01-061]. Phương án này sai về nội dung vì thực tế làm đúng cái sai mới là điều nguy hiểm hơn, bởi vì khi đó bạn tốn rất nhiều nguồn lực, thời gian và công sức để tối ưu một thứ vốn dĩ không mang lại giá trị hoặc giải quyết nhầm vấn đề cần xử lý [T01-060], [T01-061]. 

Thứ tự nên ôn lại: bạn nên xem lại nội dung 3.2 Làm đúng cái sai vs làm sai cái đúng trước [T01-050], [T01-059], [T01-060], [T01-061].

Tự kiểm: Vì sao làm đúng cái sai lại nguy hiểm hơn làm sai cái đúng? (Trả lời trôi trong 30 giây thì coi như đã nắm).
```

### P10 · nen_bai · hổng: c3

```
- Xác định đúng vấn đề trước; công nghệ chỉ là công cụ để giải nó [T01-004]
- Double Diamond: phân kỳ rồi hội tụ, làm hai lần — vấn đề trước, giải pháp sau [T01-049]
- Chọn việc bằng ma trận tác động – nỗ lực, ưu tiên high impact / low effort [T01-079]

Thứ tự các chương nên đi lại: Chương 1 · Vì sao phải tìm đúng bài toán [T01-001], Chương 2 · Đặc thù của sản phẩm AI [T01-018], Chương 3 · Tìm đúng vấn đề [T01-030], Chương 4 · Chọn bài toán để làm [T01-074].

Tự kiểm: Bạn đã hiểu rõ các kỹ thuật trong pha phân kỳ và hội tụ của Double Diamond chưa, kèm cách dùng: trả lời trôi trong 30 giây thì coi như đã nắm.
```

### P11 · nen_bai · hổng: c1

```
- Xác định đúng vấn đề trước; công nghệ chỉ là công cụ để giải nó [T01-004]
- Double Diamond: phân kỳ rồi hội tụ, làm hai lần — vấn đề trước, giải pháp sau [T01-049]
- Chọn việc bằng ma trận tác động – nỗ lực, ưu tiên high impact / low effort [T01-079]

Bạn cần học lại cả bài theo thứ tự các chương sau: Chương 1 · Vì sao phải tìm đúng bài toán [T01-001], Chương 2 · Đặc thù của sản phẩm AI [T01-018], Chương 3 · Tìm đúng vấn đề [T01-030], Chương 4 · Chọn bài toán để làm [T01-074].

Tự kiểm: Bạn đã nhớ lại lý do không được nhảy thẳng vào giải pháp chưa? (trả lời trôi trong 30 giây thì coi như đã nắm, sau đó làm lại quiz).
```

### P12 · nen_bai · hổng: c3

```
Xác định đúng vấn đề trước; công nghệ chỉ là công cụ để giải nó [T01-004]
Double Diamond: phân kỳ rồi hội tụ, làm hai lần — vấn đề trước, giải pháp sau [T01-049]
Chọn việc bằng ma trận tác động – nỗ lực, ưu tiên high impact / low effort [T01-079]
Thứ tự các chương nên đi lại: Chương 1 · Vì sao phải tìm đúng bài toán [T01-001], Chương 2 · Đặc thù của sản phẩm AI [T01-018], Chương 3 · Tìm đúng vấn đề [T01-030], Chương 4 · Chọn bài toán để làm [T01-074].
Tự kiểm: Nhắc làm lại quiz sau khi ôn — câu hỏi: Bạn hãy giải thích lại sự khác biệt giữa làm đúng cái sai và làm sai cái đúng theo tư liệu? Trả lời trôi trong 30 giây thì coi như đã nắm.
```

### P13 · y_le · hổng: (ý trong quiz)

```
Bước phân kỳ là mở rộng góc nhìn để thu insight [T01-071], còn phương án chọn sai vì bỏ trống thay vì nêu đúng kỹ thuật mở rộng góc nhìn. Phương án sai về nội dung vì bỏ sót hành động mở rộng góc nhìn cốt lõi trong pha phân kỳ của Double Diamond [T01-049].
Tự kiểm: Bước phân kỳ trong Double Diamond dùng để làm gì và áp dụng kỹ thuật nào? — trả lời trôi trong 30 giây thì coi như đã nắm.

Pha hội tụ dùng các kỹ thuật gom nhóm, Five Whys, lọc trùng [T01-074], còn phương án chọn sai vì bỏ trống không chỉ ra các kỹ thuật này. Phương án sai về nội dung vì thiếu các thao tác gom nhóm, dùng Five Whys và lọc trùng đặc trưng của pha hội tụ [T01-074].
Tự kiểm: Pha hội tụ gồm những kỹ thuật cụ thể nào? — trả lời trôi trong 30 giây thì coi như đã nắm.
```

### P14 · muc_duoi_tran · hổng: c1s1

```
Nền tảng ở Chương 1 · Vì sao phải tìm đúng bài toán đã được xác nhận ổn [T01-001] [T01-017], giúp bạn giảm bớt gánh nặng khi học tiếp. 

Phần bạn đang hổng là 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể [T01-004] [T01-006] [T01-016], nơi bạn chưa nắm rõ về quán tính nhảy thẳng vào giải pháp [T01-004] [T01-016] cũng như cách bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-006]. 

Thứ tự bạn nên ôn lại là bắt đầu từ việc nhận diện quán tính nhảy thẳng vào giải pháp [T01-004] [T01-016], sau đó học cách bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-006] để chuyển từ yêu cầu mơ hồ thành bài toán cụ thể [T01-004] [T01-006] [T01-016].

Tự kiểm: Vì sao quán tính nhảy thẳng vào giải pháp lại nguy hiểm và cần phải bóc tách yêu cầu mơ hồ rồi verify với stakeholder thế nào? (trả lời trôi trong 30 giây thì coi như đã nắm).
```

### P15 · y_le · hổng: (ý trong quiz)

```
Bước phân kỳ là mở rộng góc nhìn để thu insight [T01-071]. Phương án chọn vẽ ma trận tác động – nỗ lực là sai về nội dung vì đó không phải là kỹ thuật của bước phân kỳ dùng để mở rộng góc nhìn thu insight [T01-071].
Tự kiểm: Bước phân kỳ trong Double Diamond dùng để làm gì? — trả lời trôi trong 30 giây thì coi như đã nắm.

Pha hội tụ dùng các kỹ thuật gom nhóm, Five Whys, lọc trùng [T01-074]. Phương án chọn mở rộng góc nhìn để có thêm insight là sai về nội dung vì việc mở rộng góc nhìn là nhiệm vụ của bước phân kỳ chứ không phải pha hội tụ [T01-071].
Tự kiểm: Pha hội tụ gồm những kỹ thuật nào? — trả lời trôi trong 30 giây thì coi như đã nắm.
```

### P16 · y_le · hổng: (ý trong quiz)

```
Quán tính nhảy thẳng vào giải pháp nguy hiểm vì đó là thói quen vội vàng lao vào làm ngay khi chưa hiểu rõ bản chất vấn đề [T01-004] [T01-016]. Phương án chọn tốn nhiều tiền là sai vì tư liệu chỉ ra sự nguy hiểm nằm ở việc làm sai bài toán chứ không đề cập đến chi phí tiền bạc.
Tự kiểm: Quán tính nhảy thẳng vào giải pháp biểu hiện như thế nào và vì sao nó nguy hiểm? (trả lời trôi trong 30 giây thì coi như đã nắm).

Phần phân kỳ và hội tụ trong các câu hỏi còn lại là phần này tư liệu chưa nói rõ.
Tự kiểm: Các bước phân kỳ và hội tụ gồm những gì theo nội dung bài học? (trả lời trôi trong 30 giây thì coi như đã nắm).
```

### P17 · muc_duoi_tran · hổng: c1s1

```
Nền tảng ở Chương 1 · Vì sao phải tìm đúng bài toán đã xác nhận ổn [T01-001] [T01-017], giúp bạn nắm chắc tầm quan trọng của việc tìm đúng bài toán. Mục đang hổng là 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể [T01-004] [T01-006] [T01-016], nơi bạn cần biết quán tính nhảy thẳng vào giải pháp nguy hiểm vì sao và cách bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-004] [T01-006] [T01-016]. Phương án chọn "Vì giải pháp thường tốn nhiều tiền" là sai vì nội dung không phản ánh đúng quán tính nhảy thẳng vào việc tìm giải pháp thay vì tìm đúng bài toán. Bạn nên ôn lại theo thứ tự từ việc nhận diện quán tính nhảy thẳng vào giải pháp [T01-004] [T01-016] rồi đến cách bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-006].
Tự kiểm: Bạn đã hiểu vì sao quán tính nhảy thẳng vào giải pháp lại nguy hiểm chưa? — trả lời trôi trong 30 giây thì coi như đã nắm.
```

### P18 · nen_bai · hổng: c1

```
Chào bạn, vì bạn sai tới tận phần nền, mình đề nghị bạn học lại cả bài theo thứ tự. 

- Ba ý cốt lõi của bài: Xác định đúng vấn đề trước; công nghệ chỉ là công cụ để giải nó [T01-004] | Double Diamond: phân kỳ rồi hội tụ, làm hai lần — vấn đề trước, giải pháp sau [T01-049] | Chọn việc bằng ma trận tác động – nỗ lực, ưu tiên high impact / low effort [T01-079]
- Thứ tự các chương nên đi lại: Chương 1 · Vì sao phải tìm đúng bài toán, Day 2 (sáng) · Xác định bài toán kinh doanh cho AI, 1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể, 1.2 Product manager và project manager, Chương 2 · Đặc thù của sản phẩm AI, Chương 3 · Tìm đúng vấn đề, Chương 4 · Chọn bài toán để làm.
- Tự kiểm: Bạn đã làm lại quiz sau khi ôn chưa? Trả lời trôi trong 30 giây thì coi như đã nắm.
```

### P19 · y_le · hổng: (ý trong quiz)

```
Khi sếp đưa một yêu cầu chung chung, cách làm đúng là bóc tách yêu cầu mơ hồ rồi verify với stakeholder [T01-006]. Phương án chọn giải pháp phổ biến nhất trên thị trường là sai về nội dung vì nó rơi vào quán tính nhảy thẳng vào giải pháp khi đối mặt với yêu cầu mơ hồ thay vì bóc tách và xác thực lại [T01-004], [T01-006], [T01-016].

Tự kiểm: Khi sếp đưa yêu cầu chung chung, bạn cần làm gì trước khi nghĩ tới giải pháp? (Trả lời trôi trong 30 giây thì coi như đã nắm).
```

### P20 · muc_nong · hổng: c3s1

```
Phân kỳ dùng để mở rộng góc nhìn để thu insight [T01-071], còn hội tụ dùng để gom nhóm, Five Whys, lọc trùng [T01-074].
Cách nhớ là Phân kỳ giống như mở to mắt nhìn rộng ra, còn Hội tụ giống như túm các ý lại một chỗ.

Tự kiểm: Phân kỳ và hội tụ khác nhau thế nào? — trả lời trôi trong 30 giây thì coi như đã nắm.
```
