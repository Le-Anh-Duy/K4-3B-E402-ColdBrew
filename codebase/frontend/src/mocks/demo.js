const question = (id, concept, text, options, correct, explanation) => ({ id, concept, text, options, correct, explanation })
export const catalog = [
  { id: 'd1', title: 'Day 01 · AI & LLM Foundation', label: 'Nền tảng AI & mô hình ngôn ngữ', topics: ['Mô hình ngôn ngữ', 'Token & ngữ cảnh'], chapter: '01' },
  { id: 'd2', title: 'Day 02 · Prompt Engineering', label: 'Tư duy thiết kế prompt', topics: ['Cấu trúc prompt', 'Few-shot prompting'], chapter: '02' },
]
export const banks = {
  'Mô hình ngôn ngữ': [
    question('llm1', 'Mô hình ngôn ngữ', 'Một mô hình ngôn ngữ lớn tạo ra câu trả lời bằng cách nào?', ['Dự đoán token tiếp theo dựa trên ngữ cảnh', 'Tra cứu một câu trả lời cố định trong cơ sở dữ liệu', 'Luôn tìm kiếm thông tin mới nhất trên Internet', 'Hiểu mọi thông tin giống hệt con người'], 0, 'LLM dự đoán lần lượt các token tiếp theo dựa trên chuỗi token đã có. Câu trả lời hợp lý chưa chắc đã đúng về mặt sự thật.'),
    question('llm2', 'Mô hình ngôn ngữ', 'Vì sao câu trả lời trôi chảy của LLM vẫn cần được kiểm chứng?', ['Vì mọi câu trả lời đều ngẫu nhiên', 'Vì xác suất xuất hiện của token không bảo đảm tính đúng đắn', 'Vì LLM không thể tạo văn bản', 'Vì prompt luôn bị bỏ qua'], 1, 'Mô hình tối ưu việc dự đoán token, không bảo đảm mọi phát biểu đều đúng.'),
    question('llm3', 'Mô hình ngôn ngữ', 'Khi cần số liệu mới nhất, cách sử dụng LLM phù hợp là gì?', ['Tin ngay câu trả lời đầu tiên', 'Tăng độ dài câu trả lời', 'Cung cấp nguồn cập nhật và kiểm tra lại số liệu', 'Yêu cầu mô hình trả lời tự tin hơn'], 2, 'Nguồn cập nhật và kiểm chứng giúp giảm rủi ro thông tin lỗi thời hoặc bịa đặt.'),
    question('llm4', 'Mô hình ngôn ngữ', 'Điều gì ảnh hưởng trực tiếp đến token được mô hình dự đoán tiếp theo?', ['Màu nền ứng dụng', 'Ngữ cảnh token đã cung cấp', 'Tên người dùng', 'Kích thước màn hình'], 1, 'Chuỗi token trong ngữ cảnh là đầu vào cho việc dự đoán tiếp theo.'),
    question('llm5', 'Mô hình ngôn ngữ', 'Phát biểu nào mô tả đúng một giới hạn của LLM?', ['Không thể tóm tắt', 'Chỉ trả lời được tiếng Anh', 'Luôn kết nối Internet', 'Có thể tạo ra thông tin nghe hợp lý nhưng sai'], 3, 'Thông tin sai nhưng nghe hợp lý thường được gọi là hallucination.'),
  ],
  'Token & ngữ cảnh': [
    question('token1', 'Token & ngữ cảnh', 'Token trong mô hình ngôn ngữ là gì?', ['Một đơn vị văn bản mà mô hình xử lý', 'Luôn là một câu hoàn chỉnh', 'Một tài khoản đăng nhập', 'Một trang tài liệu'], 0, 'Token có thể là một từ, một phần của từ hoặc ký tự; không có quy tắc một từ luôn bằng một token.'),
    question('token2', 'Token & ngữ cảnh', 'Cửa sổ ngữ cảnh giới hạn điều gì?', ['Số người đăng nhập', 'Lượng token mô hình có thể xử lý trong ngữ cảnh', 'Số ngôn ngữ trên thế giới', 'Số trang web đang tồn tại'], 1, 'Ngữ cảnh có giới hạn token, nên cần chọn thông tin liên quan.'),
    question('token3', 'Token & ngữ cảnh', 'Khi tài liệu vượt giới hạn ngữ cảnh, nên làm gì?', ['Gửi lặp lại toàn bộ', 'Bỏ câu hỏi', 'Chọn hoặc chia phần tài liệu liên quan', 'Đổi màu chữ'], 2, 'Chia tài liệu hoặc truy xuất đoạn liên quan giúp sử dụng ngữ cảnh hiệu quả.'),
    question('token4', 'Token & ngữ cảnh', 'Một từ tiếng Việt có luôn tương ứng một token không?', ['Luôn luôn', 'Không, tùy bộ tokenizer', 'Chỉ khi viết hoa', 'Chỉ trong PDF'], 1, 'Cách tách token phụ thuộc tokenizer của mô hình.'),
    question('token5', 'Token & ngữ cảnh', 'Thông tin nào nên ưu tiên trong ngữ cảnh?', ['Mọi thông tin có thể tìm thấy', 'Các đoạn lặp lại', 'Thông tin không liên quan', 'Dữ kiện liên quan trực tiếp đến nhiệm vụ'], 3, 'Thông tin phù hợp giúp mô hình tập trung vào nhiệm vụ.'),
  ],
  'Cấu trúc prompt': [
    question('prompt1', 'Cấu trúc prompt', 'Prompt nào giúp yêu cầu tóm tắt rõ ràng nhất?', ['Tóm tắt đoạn sau thành 3 ý, dành cho người mới học', 'Làm đi', 'Viết gì cũng được', 'Càng dài càng tốt'], 0, 'Nhiệm vụ, đối tượng và định dạng đầu ra cụ thể giúp giảm sự mơ hồ.'),
    question('prompt2', 'Cấu trúc prompt', 'Định dạng đầu ra trong prompt có tác dụng gì?', ['Bảo đảm mọi dữ kiện đúng', 'Giúp câu trả lời có cấu trúc phù hợp', 'Thay thế dữ liệu đầu vào', 'Tăng cửa sổ ngữ cảnh'], 1, 'Định dạng hướng dẫn cách trình bày, không bảo đảm độ đúng của dữ kiện.'),
    question('prompt3', 'Cấu trúc prompt', 'Khi yêu cầu còn mơ hồ, nên bổ sung gì?', ['Nhiều dấu chấm than', 'Một lời khen', 'Mục tiêu, bối cảnh và tiêu chí cụ thể', 'Một chủ đề khác'], 2, 'Bối cảnh và tiêu chí giúp làm rõ yêu cầu.'),
    question('prompt4', 'Cấu trúc prompt', 'Ví dụ nào là một ràng buộc đầu ra?', ['Bạn là trợ lý', 'Không quá 100 từ', 'Đây là tài liệu', 'Xin chào'], 1, 'Giới hạn độ dài là một ràng buộc cụ thể.'),
    question('prompt5', 'Cấu trúc prompt', 'Sau khi nhận câu trả lời chưa đạt, nên làm gì?', ['Bỏ qua yêu cầu', 'Tin ngay kết quả', 'Chỉ yêu cầu tự tin hơn', 'Chỉ rõ điểm cần cải thiện và bổ sung yêu cầu'], 3, 'Phản hồi cụ thể giúp điều chỉnh kết quả có mục tiêu.'),
  ],
  'Few-shot prompting': [
    question('few1', 'Few-shot prompting', 'Few-shot prompting sử dụng điều gì trong prompt?', ['Một vài ví dụ minh họa nhiệm vụ', 'Không có hướng dẫn', 'Toàn bộ dữ liệu huấn luyện', 'Chỉ một mật khẩu'], 0, 'Few-shot cung cấp một vài cặp đầu vào và đầu ra mẫu.'),
    question('few2', 'Few-shot prompting', 'Ví dụ few-shot tốt nên có đặc điểm nào?', ['Mâu thuẫn nhau', 'Nhất quán với nhiệm vụ và định dạng mong muốn', 'Không liên quan', 'Chỉ chứa từ ngẫu nhiên'], 1, 'Ví dụ nhất quán giúp mô hình nhận ra mẫu cần làm theo.'),
    question('few3', 'Few-shot prompting', 'Nếu muốn phân loại cảm xúc, ví dụ nào hữu ích?', ['Một công thức toán', 'Một bản đồ', 'Câu đánh giá kèm nhãn cảm xúc', 'Một mật khẩu'], 2, 'Ví dụ phải thể hiện quan hệ giữa đầu vào và đầu ra của nhiệm vụ.'),
    question('few4', 'Few-shot prompting', 'Few-shot có thay đổi trọng số mô hình ngay trong lời gọi không?', ['Có, luôn luôn', 'Không, ví dụ được dùng trong ngữ cảnh', 'Chỉ khi dùng tiếng Việt', 'Chỉ khi có ba ví dụ'], 1, 'Few-shot hướng dẫn qua ngữ cảnh, không phải cập nhật trọng số như huấn luyện.'),
    question('few5', 'Few-shot prompting', 'Khi chọn ví dụ, nên ưu tiên điều gì?', ['Ví dụ càng dài càng tốt', 'Chỉ một nhãn duy nhất', 'Ví dụ không có đáp án', 'Ví dụ rõ, tiêu biểu và bao phủ trường hợp cần xử lý'], 3, 'Ví dụ tiêu biểu giúp thể hiện nhiệm vụ và các trường hợp quan trọng.'),
  ],
}
export const support = Object.fromEntries(Object.keys(banks).map((topic) => {
  const language = topic === 'Mô hình ngôn ngữ' || topic === 'Token & ngữ cảnh'
  const foundations = language ? ['Token', 'Dữ liệu văn bản'] : ['Nhiệm vụ và đầu ra', 'Thông tin và bối cảnh']
  return [topic, {
    similar: language
      ? question(`${topic}-similar`, topic, 'Khi viết tiếp “Hôm nay trời…”, mô hình dựa vào đâu?', ['Một đáp án cố định cho mọi tình huống', 'Chuỗi token trong ngữ cảnh để dự đoán phần tiếp theo', 'Danh tính người dùng', 'Màu chữ'], 1, 'Mô hình dùng ngữ cảnh token để dự đoán phần tiếp theo.')
      : question(`${topic}-similar`, topic, 'Bạn muốn AI phân loại phản hồi thành tích cực hoặc tiêu cực. Cách nào rõ nhất?', ['Chỉ gửi lời chào', 'Nêu nhiệm vụ, nhãn đầu ra và ví dụ tương ứng', 'Yêu cầu một bài văn dài', 'Không đưa phản hồi cần phân loại'], 1, 'Nhiệm vụ, nhãn và ví dụ làm rõ kết quả mong muốn.'),
    recheck: language
      ? question(`${topic}-recheck`, topic, 'Một đoạn văn được đưa vào mô hình ngôn ngữ dưới dạng nào?', ['Ảnh chụp màn hình bắt buộc', 'Chuỗi token được mã hóa', 'Một câu trả lời đã biết', 'Một danh sách người dùng'], 1, 'Văn bản được tách thành token và mã hóa để mô hình xử lý.')
      : question(`${topic}-recheck`, topic, 'Để AI trả về bảng so sánh hai sản phẩm, nên ghi gì?', ['Chỉ tên người dùng', 'Hai sản phẩm, tiêu chí so sánh và định dạng bảng', 'Một lời chào', 'Một chủ đề không liên quan'], 1, 'Đầu vào, tiêu chí và định dạng giúp xác định nhiệm vụ.'),
    foundations,
    checks: language ? [
      question('base-token', 'Token', 'Đơn vị văn bản được mô hình xử lý thường được gọi là gì?', ['Token', 'Màn hình', 'Tài khoản', 'Thư mục'], 0, 'Token là đơn vị văn bản dùng trong mô hình ngôn ngữ.'),
      question('base-text', 'Dữ liệu văn bản', 'Đâu là một ví dụ về dữ liệu văn bản?', ['Một đoạn hội thoại được ghi lại bằng chữ', 'Nhiệt độ chưa được ghi nhận', 'Một vật thể chưa được mô tả', 'Một âm thanh chưa được phiên âm'], 0, 'Đoạn hội thoại viết bằng chữ là dữ liệu văn bản.'),
    ] : [
      question('base-task', 'Nhiệm vụ và đầu ra', 'Trong “Tóm tắt bài viết thành 3 ý”, đầu ra mong muốn là gì?', ['Bản tóm tắt gồm 3 ý', 'Một bài viết không giới hạn', 'Một mật khẩu', 'Một hình ảnh bất kỳ'], 0, 'Yêu cầu đã xác định đầu ra là bản tóm tắt gồm 3 ý.'),
      question('base-context', 'Thông tin và bối cảnh', 'Khi nhờ tóm tắt một bài viết, thông tin nào cần cung cấp?', ['Nội dung bài viết cần tóm tắt', 'Màu bàn làm việc', 'Mật khẩu cá nhân', 'Một số ngẫu nhiên'], 0, 'Nội dung bài viết là dữ liệu liên quan trực tiếp đến nhiệm vụ.'),
    ],
    cards: [
      { title: topic, tag: 'Concept chính', definition: banks[topic][0].explanation, example: language ? '“Hôm nay trời…” → dự đoán token tiếp theo từ ngữ cảnh.' : '“Tóm tắt đoạn văn sau thành 3 ý cho người mới học.”' },
      { title: foundations[0], tag: 'Kiến thức nền · 01', definition: language ? 'Token là đơn vị văn bản. Một từ có thể được tách thành nhiều token.' : 'Nhiệm vụ mô tả việc cần làm; đầu ra mô tả kết quả mong muốn.', example: language ? 'Văn bản → tokenizer → chuỗi token.' : 'Đầu vào: bài viết. Nhiệm vụ: tóm tắt. Đầu ra: 3 ý.' },
      { title: foundations[1], tag: 'Kiến thức nền · 02', definition: language ? 'Dữ liệu văn bản là thông tin biểu diễn bằng chữ, từ và câu.' : 'Bối cảnh cung cấp dữ kiện cần thiết để hiểu và thực hiện nhiệm vụ.', example: language ? 'Một câu hỏi và một đoạn hội thoại đều là dữ liệu văn bản.' : 'Cung cấp đoạn văn cần tóm tắt thay vì chỉ nói “tóm tắt giúp tôi”.' },
    ],
  }]
}))
