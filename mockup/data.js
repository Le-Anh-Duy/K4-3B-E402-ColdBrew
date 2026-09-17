// MOCK DATA — dựng tay, chưa trích tự động từ slide. Dùng cho CP2 (luồng hoạt động).
// Cây tri thức: gốc = bài giảng -> chương -> mục -> lá = một ý.

const TREE = {
  root: {
    id: 'root',
    label: 'Day 1 · AI & LLM Foundation',
    page: 'Slide d1 · trang 1–29',
    parent: null,
    compact: [
      'LLM sinh văn bản bằng cách đoán token kế tiếp, không tra cứu dữ liệu (trang 4–9)',
      'Prompt là cách ta đặt ràng buộc cho phần sinh đó (trang 12–18)',
      'RAG gắn thêm nguồn ngoài để câu trả lời có căn cứ (trang 20–27)',
    ],
  },
  c1: { id: 'c1', label: 'Chương 1 · LLM hoạt động thế nào', page: 'Slide d1 · trang 4–11', parent: 'root' },
  c1s1: { id: 'c1s1', label: '1.1 Token & tokenization', page: 'Slide d1 · trang 5–6', parent: 'c1' },
  c1s2: { id: 'c1s2', label: '1.2 Sinh văn bản tự hồi quy', page: 'Slide d1 · trang 8–9', parent: 'c1' },
  c2: { id: 'c2', label: 'Chương 2 · Prompting', page: 'Slide d1 · trang 12–18', parent: 'root' },
  c2s1: { id: 'c2s1', label: '2.1 Cấu trúc một prompt', page: 'Slide d1 · trang 13', parent: 'c2' },
  c2s2: { id: 'c2s2', label: '2.2 Few-shot', page: 'Slide d1 · trang 16–17', parent: 'c2' },
  c3: { id: 'c3', label: 'Chương 3 · RAG', page: 'Slide d1 · trang 20–27', parent: 'root' },
  c3s1: { id: 'c3s1', label: '3.1 Embedding', page: 'Slide d1 · trang 21–22', parent: 'c3' },
  c3s2: { id: 'c3s2', label: '3.2 Retrieval top-k', page: 'Slide d1 · trang 25', parent: 'c3' },

  // lá — mỗi lá là một ý trong mục
  l_token: { id: 'l_token', label: 'Token không phải là từ', page: 'Slide d1 · trang 5', parent: 'c1s1' },
  l_ctx: { id: 'l_ctx', label: 'Context window đếm bằng token', page: 'Slide d1 · trang 6', parent: 'c1s1' },
  l_next: { id: 'l_next', label: 'Mô hình đoán token kế tiếp', page: 'Slide d1 · trang 8', parent: 'c1s2' },
  l_temp: { id: 'l_temp', label: 'Temperature đổi độ ngẫu nhiên', page: 'Slide d1 · trang 9', parent: 'c1s2' },
  l_role: { id: 'l_role', label: 'Role · Context · Task', page: 'Slide d1 · trang 13', parent: 'c2s1' },
  l_shot: { id: 'l_shot', label: 'Ví dụ mẫu định hình đầu ra', page: 'Slide d1 · trang 16', parent: 'c2s2' },
  l_vec: { id: 'l_vec', label: 'Văn bản được vector hoá', page: 'Slide d1 · trang 21', parent: 'c3s1' },
  l_cos: { id: 'l_cos', label: 'Gần nhau về ngữ nghĩa = cosine cao', page: 'Slide d1 · trang 22', parent: 'c3s1' },
  l_topk: { id: 'l_topk', label: 'Lấy top-k đoạn liên quan nhất', page: 'Slide d1 · trang 25', parent: 'c3s2' },
};

// Quiz chính: 5 câu, mỗi câu gắn với một lá.
const QUIZ = [
  {
    node: 'l_token',
    q: 'Câu nào đúng về token?',
    options: ['Mỗi token luôn là một từ', 'Một từ dài có thể bị tách thành nhiều token', 'Token là một câu hoàn chỉnh', 'Token chỉ dùng cho tiếng Anh'],
    answer: 1,
  },
  {
    node: 'l_temp',
    q: 'Tăng temperature thì đầu ra của mô hình?',
    options: ['Ngẫu nhiên hơn, đa dạng hơn', 'Luôn chính xác hơn', 'Ngắn lại', 'Không đổi'],
    answer: 0,
  },
  {
    node: 'l_shot',
    q: 'Few-shot prompting nghĩa là gì?',
    options: ['Hỏi thật ngắn', 'Đưa vài ví dụ mẫu vào prompt', 'Chạy mô hình vài lần rồi lấy trung bình', 'Giảm số token đầu ra'],
    answer: 1,
  },
  {
    node: 'l_cos',
    q: 'Hai đoạn văn có nghĩa gần nhau thì vector của chúng?',
    options: ['Có cosine similarity cao', 'Có độ dài bằng nhau', 'Có cùng số chiều nhưng ngược dấu', 'Không liên quan gì'],
    answer: 0,
  },
  {
    node: 'l_topk',
    q: 'Trong RAG, "top-k" là gì?',
    options: ['k mô hình chạy song song', 'k đoạn tài liệu liên quan nhất được lấy ra', 'k lần thử lại khi lỗi', 'k token đầu tiên của câu trả lời'],
    answer: 1,
  },
];

// Câu hỏi chẩn đoán cho node cha — đơn giản hơn quiz, dùng để định vị chỗ hổng.
const PROBES = {
  c3s1: [
    { q: 'Embedding biến một đoạn văn bản thành?', options: ['Một dãy số (vector)', 'Một bức ảnh', 'Một câu tóm tắt', 'Một token duy nhất'], answer: 0 },
    { q: 'Hai vector embedding dùng để làm gì?', options: ['So sánh mức giống nhau về nghĩa', 'Nén file cho nhẹ', 'Mã hoá mật khẩu', 'Đếm số từ'], answer: 0 },
    { q: 'Cùng một câu đưa qua cùng một model embedding hai lần thì?', options: ['Ra vector như nhau', 'Ra vector ngẫu nhiên', 'Ra số chiều khác nhau', 'Báo lỗi'], answer: 0 },
  ],
  c3s2: [
    { q: 'Retrieval trong RAG làm gì?', options: ['Tìm đoạn tài liệu liên quan câu hỏi', 'Sinh câu trả lời', 'Huấn luyện lại mô hình', 'Dịch câu hỏi'], answer: 0 },
    { q: 'Vì sao cần retrieval trước khi trả lời?', options: ['Để câu trả lời dựa trên nguồn có thật', 'Để chạy nhanh hơn', 'Để tiết kiệm điện', 'Để đổi ngôn ngữ'], answer: 0 },
    { q: 'Nếu retrieval lấy sai đoạn thì?', options: ['Câu trả lời dễ sai theo', 'Mô hình tự sửa được', 'Không ảnh hưởng', 'Prompt bị xoá'], answer: 0 },
  ],
  c3: [
    { q: 'RAG là viết tắt của?', options: ['Retrieval-Augmented Generation', 'Random Answer Generator', 'Rapid AI Graph', 'Ranked Attention Gate'], answer: 0 },
    { q: 'RAG giải quyết vấn đề gì của LLM?', options: ['Trả lời không có nguồn, dễ bịa', 'Chạy chậm', 'Giao diện xấu', 'Không nói được tiếng Việt'], answer: 0 },
    { q: 'Thứ tự đúng của RAG?', options: ['Tìm tài liệu → đưa vào prompt → sinh câu trả lời', 'Sinh câu trả lời → tìm tài liệu', 'Huấn luyện → sinh → tìm', 'Tìm tài liệu → huấn luyện lại'], answer: 0 },
  ],
  c1s1: [
    { q: 'Vì sao phải tách văn bản thành token?', options: ['Mô hình chỉ xử lý được đơn vị rời rạc đã đánh số', 'Cho đẹp', 'Để dịch sang tiếng Anh', 'Để nén file'], answer: 0 },
    { q: 'Context window giới hạn cái gì?', options: ['Số token mô hình đọc được một lượt', 'Số người dùng cùng lúc', 'Kích thước màn hình', 'Số lần gọi API'], answer: 0 },
    { q: 'Văn bản dài hơn context window thì?', options: ['Phải cắt bớt hoặc chia nhỏ', 'Mô hình tự nhớ hết', 'Tự động nén không mất gì', 'Không sao cả'], answer: 0 },
  ],
  c1s2: [
    { q: 'Mô hình sinh văn bản bằng cách?', options: ['Đoán token kế tiếp, lặp lại nhiều lần', 'Tra trong cơ sở dữ liệu câu trả lời', 'Sao chép từ Internet', 'Dịch từ tiếng Anh'], answer: 0 },
    { q: 'Temperature = 0 thì đầu ra?', options: ['Gần như cố định mỗi lần chạy', 'Rất sáng tạo', 'Bị lỗi', 'Dài hơn'], answer: 0 },
    { q: 'Cùng một prompt chạy hai lần có thể ra khác nhau vì?', options: ['Có yếu tố ngẫu nhiên khi chọn token', 'Mô hình đổi phiên bản', 'Mạng chậm', 'Prompt tự đổi'], answer: 0 },
  ],
  c1: [
    { q: 'LLM về bản chất là?', options: ['Mô hình dự đoán token kế tiếp', 'Công cụ tìm kiếm', 'Cơ sở dữ liệu', 'Trình duyệt'], answer: 0 },
    { q: 'LLM có tra cứu Internet khi trả lời không (nếu không nối công cụ)?', options: ['Không, nó sinh từ tham số đã học', 'Có, luôn tra', 'Chỉ tra khi câu dài', 'Tuỳ mạng'], answer: 0 },
    { q: 'Vì vậy LLM có thể?', options: ['Nói sai một cách rất tự tin', 'Luôn đúng', 'Không trả lời được câu mới', 'Chỉ trả lời số'], answer: 0 },
  ],
  c2s2: [
    { q: 'Few-shot khác zero-shot ở chỗ?', options: ['Có kèm ví dụ mẫu', 'Ngắn hơn', 'Chạy nhanh hơn', 'Dùng model khác'], answer: 0 },
    { q: 'Ví dụ trong prompt có tác dụng gì?', options: ['Cho mô hình thấy định dạng đầu ra mong muốn', 'Huấn luyện lại mô hình', 'Tăng context window', 'Giảm giá tiền'], answer: 0 },
    { q: 'Ví dụ mẫu sai lệch thì?', options: ['Đầu ra bắt chước theo cái sai đó', 'Mô hình bỏ qua', 'Báo lỗi', 'Không ảnh hưởng'], answer: 0 },
  ],
  c2: [
    { q: 'Prompt tốt thường có?', options: ['Vai trò, bối cảnh, việc cần làm rõ ràng', 'Càng ngắn càng tốt', 'Nhiều câu hỏi cùng lúc', 'Viết hoa toàn bộ'], answer: 0 },
    { q: 'Vì sao prompt ảnh hưởng đầu ra?', options: ['Nó là toàn bộ bối cảnh mô hình dựa vào để đoán', 'Nó đổi tham số mô hình', 'Nó chọn máy chủ', 'Nó không ảnh hưởng'], answer: 0 },
    { q: 'Ràng buộc định dạng nên đặt ở đâu?', options: ['Ngay trong prompt', 'Sau khi có kết quả', 'Trong tên file', 'Không cần'], answer: 0 },
  ],
};

// Nội dung ôn gợi ý cho từng node (mock — trỏ về slide có sẵn, không sinh bài mới).
const REVIEW = {
  c3s1: ['Xem lại slide d1 trang 21–22: từ văn bản → vector', 'Làm lại 2 ví dụ so sánh cosine ở trang 22'],
  c3s2: ['Xem lại slide d1 trang 25: chọn top-k thế nào'],
  c3: ['Xem lại cả chương 3 (trang 20–27) theo thứ tự: embedding → retrieval → generation'],
  c1s1: ['Xem lại slide d1 trang 5–6 và thử tokenize một câu tiếng Việt'],
  c1s2: ['Xem lại slide d1 trang 8–9: vòng lặp đoán token + temperature'],
  c1: ['Xem lại chương 1 (trang 4–11) trước khi quay lại chương 3'],
  c2s1: ['Xem lại slide d1 trang 13: ba phần của một prompt'],
  c2s2: ['Xem lại slide d1 trang 16–17 và viết thử một prompt few-shot'],
  c2: ['Xem lại chương 2 (trang 12–18)'],
};

// Giải thích đáp án (mock) — why = vì sao đáp án đúng; traps = bẫy của từng phương án sai.
const EXPLAIN = {
  l_token: {
    why: 'Tokenizer cắt theo mẫu ký tự hay gặp, nên một từ dài có thể thành nhiều token, còn từ ngắn thông dụng chỉ một token. Tiếng Việt có dấu thường tốn nhiều token hơn tiếng Anh.',
    traps: {
      0: 'Nhầm "token = từ" — nhầm phổ biến nhất, và kéo theo tính sai context window.',
      2: 'Câu là đơn vị lớn hơn token rất nhiều.',
      3: 'Tokenizer làm việc với mọi ngôn ngữ, chỉ khác nhau ở số token sinh ra.',
    },
  },
  l_temp: {
    why: 'Temperature làm phẳng phân phối xác suất của token kế tiếp, nên những token ít khả năng hơn vẫn có cơ hội được chọn → đầu ra đa dạng hơn.',
    traps: {
      1: 'Đa dạng hơn không đồng nghĩa chính xác hơn — với câu cần chính xác thì thường ngược lại.',
      2: 'Độ dài do max tokens và nội dung quyết định, không phải temperature.',
      3: 'Có đổi: cùng một prompt chạy lại có thể ra kết quả khác.',
    },
  },
  l_shot: {
    why: 'Few-shot là đặt sẵn vài cặp ví dụ vào trong prompt để mô hình bắt chước định dạng và cách trả lời.',
    traps: {
      0: 'Độ dài prompt không phải điểm mấu chốt của few-shot.',
      2: 'Chạy nhiều lần rồi lấy kết quả phổ biến nhất là self-consistency, khác few-shot.',
      3: 'Thêm ví dụ làm prompt dài ra, không giảm token.',
    },
  },
  l_cos: {
    why: 'Embedding đặt các đoạn gần nghĩa vào vùng gần nhau trong không gian vector; mức gần đó đo bằng cosine similarity.',
    traps: {
      1: 'Mọi vector từ cùng một model đều cùng số chiều, không liên quan độ dài văn bản.',
      2: 'Ngược dấu là nghĩa trái nhau, không phải gần nhau.',
      3: 'Đây chính là cơ chế để tìm đoạn liên quan trong RAG.',
    },
  },
  l_topk: {
    why: 'Sau khi so vector câu hỏi với các đoạn tài liệu, hệ thống lấy k đoạn điểm cao nhất đưa vào prompt.',
    traps: {
      0: 'Không liên quan số mô hình chạy song song.',
      2: 'Số lần thử lại khi lỗi là retry, khác top-k.',
      3: 'Top-k nói về số đoạn tài liệu lấy ra, không phải số token đầu ra.',
    },
  },
};
