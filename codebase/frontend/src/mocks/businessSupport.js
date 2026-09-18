// Explicit frontend-only practice, not a backend diagnosis or API response.
// Used because the server has no similar-example/recheck API and its three-question
// probe contract cannot support the unchanged one-question/two-round UI.
const question = (id, concept, text, options, correct, explanation) => ({ id: `demo-business-${id}`, concept, text, options, correct, explanation, source: 'demo' })
const groups = {
  c1s1: {
    title: 'Làm rõ bài toán',
    similar: question('problem-similar', 'Làm rõ bài toán', 'Nhóm được yêu cầu “làm một chatbot”. Bạn nên làm rõ điều gì trước?', ['Màu sắc của chatbot', 'Người dùng gặp khó khăn gì và cần kết quả nào', 'Tên miền cho chatbot', 'Số lượng nút trên màn hình'], 1, 'Cần hiểu vấn đề và kết quả mong muốn trước khi chọn giải pháp.'),
    recheck: question('problem-recheck', 'Làm rõ bài toán', 'Một yêu cầu mơ hồ nên được xử lý thế nào?', ['Triển khai ngay công nghệ quen thuộc', 'Diễn đạt thành các cách hiểu cụ thể rồi xác nhận lại', 'Tăng số lượng tính năng', 'Chỉ đổi tên dự án'], 1, 'Làm rõ và xác nhận yêu cầu giúp tránh giải quyết nhầm vấn đề.'),
  },
  c3s1: {
    title: 'Phân kỳ và hội tụ',
    similar: question('diamond-similar', 'Phân kỳ và hội tụ', 'Nhóm đang thu thập nhiều góc nhìn qua phỏng vấn. Đây là hoạt động nào?', ['Hội tụ để chốt giải pháp', 'Phân kỳ để mở rộng hiểu biết', 'Triển khai sản phẩm', 'Kết thúc nghiên cứu'], 1, 'Thu thập thêm góc nhìn là hoạt động phân kỳ.'),
    recheck: question('diamond-recheck', 'Phân kỳ và hội tụ', 'Sau khi thu thập nhiều vấn đề, nhóm gom nhóm và lọc trùng. Đây là bước nào?', ['Mở rộng góc nhìn', 'Hội tụ', 'Bắt đầu phỏng vấn', 'Chọn công nghệ trước'], 1, 'Gom nhóm và lọc trùng giúp hội tụ vào vấn đề cần ưu tiên.'),
  },
  c3s2: {
    title: 'Tìm đúng vấn đề',
    similar: question('right-similar', 'Tìm đúng vấn đề', 'Một tính năng được xây rất tốt nhưng không giải quyết nhu cầu người dùng. Vấn đề nằm ở đâu?', ['Chắc chắn chỉ ở tốc độ lập trình', 'Có thể nhóm đã chọn sai vấn đề để giải quyết', 'Chỉ ở màu sắc giao diện', 'Không cần thay đổi gì'], 1, 'Thực hiện tốt một giải pháp không chứng minh rằng vấn đề ban đầu đáng giải quyết.'),
    recheck: question('right-recheck', 'Tìm đúng vấn đề', 'Khi vấn đề đúng nhưng cách giải quyết chưa hiệu quả, nên làm gì?', ['Bỏ qua nhu cầu người dùng', 'Tìm và kiểm chứng giải pháp khác', 'Giữ nguyên mọi thứ', 'Thêm tính năng không liên quan'], 1, 'Giữ mục tiêu giải quyết vấn đề và kiểm chứng một cách tiếp cận khác.'),
  },
}
const checks = [
  question('foundation1', 'Vấn đề và giải pháp', 'Phát biểu nào mô tả một vấn đề của người dùng?', ['Mất nhiều thời gian tìm tài liệu cần dùng', 'Xây một chatbot', 'Dùng mô hình lớn hơn', 'Thêm một màn hình mới'], 0, 'Khó khăn người dùng gặp phải là vấn đề; chatbot hoặc màn hình là các giải pháp có thể cân nhắc.'),
  question('foundation2', 'Nhu cầu người dùng', 'Muốn hiểu khó khăn của người dùng, nên bắt đầu bằng gì?', ['Quan sát hoặc hỏi về công việc thực tế của họ', 'Đoán nhu cầu từ sở thích của mình', 'Chọn công nghệ trước', 'Sao chép mọi tính năng của đối thủ'], 0, 'Quan sát và hỏi về công việc thực tế giúp làm rõ nhu cầu.'),
]
export function businessSupport(nodeId) {
  const group = groups[nodeId] || groups.c1s1
  return {
    source: 'demo', similar: group.similar, recheck: group.recheck,
    foundations: checks.map(q => q.concept), checks,
    cards: [
      { title: group.title, tag: 'Ví dụ ôn tập demo', definition: group.similar.explanation, example: group.recheck.explanation, source: 'demo' },
      { title: checks[0].concept, tag: 'Kiến thức nền demo · 01', definition: checks[0].explanation, example: 'Vấn đề: tìm tài liệu mất thời gian. Giải pháp có thể thử: cải thiện tìm kiếm.', source: 'demo' },
      { title: checks[1].concept, tag: 'Kiến thức nền demo · 02', definition: checks[1].explanation, example: 'Quan sát người học tìm tài liệu và ghi nhận bước họ bị kẹt.', source: 'demo' },
    ],
  }
}
export const businessQuestions = [...Object.values(groups).flatMap(g => [g.similar, g.recheck]), ...checks]
