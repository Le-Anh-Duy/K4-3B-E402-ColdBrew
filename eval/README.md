# eval/ — golden set & kết quả đo

| File | Nội dung |
|---|---|
| `cases.json` | 20 case gán nhãn tay. Hồ sơ trả lời **giả**, không dùng dữ liệu học viên thật |
| `run.js` | Chạy cả bộ qua đúng bộ luật của trang mock (`mockup/engine.js`) |
| `results.md` | Bảng kết quả lượt chạy gần nhất (sinh tự động) |
| `smoke.js` | Dựng trang y như browser rồi render một lần — bắt lỗi trắng trang. **Chạy trước khi quay demo** |
| `calibrate.js` | Hiệu chỉnh ngưỡng thời gian từ các phiên thật trong `human/` |
| `human/` | Case do thành viên tự chạy, tự gán nhãn |

```
node eval/smoke.js          # trang có dựng được không (chạy trước khi demo)
node eval/run.js            # in bảng
node eval/run.js --write    # ghi thêm results.md
node eval/calibrate.js      # đề xuất SLOW_SEC/RUSH_SEC từ phiên thật
```

**Đo cái gì:** với mỗi hồ sơ trả lời, hệ thống có chọn đúng node cần chẩn đoán không, và sau khi leo cây có ra đúng kết luận cuối không. Nhãn kỳ vọng do nhóm gán theo cây tri thức **trước khi chạy code**, không lấy từ output của code.

**Vì sao chạy bằng `node` chứ không chép luật sang Python:** trang mock và bộ eval dùng **chung một file luật** `mockup/engine.js`, nên số đo luôn là số của đúng cái đang chạy trong demo.
