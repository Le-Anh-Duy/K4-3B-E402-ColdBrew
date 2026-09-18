# Case do người trong nhóm tự chạy

Mỗi file `.json` ở đây là **một phiên thật** do một thành viên chạy trên trang mock, xuất bằng nút "⬇ Xuất phiên này thành case".

Bốn chỗ phải tự điền sau khi xuất: `desc` · `author` · `expect` · `why`.

- `blind: true` — xuất ngay sau khi nộp quiz, **trước khi** thấy hệ thống chẩn đoán. Nhãn trong file là phán đoán độc lập của người chạy → case loại này có giá trị đo cao nhất.
- `blind: false` — xuất ở cuối phiên, có cả các vòng chẩn đoán. Người chạy đã thấy kết luận của máy nên nhãn dễ bị ảnh hưởng; vẫn dùng được để đo chuỗi leo cây.

Chưa điền `expect` (còn dấu `?`) thì `eval/run.js` sẽ bỏ qua và báo số case đang chờ điền.
