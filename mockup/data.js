// CÂY TRI THỨC — dựng TAY từ tài liệu thật của khoá (nhóm tự dựng, đề không cấp graph mẫu).
// Nguồn: data/vlearn-pack/transcript/transcript-01-clean.md
//        "Day 2 (sáng) — Xác định bài toán kinh doanh cho AI", 89 đoạn [T01-001..089]
// Provenance mỗi node: file + span (mã đoạn) + confidence.
//   conf 0.9 = ý được nói thẳng trong đoạn · 0.7 = nhóm lại từ nhiều đoạn
// Slide d2 chưa đối chiếu trang -> KHÔNG ghi số trang, để tránh trích dẫn sai.

const SRC = 'transcript-01-clean.md';
const cite = (spans, file = SRC) => `${file} · ${spans.map((s) => `[${s}]`).join(' ')}`;

const N = (id, label, parent, spans, conf, extra = {}) => {
  const file = extra.file || SRC;
  return {
    id,
    label,
    parent,
    file,
    span: spans,
    conf,
    page: cite(spans, file), // chuỗi hiển thị trong UI
    ...extra,
  };
};

const TREE = {
  root: N('root', 'Day 2 (sáng) · Xác định bài toán kinh doanh cho AI', null, ['T01-001', 'T01-089'], 0.9, {
    compact: [
      'Xác định đúng vấn đề trước; công nghệ chỉ là công cụ để giải nó [T01-004]',
      'Double Diamond: phân kỳ rồi hội tụ, làm hai lần — vấn đề trước, giải pháp sau [T01-049]',
      'Chọn việc bằng ma trận tác động – nỗ lực, ưu tiên high impact / low effort [T01-079]',
    ],
  }),

  // --- DAY 1 (PREREQUISITE TECH FOUNDATION) TỪ transcript-04 & transcript-06 ---
  c0: N('c0', 'Nền tảng Day 1 · Bản chất kỹ thuật của LLM', 'root', ['T04-046', 'T06-136'], 0.9, {
    file: 'transcript-04-clean.md',
  }),
  c0s1: N('c0s1', 'Day 1.1 Cơ chế sinh token xác suất & Ảo giác', 'c0', ['T06-136', 'T06-138'], 0.9, {
    file: 'transcript-06-clean.md',
  }),
  l_probabilistic: N('l_probabilistic', 'LLM dự đoán next token theo xác suất, không phải tri thức chắc chắn', 'c0s1', ['T04-047', 'T06-136'], 0.9, {
    file: 'transcript-04-clean.md',
  }),
  l_hallucination: N('l_hallucination', 'Ảo giác (Hallucination) là tất yếu do bias dữ liệu và autoregressive', 'c0s1', ['T04-048', 'T06-138', 'T06-139'], 0.9, {
    file: 'transcript-06-clean.md',
  }),
  l_context_rot: N('l_context_rot', 'Giới hạn context window và hiện tượng suy giảm chú ý (Context rot)', 'c0s1', ['T04-051', 'T04-052', 'T06-147'], 0.9, {
    file: 'transcript-04-clean.md',
  }),

  // --- DAY 2 CHƯƠNG 1 ---
  c1: N('c1', 'Chương 1 · Vì sao phải tìm đúng bài toán', 'root', ['T01-001', 'T01-017'], 0.7),
  c1s1: N('c1s1', '1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể', 'c1', ['T01-004', 'T01-006', 'T01-016'], 0.9),
  c1s2: N('c1s2', '1.2 Product manager và project manager', 'c1', ['T01-008', 'T01-011'], 0.9),

  // --- DAY 2 CHƯƠNG 2 & BỔ SUNG TỪ transcript-02 & transcript-03 ---
  c2: N('c2', 'Chương 2 · Đặc thù của sản phẩm AI', 'root', ['T01-018', 'T01-029'], 0.7),
  c2s1: N('c2s1', '2.1 Vì sao làm sản phẩm AI khó hơn', 'c2', ['T01-019', 'T01-021', 'T01-025'], 0.9, {
    prereq: ['c0s1'], // Cạnh tiên quyết: sản phẩm AI khó hơn vì bản chất xác suất của Day 1
  }),
  c2s2: N('c2s2', '2.2 Mức độ tự động hoá & Chi phí sai sót (Cost of error)', 'c2', ['T02-032', 'T03-088', 'T03-090'], 0.9, {
    file: 'transcript-02-clean.md',
    prereq: ['c0s1'], // Cạnh tiên quyết mục: muốn hiểu mức tự động hoá phải hiểu giới hạn kỹ thuật Day 1
  }),
  l_cost_of_error: N('l_cost_of_error', 'Chi phí lỗi cao thì phải giữ Human-in-the-loop (Augmentation)', 'c2s2', ['T02-032', 'T03-088'], 0.9, {
    file: 'transcript-02-clean.md',
    prereq: ['l_hallucination'], // Cạnh tiên quyết lá: chi phí lỗi bắt nguồn từ ảo giác tất yếu
  }),
  l_guardrail_odd: N('l_guardrail_odd', 'Ràng buộc phạm vi ODD và guardrail chặn rủi ro', 'c2s2', ['T03-090', 'T03-097'], 0.9, {
    file: 'transcript-03-clean.md',
    prereq: ['l_context_rot'], // Cạnh tiên quyết lá: guardrail và giới hạn ngữ cảnh
  }),

  // --- DAY 2 CHƯƠNG 3 ---
  c3: N('c3', 'Chương 3 · Tìm đúng vấn đề', 'root', ['T01-030', 'T01-073'], 0.7),
  c3s1: N('c3s1', '3.1 Double Diamond: phân kỳ – hội tụ', 'c3', ['T01-049', 'T01-069', 'T01-071', 'T01-074'], 0.9, {
    prereq: ['c1s1'], // phải phân biệt được vấn đề với giải pháp trước đã
  }),
  c3s2: N('c3s2', '3.2 Làm đúng cái sai vs làm sai cái đúng', 'c3', ['T01-050', 'T01-059', 'T01-060', 'T01-061'], 0.9, {
    prereq: ['c1s1'],
  }),
  c3s3: N('c3s3', '3.3 First principle thinking', 'c3', ['T01-062', 'T01-064', 'T01-068'], 0.9),
  c3s4: N('c3s4', '3.4 Kỹ thuật khám phá vấn đề', 'c3', ['T01-042', 'T01-045', 'T01-048', 'T01-072'], 0.7),

  // --- DAY 2 CHƯƠNG 4 ---
  c4: N('c4', 'Chương 4 · Chọn bài toán để làm', 'root', ['T01-074', 'T01-086'], 0.7),
  c4s1: N('c4s1', '4.1 Ma trận tác động – nỗ lực', 'c4', ['T01-074', 'T01-078', 'T01-079'], 0.9, {
    prereq: ['c3s1'], // ma trận chỉ dùng được sau khi đã phân kỳ rồi gom nhóm
  }),
  c4s2: N('c4s2', '4.2 Vòng lặp HCD', 'c4', ['T01-081', 'T01-084'], 0.9, { prereq: ['c3s4'] }),

  // lá — mỗi lá là một ý trong mục
  l_quantinh: N('l_quantinh', 'Quán tính nhảy thẳng vào giải pháp', 'c1s1', ['T01-004', 'T01-016'], 0.9),
  l_boctach: N('l_boctach', 'Bóc tách yêu cầu mơ hồ rồi verify với stakeholder', 'c1s1', ['T01-006'], 0.9),
  l_pm: N('l_pm', 'PM tự đi tìm bài toán; project manager lo tiến độ', 'c1s2', ['T01-010', 'T01-011'], 0.9),
  l_po: N('l_po', 'Product owner đào sâu user khi bài toán đã rõ', 'c1s2', ['T01-011'], 0.9),
  l_kyvong: N('l_kyvong', 'Kỳ vọng người dùng thay đổi rất nhanh', 'c2s1', ['T01-020'], 0.9),
  l_chuyendoi: N('l_chuyendoi', 'Chi phí chuyển đổi sản phẩm rẻ đi', 'c2s1', ['T01-021'], 0.9),
  l_phanky: N('l_phanky', 'Phân kỳ: mở rộng góc nhìn để thu insight', 'c3s1', ['T01-071'], 0.9),
  l_hoitu: N('l_hoitu', 'Hội tụ: gom nhóm, Five Whys, lọc trùng', 'c3s1', ['T01-074'], 0.9, {
    prereq: ['l_phanky'],
  }),
  l_dungcaisai: N('l_dungcaisai', 'Làm đúng cái sai nguy hiểm hơn', 'c3s2', ['T01-060', 'T01-061'], 0.9),
  l_firstprinciple: N('l_firstprinciple', 'Bóc vấn đề về nguyên lý gốc', 'c3s3', ['T01-064'], 0.9),
  l_quansat: N('l_quansat', 'Quan sát người dùng tại nơi họ làm việc', 'c3s4', ['T01-072'], 0.9),
  l_dogfood: N('l_dogfood', 'Dogfooding: tự làm user của sản phẩm mình', 'c3s4', ['T01-042'], 0.9),
  l_trithucan: N('l_trithucan', 'Tri thức ẩn của chuyên gia', 'c3s4', ['T01-048'], 0.9),
  l_matran: N('l_matran', 'Đặt vấn đề lên hai trục tác động và nỗ lực', 'c4s1', ['T01-078'], 0.9),
  l_quickwin: N('l_quickwin', 'High impact – low effort là quick win', 'c4s1', ['T01-079'], 0.9),
  l_dongcam: N('l_dongcam', 'Đồng cảm là bước đầu, khác bước test', 'c4s2', ['T01-084'], 0.9),
};

// Quiz: 5 câu, mỗi câu gắn một lá. Câu 1-2 cùng mục 1.1, câu 4-5 cùng mục 3.1.
const QUIZ = [
  {
    node: 'l_quantinh',
    q: 'Theo bài giảng, vì sao thói quen "nghe yêu cầu là nhảy thẳng vào giải pháp" lại nguy hiểm?',
    options: [
      'Vì giải pháp thường tốn nhiều tiền',
      'Vì não chạy theo tư duy nhanh và bỏ qua bước xác định vấn đề',
      'Vì công nghệ thay đổi quá nhanh',
      'Vì stakeholder không thích bị hỏi lại',
    ],
    answer: 1,
  },
  {
    node: 'l_boctach',
    q: 'Sếp đưa một yêu cầu rất chung chung. Cách làm được bài giảng khuyến nghị là gì?',
    options: [
      'Bóc tách thành vài phương án cụ thể rồi hỏi lại để xác nhận',
      'Chờ đến khi sếp mô tả rõ ràng hơn',
      'Chọn giải pháp phổ biến nhất trên thị trường',
      'Cứ làm thử một bản rồi sửa sau',
    ],
    answer: 0,
  },
  {
    node: 'l_dungcaisai',
    q: 'Theo quan điểm của giảng viên, cái nào nguy hiểm hơn?',
    options: ['Làm sai cái đúng', 'Làm đúng cái sai', 'Hai cái nguy hiểm như nhau', 'Tuỳ vào ngân sách dự án'],
    answer: 1,
  },
  {
    node: 'l_phanky',
    q: 'Bước phân kỳ ở viên kim cương thứ nhất gồm những kỹ thuật nào?',
    options: [
      'Quan sát, phỏng vấn, khảo sát, đọc log hành vi người dùng',
      'Gom nhóm các vấn đề rồi lọc trùng',
      'Vẽ ma trận tác động – nỗ lực',
      'Viết user story cho đội phát triển',
    ],
    answer: 0,
  },
  {
    node: 'l_hoitu',
    q: 'Pha hội tụ dùng những kỹ thuật nào?',
    options: [
      'Gom nhóm, hỏi Five Whys, lọc trùng',
      'Phỏng vấn thêm thật nhiều người dùng mới',
      'Mở rộng góc nhìn để có thêm insight',
      'Tăng số lượng ý tưởng càng nhiều càng tốt',
    ],
    answer: 0,
  },
];

// Câu hỏi chẩn đoán cho node cha — đơn giản hơn quiz, dùng để định vị chỗ hổng.
// ponytail: bộ câu TĨNH, chung cho cả node cha. Hạn chế: học viên sai ý A mà 3 câu nền
// lại hỏi khía cạnh B/C/D thì "đúng hết" không chứng minh được nền của A vững.
// Nâng cấp: AI sinh câu nền CÓ ĐIỀU KIỆN theo (node cha, lá bị sai, phương án đã chọn),
// trích từ span của node cha; bộ tĩnh này giữ làm dự phòng khi API chết. Xem spec.md.
const PROBES = {
  c1s1: [
    {
      q: 'Theo bài giảng, việc đầu tiên khi nhận một yêu cầu công nghệ là gì?',
      options: [
        'Xác định vấn đề trước, công nghệ chỉ là công cụ để giải nó',
        'Chọn công nghệ mạnh nhất hiện có',
        'Ước lượng chi phí triển khai',
        'Lập kế hoạch tiến độ',
      ],
      answer: 0,
    },
    {
      q: 'Vì sao con người hay nhảy thẳng vào giải pháp?',
      options: [
        'Não đi theo thói quen, chạy bằng tư duy nhanh',
        'Vì không đủ dữ liệu',
        'Vì bị giới hạn ngân sách',
        'Vì công cụ AI gợi ý sẵn',
      ],
      answer: 0,
    },
    {
      q: 'Khi đề bài còn mơ hồ, nên làm gì trước?',
      options: [
        'Đưa ra vài phương án cụ thể rồi hỏi lại để xác nhận',
        'Tự chọn cách hiểu của mình rồi làm luôn',
        'Từ chối nhận việc',
        'Chờ tài liệu chính thức',
      ],
      answer: 0,
    },
  ],
  c1: [
    {
      q: 'Theo thống kê được nhắc trong bài, phần lớn thành bại khi đưa AI vào doanh nghiệp đến từ đâu?',
      options: ['Con người và vận hành', 'Chất lượng mô hình', 'Hạ tầng GPU', 'Ngân sách marketing'],
      answer: 0,
    },
    {
      q: 'Vị trí mà giảng viên cho là đang thiếu nhất trên thị trường?',
      options: [
        'Người xác định và bóc tách bài toán',
        'Kỹ sư huấn luyện mô hình',
        'Người viết prompt',
        'Quản trị hạ tầng',
      ],
      answer: 0,
    },
    {
      q: 'Product manager khác project manager ở chỗ nào?',
      options: [
        'PM tự đi tìm bài toán đáng làm; project manager lo tiến độ và ngân sách',
        'PM viết code, project manager viết tài liệu',
        'Hai vai trò giống nhau, chỉ khác tên gọi',
        'PM chỉ có ở công ty outsourcing',
      ],
      answer: 0,
    },
  ],
  c3s1: [
    {
      q: 'Mô hình Double Diamond có mấy pha?',
      options: [
        'Bốn: mở rộng, hội tụ, rồi lại mở rộng, hội tụ',
        'Hai: phân tích và thiết kế',
        'Ba: nghiên cứu, làm, đo',
        'Năm: theo vòng đời dự án',
      ],
      answer: 0,
    },
    {
      q: 'Viên kim cương thứ nhất phục vụ việc gì?',
      options: ['Tìm đúng vấn đề', 'Tìm đúng giải pháp', 'Lập kế hoạch nguồn lực', 'Đo kết quả sau khi ra mắt'],
      answer: 0,
    },
    {
      q: 'Trong hình kim cương, đường đi lên và đi xuống nghĩa là gì?',
      options: [
        'Đi lên là mở rộng, đi xuống là hội tụ',
        'Đi lên là tăng ngân sách, đi xuống là cắt giảm',
        'Đi lên là tăng người, đi xuống là giảm người',
        'Không mang nghĩa gì, chỉ là hình vẽ',
      ],
      answer: 0,
    },
  ],
  c3s2: [
    {
      q: 'Vì sao "làm đúng cái sai" bị coi là nguy hiểm hơn?',
      options: [
        'Vì ta tự giới hạn không gian giải pháp cho một vấn đề vốn đã sai',
        'Vì nó luôn tốn nhiều tiền hơn',
        'Vì khách hàng sẽ phàn nàn ngay',
        'Vì đội phát triển sẽ bỏ việc',
      ],
      answer: 0,
    },
    {
      q: 'Khi đã lao vào một vấn đề, cơ chế tâm lý thường thấy là gì?',
      options: [
        'Coi nó là đích rồi, rất khó dừng lại để hỏi lại từ đầu',
        'Luôn sẵn sàng đổi hướng',
        'Chủ động đi hỏi người ngoài',
        'Giảm dần sự tự tin',
      ],
      answer: 0,
    },
    {
      q: 'Nếu rơi vào "làm sai cái đúng" thì xử lý thế nào?',
      options: [
        'Vấn đề vẫn đúng nên đi tìm giải pháp khác',
        'Bỏ hẳn bài toán đó',
        'Đổi sang vấn đề dễ hơn',
        'Giữ nguyên giải pháp và làm kỹ hơn',
      ],
      answer: 0,
    },
  ],
  c2s2: [
    {
      q: 'Khi nào nên chọn mức tự động hoá hoàn toàn (Automation) thay vì có con người trợ giúp (Augmentation)?',
      options: [
        'Khi chi phí sai sót (cost of error) thấp và có thể chấp nhận lỗi',
        'Khi bài toán liên quan đến y tế hoặc chẩn đoán quan trọng',
        'Khi sếp yêu cầu tự động hoá 100% để giảm chi phí nhân sự',
        'Bất kỳ khi nào mô hình đạt độ chính xác trên 80%',
      ],
      answer: 0,
    },
    {
      q: 'Theo bài giảng, vì sao việc cấp quyền tự động cho AI (như gửi email, xác nhận chuyển tiền) lại nguy hiểm?',
      options: [
        'Nếu không có guardrail và con người kiểm duyệt, sai sót có thể gây thiệt hại pháp lý và tài chính nghiêm trọng',
        'Vì AI gửi email chậm hơn con người viết tay',
        'Vì chi phí API sẽ tăng gấp 10 lần',
        'Vì nhà cung cấp mô hình sẽ cấm tài khoản',
      ],
      answer: 0,
    },
    {
      q: 'Khái niệm ODD (Operational Design Domain) và ràng buộc phạm vi trong bài giảng nhằm mục đích gì?',
      options: [
        'Xác định rõ điều kiện và phạm vi hệ thống chạy đúng, từ chối hoặc cảnh báo khi vượt ngoài phạm vi',
        'Huấn luyện lại mô hình từ đầu mỗi tuần',
        'Đo tốc độ phản hồi tính bằng mili-giây của server',
        'Tăng độ sáng tạo (temperature) của mô hình lên tối đa',
      ],
      answer: 0,
    },
  ],
  c0s1: [
    {
      q: 'Bản chất quá trình sinh văn bản của các mô hình LLM là gì?',
      options: [
        'Dự đoán token tiếp theo theo xác suất thống kê trong không gian toán học, không phải hiểu biết chắc chắn',
        'Tra cứu dữ liệu từ một cơ sở dữ liệu bách khoa toàn thư đã lưu sẵn',
        'Thực thi các luật logic if-else được lập trình sẵn',
        'Dịch nguyên văn từng từ một từ tiếng Anh sang tiếng Việt',
      ],
      answer: 0,
    },
    {
      q: 'Vì sao hiện tượng ảo giác (hallucination) trong LLM được coi là tất yếu?',
      options: [
        'Do dữ liệu huấn luyện luôn có bias và mô hình chỉ tối ưu việc nối các token cho thuận tai',
        'Do server bị quá tải phần cứng',
        'Do người dùng không mua gói trả phí cao cấp',
        'Chỉ xảy ra ở các mô hình đời cũ, các mô hình mới đã loại bỏ hoàn toàn',
      ],
      answer: 0,
    },
    {
      q: 'Hiện tượng Context Rot (suy giảm ngữ cảnh) trong LLM xảy ra khi nào?',
      options: [
        'Khi đưa quá nhiều thông tin vào context window khiến mô hình phân tán sự chú ý và quên thông tin ở đầu',
        'Khi mô hình không được kết nối internet trong 24 giờ',
        'Khi văn bản đầu vào chứa ký tự đặc biệt',
        'Khi nhiệt độ (temperature) được đặt về 0',
      ],
      answer: 0,
    },
  ],
  c3: [
    {
      q: 'Câu của Don Norman "Do not solve the problem I am asked to solve" ý nói gì?',
      options: [
        'Đừng vội tin vấn đề được giao là vấn đề thật, phải tìm điểm đau phía sau',
        'Đừng nhận việc từ người khác',
        'Chỉ giải vấn đề của chính mình',
        'Luôn làm đúng yêu cầu khách hàng',
      ],
      answer: 0,
    },
    {
      q: 'Dogfooding nghĩa là gì?',
      options: [
        'Tự mình là user và dùng chính sản phẩm mình làm ra',
        'Thuê người ngoài kiểm thử',
        'Ra mắt bản beta cho thị trường',
        'Sao chép sản phẩm của đối thủ',
      ],
      answer: 0,
    },
    {
      q: 'Tri thức ẩn của chuyên gia gây khó khăn gì khi đi tìm vấn đề?',
      options: [
        'Họ quyết định bằng trực giác mà không dừng lại lý giải, nên khó truyền lại',
        'Họ luôn quyết định sai',
        'Họ không chịu chia sẻ',
        'Họ cần nhiều dữ liệu hơn người mới',
      ],
      answer: 0,
    },
  ],
};

// Nội dung ôn gợi ý cho từng node (trỏ về đoạn transcript có thật, không sinh nội dung mới).
const REVIEW = {
  c1s1: [
    'Nghe lại [T01-004] và [T01-006]: vấn đề trước, công nghệ sau',
    'Thử bóc một yêu cầu mơ hồ của chính bạn thành 3 phương án A/B/C',
  ],
  c1s2: ['Nghe lại [T01-010] và [T01-011] về khác biệt PM / project manager / product owner'],
  c1: ['Đi lại cả chương 1 [T01-001…T01-017] theo thứ tự trước khi sang chương 3'],
  c2s1: ['Nghe lại [T01-020] và [T01-021] về kỳ vọng người dùng và chi phí chuyển đổi'],
  c2s2: [
    'Nghe lại [T02-032] về phổ Automation vs Augmentation',
    'Nghe lại [T03-088] và [T03-090] về incident sai sót và vai trò của guardrail',
  ],
  c0s1: [
    'Nghe lại [T04-047] và [T06-136] về cơ chế dự đoán next token',
    'Nghe lại [T06-138] và [T06-139] về bản chất ảo giác (hallucination)',
    'Nghe lại [T04-051] và [T04-053] về quản lý context window và attention',
  ],
  c3s1: [
    'Nghe lại [T01-049] và [T01-071]: bốn pha của Double Diamond',
    'Đối chiếu [T01-074] để phân biệt kỹ thuật phân kỳ với kỹ thuật hội tụ',
  ],
  c3s2: ['Nghe lại [T01-060] và [T01-061] về "làm đúng cái sai"'],
  c3s3: ['Nghe lại [T01-064] về first principle thinking'],
  c3s4: ['Nghe lại [T01-042] dogfooding, [T01-048] tri thức ẩn, [T01-072] quan sát tại chỗ'],
  c3: ['Đi lại chương 3 [T01-030…T01-073]: tìm vấn đề đúng → Double Diamond → kỹ thuật khám phá'],
  c4s1: ['Nghe lại [T01-078] và [T01-079]: hai trục của ma trận và ý nghĩa quick win'],
  c4s2: ['Nghe lại [T01-084]: đồng cảm khác test ở chỗ nào'],
  c4: ['Đi lại chương 4 [T01-074…T01-086]'],
};

// Giải thích đáp án (mock) — why = vì sao đáp án đúng; traps = bẫy của từng phương án sai.
const EXPLAIN = {
  l_quantinh: {
    why: 'Bài giảng dẫn "Thinking, Fast and Slow": não chạy tư duy nhanh theo thói quen, nghe vấn đề là phản ứng ngay bằng giải pháp, nên bước xác định vấn đề bị bỏ qua [T01-016].',
    traps: {
      0: 'Tiền bạc không phải lý do được nêu — vấn đề nằm ở thói quen tư duy.',
      2: 'Công nghệ đổi nhanh là chuyện khác; ở đây nói về quán tính của người ra quyết định.',
      3: 'Bài giảng khuyến khích hỏi lại stakeholder, không nói họ khó chịu.',
    },
  },
  l_boctach: {
    why: 'Cách được nêu là tự biến cái mơ hồ thành cụ thể: đưa ra A, B, C rồi hỏi lại "em hiểu đúng không, là cái nào" để verify với stakeholder [T01-006].',
    traps: {
      1: 'Chờ người giao việc nói rõ là kỳ vọng sai — nhiều khi chính họ cũng chưa biết mình muốn gì [T01-005].',
      2: 'Chọn theo số đông chính là nhảy vào giải pháp, đúng cái bẫy bài giảng cảnh báo.',
      3: 'Làm thử rồi sửa không thay được bước làm rõ đề bài.',
    },
  },
  l_dungcaisai: {
    why: 'Quan điểm của giảng viên: làm đúng cái sai nguy hiểm hơn, vì ta tự giới hạn không gian giải pháp cho một vấn đề vốn đã sai, lại còn có cảm giác đang tiến triển [T01-060] [T01-061].',
    traps: {
      0: 'Làm sai cái đúng thì vấn đề vẫn đúng — chỉ cần đi tìm giải pháp khác [T01-059].',
      2: 'Bài giảng nhận đây là vấn đề gây tranh cãi nhưng vẫn nêu quan điểm rõ, không coi hai cái ngang nhau.',
      3: 'Ngân sách không phải tiêu chí được nhắc tới.',
    },
  },
  l_phanky: {
    why: 'Phân kỳ là bước mở rộng góc nhìn: quan sát, phỏng vấn, khảo sát, đọc log hành vi — thu càng nhiều insight càng tốt [T01-071].',
    traps: {
      1: 'Gom nhóm và lọc trùng là kỹ thuật của pha HỘI TỤ [T01-074] — đây là chỗ hay lẫn nhất.',
      2: 'Ma trận tác động – nỗ lực dùng ở cuối pha hội tụ [T01-078].',
      3: 'User story thuộc giai đoạn triển khai, không nằm trong viên kim cương thứ nhất.',
    },
  },
  l_hoitu: {
    why: 'Hội tụ là gom lại: nhóm các vấn đề, hỏi Five Whys để đào sâu nguyên nhân, lọc trùng [T01-074].',
    traps: {
      1: 'Phỏng vấn thêm là mở rộng, tức pha phân kỳ.',
      2: 'Mở rộng góc nhìn chính là định nghĩa của phân kỳ — ngược với hội tụ.',
      3: 'Tăng số ý tưởng cũng là phân kỳ.',
    },
  },
  l_cost_of_error: {
    why: 'Chi phí lỗi là tiêu chí cốt lõi để quyết định mức tự động hoá: chi phí sai sót càng cao thì càng phải giữ con người ở khâu kiểm duyệt cuối (Human-in-the-loop) [T02-032] [T03-088].',
    traps: {
      1: 'Độ chính xác cao không thay thế được chi phí lỗi — 1% sai sót trong y tế/pháp lý vẫn có thể gây hậu quả nghiêm trọng [T03-099].',
      2: 'Tự động hoá 100% khi chưa đánh giá rủi ro là bẫy nguy hiểm nhất của sản phẩm AI [T03-090].',
      3: 'Ngân sách không quyết định mức an toàn vận hành của hệ thống.',
    },
  },
  l_guardrail_odd: {
    why: 'Hệ thống AI bắt buộc phải có phạm vi thiết kế vận hành (ODD) và lớp bảo vệ (guardrail) để từ chối yêu cầu ngoài phạm vi hoặc ngăn rò rỉ thông tin [T03-090] [T03-097].',
    traps: {
      1: 'Nghĩ rằng AI xử lý được mọi tình huống ngoài scope là nhận thức sai lầm cơ bản [T03-098].',
      2: 'Guardrail là lớp kiểm soát độc lập, không phải dựa vào bản thân mô hình tự giác.',
      3: 'ODD không phải chỉ dùng cho xe tự hành mà áp dụng cho mọi hệ thống AI thực tế [T03-095].',
    },
  },
  l_probabilistic: {
    why: 'Mô hình ngôn ngữ lớn hoạt động bằng cách dự đoán xác suất xuất hiện của token tiếp theo dựa trên hàng triệu mẫu văn bản đã học, không phải tra cứu chân lý [T04-047] [T06-136].',
    traps: {
      1: 'Nhầm LLM với cơ sở dữ liệu tra cứu dẫn đến việc tin tưởng mù quáng vào mọi câu trả lời.',
      2: 'LLM không phải hệ thống suy luận logic tất định như mã nguồn thông thường.',
      3: 'Token là đơn vị số học được biểu diễn trong không gian vector, không phải từ nguyên vẹn [T06-135].',
    },
  },
  l_hallucination: {
    why: 'Ảo giác (Hallucination) là đặc tính cố hữu của cơ chế autoregressive và bias dữ liệu đầu vào, khiến mô hình sinh ra thông tin nghe rất thuyết phục nhưng sai sự thật [T04-048] [T06-138].',
    traps: {
      1: 'Nghĩ rằng mô hình lớn hơn hoặc prompt dài hơn sẽ triệt tiêu hoàn toàn hallucination là sai lầm [T06-138].',
      2: 'Hallucination không phải lỗi phần cứng hay mạng mà là tính chất toán học của mô hình sinh.',
      3: 'RAG giảm thiểu nhưng không xóa bỏ hoàn toàn nguy cơ ảo giác nếu trích xuất sai context [T06-139].',
    },
  },
  l_context_rot: {
    why: 'Context window quá tải sẽ gây ra hiện tượng Context Rot: mô hình mất tập trung vào các thông tin cốt lõi ban đầu và chi phí API tăng đột biến [T04-051] [T04-052] [T04-057].',
    traps: {
      1: 'Càng nhét nhiều tài liệu vào prompt thì chất lượng câu trả lời càng giảm nếu không chọn lọc ngữ cảnh.',
      2: 'Cửa sổ ngữ cảnh 1 triệu token không đồng nghĩa với việc mô hình xử lý thông minh hơn 100k token [T04-052].',
      3: 'Quản lý context là trách nhiệm của kỹ sư thiết kế hệ thống, không thể phó mặc cho mô hình tự tóm tắt.',
    },
  },
};

// Giải thích cho câu hỏi chẩn đoán — cùng thứ tự với PROBES.
const PROBE_WHY = {
  c1s1: [
    'Bài giảng nói thẳng: công nghệ sinh ra để giải một vấn đề, nên phải biết vấn đề trước rồi mới chọn công cụ [T01-004].',
    'Não đi theo thói quen; không tự bắt mình dừng lại đặt câu hỏi thì sẽ bị cuốn theo tư duy nhanh mãi [T01-016].',
    'Người làm phải là người biến cái mơ hồ thành cụ thể rồi mang lại verify với stakeholder [T01-006].',
  ],
  c1: [
    'Nghiên cứu được dẫn trong bài: khoảng 70% đến từ con người và vận hành, không phải công nghệ [T01-003].',
    'Thị trường tuyển rất nhiều AI engineer nhưng thiếu người đặt ra đề bài đáng làm [T01-002].',
    'Product manager tự đi tìm bài toán và thị trường; project manager đảm bảo dự án đúng tiến độ, trong ngân sách [T01-010] [T01-011].',
  ],
  c2s2: [
    'Bài giảng nhấn mạnh: cho AI toàn quyền thì phải chấp nhận rủi ro; chi phí lỗi cao bắt buộc phải giữ con người trong vòng lặp [T02-032].',
    'Incident muối tẩy và chatbot hoàn vé cho thấy nếu cấp quyền tự động không có guardrail, công ty phải đối mặt với hậu quả pháp lý [T03-088] [T03-090].',
    'Phải xác định ODD và ràng buộc: hệ thống chỉ chạy đúng khi đủ điều kiện, không nhận định bừa ngoài scope [T03-097] [T03-098].',
  ],
  c0s1: [
    'LLM bản chất là dự đoán xác suất token tiếp theo từ các mẫu đã học, không phải tra cứu tri thức chắc chắn [T04-047] [T06-136].',
    'Dữ liệu có bias và cơ chế autoregressive khiến mô hình luôn có xác suất ảo giác không thể triệt tiêu 100% [T04-048] [T06-138].',
    'Context window lớn dễ bị context rot và phân tán attention; quản lý context chất lượng quan trọng hơn tống nhiều token [T04-051] [T04-053].',
  ],
  c3s1: [
    'Double Diamond gồm bốn pha: mở rộng – hội tụ cho vấn đề, rồi mở rộng – hội tụ cho giải pháp [T01-049].',
    'Viên kim cương thứ nhất là problem discovery — tìm đúng vấn đề trước khi nghĩ giải pháp [T01-049].',
    'Đường đi lên là mở rộng, đường đi xuống là hội tụ [T01-049].',
  ],
  c3s2: [
    'Khi vấn đề đã sai, mọi giải pháp đều bị giới hạn trong cái sai đó [T01-060].',
    'Con người đã xác định đích là lao vào, rất khó dừng lại tự hỏi đặt vấn đề có sai không [T01-060].',
    'Sai giải pháp thì vấn đề vẫn còn đúng, chỉ cần đi tìm cách khác [T01-059].',
  ],
  c3: [
    'Don Norman: đừng lập tức tin vấn đề được giao là vấn đề thật, phải tìm điểm đau phía sau [T01-045].',
    'Dogfooding là tự làm user của chính sản phẩm mình — Jira dùng Jira để xây Jira [T01-042].',
    'Chuyên gia quyết định bằng trực giác tích luỹ nhiều năm mà không dừng lại lý giải, nên tri thức đó khó lấy ra [T01-048].',
  ],
};

// cho phép chạy bằng node (bộ eval); trong browser thì `module` không tồn tại nên bỏ qua
if (typeof module !== 'undefined')
  module.exports = { TREE, QUIZ, PROBES, EXPLAIN, PROBE_WHY, REVIEW, SRC };
