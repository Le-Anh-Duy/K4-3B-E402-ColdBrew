# Mô hình dữ liệu ColdBrew

Ai cũng phải đọc file này trước khi sửa `mockup/data.js` hoặc `eval/cases.json`.

## 1 · Dữ liệu nằm ở đâu, chảy đi đâu

```
data/vlearn-pack/transcript/transcript-01-clean.md     nguồn gốc (KHÔNG commit vào repo)
        │  đọc tay, dựng cây
        ▼
mockup/data.js            ← NGUỒN SỰ THẬT của cây tri thức, chỉ sửa ở đây
        │  node scripts/export_graph.js
        ▼
eval/graph.json           ← bản sinh tự động, script Python đọc file này
        │
        ├─► scripts/run.py       chạy golden set
        ├─► scripts/parity.py    so hai bản luật
        └─► scripts/calibrate.py ngưỡng thời gian
```

Sửa `data.js` mà quên chạy `export_graph.js` thì `run.py` **báo lỗi và dừng** (nó so thời gian sửa file), không chạy trên dữ liệu cũ.

## 2 · Node — một khái niệm trong bài giảng

```json
{
  "id": "c3s1",
  "label": "3.1 Double Diamond: phân kỳ – hội tụ",
  "parent": "c3",
  "file": "transcript-01-clean.md",
  "span": ["T01-049", "T01-069", "T01-071", "T01-074"],
  "conf": 0.9,
  "page": "transcript-01-clean.md · [T01-049] [T01-069] ...",
  "prereq": ["c1s1"]
}
```

| Trường | Nghĩa |
|---|---|
| `id` | Khoá duy nhất. Quy ước đặt tên ở mục 3 |
| `label` | Tên hiển thị cho học viên |
| `parent` | Node cha trong **mục lục** bài giảng. `null` nếu là gốc |
| `file` | Tài liệu nguồn — phần *source file* của provenance |
| `span` | **Mã đoạn transcript** chứa ý này — phần *span* của provenance. Đây là thứ cho phép truy ngược mọi câu chữ về bài giảng gốc |
| `conf` | Độ tin cậy của việc gán ý này vào node: `0.9` = giảng viên nói thẳng trong đoạn · `0.7` = nhóm gom lại từ nhiều đoạn. Đề bài yêu cầu *provenance và uncertainty rõ ràng* |
| `page` | Chuỗi hiển thị, ghép từ `file` + `span`. Chỉ để in ra UI, **không dùng để tính toán** |
| `prereq` | Danh sách node phải nắm **trước** node này. Xem mục 4 |
| `compact` | Chỉ có ở `root`: 3 ý cốt lõi của cả bài, dùng khi kết luận "học lại từ đầu" |

Node **không** có trường `type`. Loại node suy ra từ độ sâu — xem mục 3.

## 3 · Bốn tầng và quy ước đặt id

| Tầng | Là gì | Quy ước id | Ví dụ |
|---|---|---|---|
| **root** | Cả buổi giảng | `root` | `Day 2 (sáng) · Xác định bài toán kinh doanh cho AI` |
| **chương** | Mảng nội dung lớn | `c<số>` | `c3` = *Chương 3 · Tìm đúng vấn đề* |
| **mục** | Một chủ đề trong chương | `c<số>s<số>` | `c3s1` = *3.1 Double Diamond* |
| **lá** | **Một ý duy nhất** | `l_<từ khoá>` | `l_hoitu` = *Hội tụ: gom nhóm, Five Whys, lọc trùng* |

Vì sao quan trọng: **mức ôn tập suy ra từ tầng của chỗ hổng** (`advice_level`) — lá → ôn một ý ~5 phút, mục → ~15 phút, chương/bài → ~45 phút. Đặt sai tầng là kê sai liều lượng ôn.

Quiz hỏi ở tầng **lá**; câu chẩn đoán hỏi ở tầng **mục** và **chương**.

## 4 · Hai loại cạnh — đừng lẫn

| Cạnh | Trường | Nghĩa | Đọc là |
|---|---|---|---|
| **broader/narrower** | `parent` | Quan hệ **mục lục**: ý này nằm trong mục nào | *"nằm trong"* |
| **prerequisite** | `prereq` | Quan hệ **phụ thuộc kiến thức**: không nắm A thì không hiểu nổi B | *"phải học trước"* |

Ví dụ khác nhau chỗ nào:

```
c3s1 (Double Diamond)
  parent = c3      -> nằm trong Chương 3          (mục lục)
  prereq = [c1s1]  -> phải hiểu "phân biệt vấn đề với giải pháp" trước
                      dù c1s1 nằm ở CHƯƠNG KHÁC   (phụ thuộc)
```

Cạnh `prereq` **băng ngang cây**, cạnh `parent` thì không. Đây là lý do luật có bước *"ưu tiên tiền đề"*: hổng ở tiền đề thì ôn phần phụ thuộc là vô ích.

Các cạnh khác đề bài nêu (`related`, `example-of`, `contradicts`) — **nhóm không làm**, đã khai trong `spec.md` §4 Non-goals.

## 5 · Ngân hàng câu hỏi

| Biến | Hỏi ở tầng | Dùng khi nào | Cấu trúc |
|---|---|---|---|
| `QUIZ` | lá | Bài ôn 5 câu ban đầu | `{node, q, options[4], answer}` — `answer` là **chỉ số** phương án đúng |
| `PROBES` | mục, chương | Vòng chẩn đoán, 3 câu mỗi node | `{[nodeId]: [{q, options, answer} × 3]}` |

`PROBES` hiện là bộ **tĩnh, chung cho cả node** — hạn chế đã ghi trong `spec.md` (cần skill AI sinh câu nền có điều kiện theo lá bị sai).

## 6 · Nội dung giảng giải

| Biến | Khoá | Nội dung |
|---|---|---|
| `EXPLAIN` | node lá | `why` = vì sao đáp án đúng · `traps` = bẫy của **từng phương án sai**, khoá là chỉ số phương án |
| `PROBE_WHY` | node có probe | Mảng 3 câu giải thích, **cùng thứ tự** với `PROBES` |
| `REVIEW` | node bất kỳ | Gợi ý ôn, luôn trỏ về mã đoạn `[T01-NNN]` |

Mọi chuỗi ở đây đều phải nhắc mã đoạn. Khi nối Gemini, phần chữ này do model viết nhưng **ràng buộc trích dẫn giữ nguyên**.

## 7 · Trạng thái học viên (chỉ tồn tại lúc chạy, không nằm trong graph)

| Thứ | Ở đâu | Nghĩa |
|---|---|---|
| `records` | phiên | Mỗi câu: `{node, sel, correct, sec, flag}` |
| `flag` | mỗi câu | `ok` · `slow` (đúng >25s) · `wrong` · `rush` (sai <3s) · `skip` (bỏ trống) |
| `status` | mỗi node | `ok` · `shaky` (chưa chắc) · `weak` (hổng) · `probing` (đang hỏi) — màu trên cây |
| `trace` | phiên | Dấu vết từng quyết định, gồm cả lựa chọn của học viên |
| `feedback` | phiên | Sao + chip lý do — đo **lời tư vấn**, không đụng mastery |

## 8 · Case trong golden set

```json
{
  "id": "C14",
  "desc": "Mục 3.1: sai 2 câu nền, lên chương 3 thì trả lời đúng",
  "quiz": [[1, 9], [0, 8], [1, 10], [2, 13], [3, 11]],
  "probes": { "c3s1": [[1, 9], [2, 8], [0, 10]], "c3": [[0, 9], [0, 8], [0, 11]] },
  "expect": {
    "target": "c3s1",
    "final": { "scenario": "muc_duoi_tran", "gap": "c3s1", "ceiling": "c3", "prompt": "on_muc_co_tran" }
  },
  "why": "Mục trượt, lên chương thì đúng hết -> chương là TRẦN đã xác nhận ổn; chỗ hổng là mục"
}
```

| Trường | Nghĩa |
|---|---|
| `quiz` | 5 cặp `[phương án đã chọn, số giây]`. `null` = bỏ trống. **Theo đúng thứ tự `QUIZ`** |
| `probes` | Đáp án cho từng vòng chẩn đoán, khoá là node |
| `expect.target` | Node hệ thống phải chọn để chẩn đoán. `null` = **phải từ chối chẩn đoán** |
| `expect.final.scenario` | `y_le` · `muc_nong` · `muc_duoi_tran` · `nen_bai` — xem mục 9 |
| `expect.final.gap` | **Chỗ hổng** = node sâu nhất bị trượt. `null` = hổng ở chính ý trong quiz |
| `expect.final.ceiling` | **Trần** = node đã trả lời đạt, tức nền từ đó trở lên ổn |
| `expect.final.prompt` | Khoá system prompt mà luật phải giao cho AI |
| `why` | Lý do gán nhãn — bắt buộc, để người sau tranh luận được |

## 9 · Bốn kịch bản kết luận

| Kịch bản | Xảy ra khi | Chỗ hổng | AI được giao |
|---|---|---|---|
| `y_le` | Probe tầng trên **đúng hết** | chính ý trong quiz | `giai_thich_y` — giải thích đúng một ý, cấm mở rộng |
| `muc_nong` | Probe sai **1/3** | ngay mục đó, hổng nông | `on_muc_nong` — nhắc lại mảnh thiếu |
| `muc_duoi_tran` | Mục **trượt** (≥2/3), tầng trên **đạt** | mục, tầng trên là trần | `on_muc_co_tran` — ôn mục, dựa vào nền đã xác nhận |
| `nen_bai` | Trượt tới nền, hết đường leo | chương/cả bài | `hoc_lai_bai` — tóm tắt cả bài, làm lại quiz |

Nguyên tắc xuyên suốt: **chỗ hổng là node sâu nhất bị trượt; node trả lời đạt là trần, không phải chỗ hổng.**

## 10 · Đối chiếu với schema đề bài

| Đề yêu cầu | Nhóm làm | Ghi chú |
|---|---|---|
| Node: concept | ✅ | 30 node |
| Node: definition, example | ⚠️ | nằm trong `EXPLAIN.why`, chưa tách thành node riêng |
| Node: misconception | ⚠️ | nằm trong `EXPLAIN.traps` (bẫy từng phương án), chưa tách node |
| Node: assessment item | ✅ | `QUIZ` + `PROBES` |
| Edge: prerequisite | ✅ | `prereq` |
| Edge: broader/narrower | ✅ | `parent` |
| Edge: related, example-of, contradicts | ❌ | cắt scope |
| Provenance: source file, page/slide, span, confidence | ⚠️ | có `file` + `span` + `conf`; **chưa có số trang slide** vì chưa đối chiếu PDF |
| Learner state: mastery/confidence, event, branch decision | ⚠️ | có `status` + `trace` đầy đủ; mastery là cờ, chưa phải con số |

## 11 · Quy trình sửa dữ liệu an toàn

```
1. sửa mockup/data.js
2. node scripts/export_graph.js      # sinh lại eval/graph.json
3. python scripts/run.py             # nếu đổi QUIZ -> vân tay báo đỏ, phải gán nhãn lại
4. python scripts/parity.py          # hai bản luật còn khớp không
5. node scripts/smoke.js             # trang còn dựng được không
```
