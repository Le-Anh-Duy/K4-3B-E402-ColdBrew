# Về dữ liệu trong repo này

> Repo công khai. Nhóm cam kết tuân thủ quy định bảo mật dữ liệu của khoá.

## Repo KHÔNG chứa data pack

Không có `data/vlearn-pack/`, không có `tutor_turns.csv`, không có file transcript hay slide
gốc nào. `.gitignore` chặn `/data/` và `*.pdf`. Kiểm tra bất cứ lúc nào:

```
git ls-files | grep -iE "vlearn|transcript-|tutor_turns"    # phải ra rỗng
```

## Thứ có trong repo, và nó là gì

| Đường dẫn | Là gì | Có phải dữ liệu thật không |
|---|---|---|
| `mockup/data.js` · `eval/graph.json` · `codebase/backend/app/data/*.json` | Cây tri thức 30 node **nhóm tự dựng tay** — nhãn khái niệm do nhóm đặt, kèm **mã đoạn** `[T01-xxx]` để truy nguồn | Không phải bản sao tài liệu. Chỉ là **nhãn + mã trích dẫn**; chuỗi dài nhất 180 ký tự |
| `eval/cases.json` · `eval/cp3_inputs.json` | Hồ sơ trả lời quiz **giả**, do nhóm tự sinh (chọn phương án nào, mất bao nhiêu giây) | **Không** có học viên thật nào trong đây |
| `eval/grounding.json` · `eval/multiround.json` | Câu trả lời do **AI sinh**, chạy trên các hồ sơ giả ở trên | Nội dung máy sinh |
| `eval/review/` · `eval/review_rounds/` | Nhận xét của **thành viên trong nhóm** khi chấm tay | Người trong nhóm, không phải học viên ngoài |
| `spec.md` §1 | Số liệu mining chatlog (tỉ lệ %) + **2 trích dẫn ngắn** kèm mã turn `[T#####]` | Số tổng hợp + trích ngắn, đúng mức "vài dòng" quy định cho phép |

## Nguyên tắc nhóm áp dụng

1. **Không commit data pack** — chỉ đưa vào repo con số tổng hợp và mã trích dẫn (`[T01-049]`, `[T10291]`), không dán nguyên văn dài.
2. **Không có PII** — mọi hồ sơ học viên trong bộ đo đều do nhóm bịa ra để thử hệ thống.
3. **Không suy ngược danh tính** — chỉ dùng mã đã ẩn danh sẵn của khoá.
4. **Xoá bản sao data pack** khỏi máy cá nhân sau sự kiện nếu BTC yêu cầu.
