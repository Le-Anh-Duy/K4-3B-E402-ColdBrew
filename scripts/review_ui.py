"""UI chấm tay tại local — hai câu hỏi máy không trả lời được:
   ① Nhận xét AI viết ra có ổn không?
   ② Hệ thống chọn nhánh (chỗ hổng) có đúng với bài làm đó không?

    python scripts/review_ui.py        -> mở http://localhost:5599
Kết quả lưu vào eval/human_review.json, tự lưu mỗi lần bấm.
"""
import json
import os
import sys
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "eval", "grounding.json")
REVIEW_DIR = os.path.join(ROOT, "eval", "review")
os.makedirs(REVIEW_DIR, exist_ok=True)
PORT = 5599

if not os.path.exists(DATA):
    sys.exit("Chưa có eval/grounding.json — chạy trước: python scripts/grounding.py")

rows = json.load(open(DATA, encoding="utf-8"))["rows"]


def path_for(name):
    safe = "".join(c for c in name.lower().replace(" ", "-") if c.isalnum() or c in "-_")[:30]
    return os.path.join(REVIEW_DIR, f"{safe or 'khuyet-danh'}.json")

PAGE = """<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>ColdBrew · Chấm tay</title>
<style>
:root{--cream:#fbf6ef;--milk:#fffdfa;--latte:#ead9c4;--caramel:#c08457;--espresso:#3b2a20;
--mocha:#7a5c48;--good:#5b8c5a;--bad:#c25b45}
*{box-sizing:border-box}body{margin:0;background:var(--cream);color:var(--espresso);
font:15px/1.6 system-ui,"Segoe UI",sans-serif}
.wrap{max-width:900px;margin:0 auto;padding:20px 16px 80px}
h1{font-size:20px;margin:0 0 4px}.sub{color:var(--mocha);font-size:14px;margin:0 0 18px}
.card{background:var(--milk);border:1px solid var(--latte);border-radius:14px;padding:16px;margin-bottom:14px}
.head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap}
.tag{font-size:12px;background:var(--latte);padding:2px 8px;border-radius:999px}
.ans{font-size:13px;color:var(--mocha);margin:8px 0;white-space:pre-wrap}
.out{background:var(--cream);border:1px solid var(--latte);border-radius:10px;padding:12px;
white-space:pre-wrap;font-size:14px;margin:10px 0}
.q{font-size:13px;font-weight:600;margin:14px 0 4px}
.blk{font-size:11px;font-weight:700;letter-spacing:.8px;color:var(--caramel);
margin:16px 0 4px;border-top:1px solid var(--latte);padding-top:8px}
.pin{display:inline-block;background:var(--espresso);color:var(--cream);font-size:10px;
font-weight:700;letter-spacing:.6px;padding:2px 7px;border-radius:999px;margin-right:6px;
vertical-align:1px}
.blk{font-size:11px;font-weight:700;letter-spacing:.8px;color:var(--caramel);
margin:14px 0 4px;border-top:1px solid var(--latte);padding-top:8px}
button{font:inherit;border:1px solid var(--latte);background:var(--milk);color:var(--mocha);
border-radius:9px;padding:6px 14px;cursor:pointer;margin-right:6px}
button.yes.on{background:var(--good);color:#fff;border-color:var(--good)}
button.no.on{background:var(--bad);color:#fff;border-color:var(--bad)}
input[type=text]{width:100%;font:inherit;padding:8px 10px;border:1px solid var(--latte);
border-radius:9px;background:var(--milk);margin-top:8px}
.bar{position:fixed;left:0;right:0;bottom:0;background:var(--espresso);color:var(--cream);
padding:10px 16px;font-size:14px;display:flex;justify-content:space-between}
.done{opacity:.55}
</style></head><body><div class="wrap">
<h1>Chấm tay — nhận xét AI</h1>
<p class="sub" id="who"></p>
<p class="sub">Mỗi thẻ có ba khối: <b>A</b> bài làm của học viên · <b>B</b> kết luận của LUẬT (code, không phải AI)
· <b>C</b> nhận xét do AI viết. Ba câu hỏi bên dưới chấm ba thứ khác nhau — mỗi câu ghi rõ nhìn vào khối nào.
Tự lưu vào <code>eval/human_review.json</code>.</p>
<div id="list"></div></div>
<div class="bar"><span id="tally"></span><span id="status">—</span></div>
<script>
const ROWS = __ROWS__;
let NAME = localStorage.getItem('coldbrew-rater') || '';
while (!NAME) { NAME = (prompt('Tên bạn (để lưu bản chấm riêng):') || '').trim(); }
localStorage.setItem('coldbrew-rater', NAME);
document.getElementById('who').innerHTML =
  `Người chấm: <b>${NAME}</b> — bản chấm lưu riêng ở <code>eval/review/</code>, ` +
  `không đè lên bản của người khác. <a href="#" onclick="localStorage.removeItem('coldbrew-rater');location.reload()">đổi người</a>`;
let SAVED = {};
try { SAVED = JSON.parse(localStorage.getItem('coldbrew-review-' + NAME) || '{}'); } catch (e) {}
const el = document.getElementById('list');
ROWS.forEach(r => {
  const s = SAVED[r.id] || {};
  const d = document.createElement('div');
  d.className = 'card' + (s.nhan_xet && s.nhanh ? ' done' : '');
  d.id = 'c_' + r.id;
  d.innerHTML = `
   <div class="head"><b>${r.id} · ${r.desc}</b>
     <span class="tag">${r.scenario}</span></div>
   <div class="blk">KHỐI A · BÀI LÀM CỦA HỌC VIÊN</div>
   <div class="ans">${r.bai_lam.join('\n')}</div>
   <div class="blk">KHỐI B · LUẬT CHẨN ĐOÁN KẾT LUẬN <span class="tag">${r.scenario}</span>
     <span style="font-weight:400;text-transform:none;letter-spacing:0">— do code sinh, không phải AI</span></div>
   <div class="ans">Chỗ hổng: <b>${r.gap_label || '(một ý trong quiz)'}</b>${
     r.ceiling_label ? '<br>Nền đã xác nhận ổn tới: <b>' + r.ceiling_label + '</b>' : ''}</div>
   <div class="blk">KHỐI C · NHẬN XÉT DO AI VIẾT</div>
   <div class="out">${r.out.replace(/</g,'&lt;')}</div>
   <div class="q">① <span class="pin">KHỐI C</span> Nhận xét AI viết ra có ổn không?</div>
   <div><button class="yes" data-i="${r.id}" data-k="nhan_xet" data-v="ok">Ổn</button>
        <button class="no" data-i="${r.id}" data-k="nhan_xet" data-v="khong">Chưa ổn</button></div>
   <div class="q">② <span class="pin">KHỐI A + B</span> Chỗ hổng luật chỉ ra có đúng với bài làm không?</div>
   <div><button class="yes" data-i="${r.id}" data-k="nhanh" data-v="ok">Đúng</button>
        <button class="no" data-i="${r.id}" data-k="nhanh" data-v="khong">Sai</button></div>
   <div class="q">③ <span class="pin">KHỐI B + C</span> Nhận xét có mâu thuẫn với kết luận của luật không? <span style="font-weight:400;color:var(--mocha)">(vd: bảo chưa nắm chương trong khi chương vừa đúng hết)</span></div>
   <div><button class="yes" data-i="${r.id}" data-k="noi_vong" data-v="ok">Không mâu thuẫn</button>
        <button class="no" data-i="${r.id}" data-k="noi_vong" data-v="khong">Có mâu thuẫn</button></div>
   <input type="text" placeholder="Ghi chú (vì sao chưa ổn / sai chỗ nào)"
          data-i="${r.id}" data-k="ghi_chu" value="${(s.ghi_chu||'').replace(/"/g,'&quot;')}">`;
  el.appendChild(d);
  d.querySelectorAll('button').forEach(b => {
    if (s[b.dataset.k] === b.dataset.v) b.classList.add('on');
    b.onclick = () => {
      d.querySelectorAll(`button[data-k="${b.dataset.k}"]`).forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      save(b.dataset.i, b.dataset.k, b.dataset.v);
    };
  });
  d.querySelector('input').onchange = e => save(e.target.dataset.i, 'ghi_chu', e.target.value);
});
function save(id, k, v) {
  SAVED[id] = SAVED[id] || {}; SAVED[id][k] = v;
  localStorage.setItem('coldbrew-review-' + NAME, JSON.stringify(SAVED));
  fetch('/save', {method:'POST', body: JSON.stringify({rater: NAME, data: SAVED})})
    .then(() => { document.getElementById('status').textContent = 'đã lưu'; tally(); })
    .catch(() => document.getElementById('status').textContent = 'lỗi lưu');
  const c = document.getElementById('c_' + id);
  c.classList.toggle('done', !!(SAVED[id].nhan_xet && SAVED[id].nhanh));
}
function tally() {
  const v = Object.values(SAVED);
  const nx = v.filter(x => x.nhan_xet === 'ok').length, nh = v.filter(x => x.nhanh === 'ok').length;
  const nv = v.filter(x => x.noi_vong === 'ok').length;
  const done = v.filter(x => x.nhan_xet && x.nhanh).length;
  document.getElementById('tally').textContent =
    `Đã chấm ${done}/${ROWS.length} · nhận xét ổn: ${nx} · chọn nhánh đúng: ${nh} · không mâu thuẫn: ${nv}`;
}
tally();
</script></body></html>"""


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_GET(self):
        html = PAGE.replace("__ROWS__", json.dumps(rows, ensure_ascii=False))
        body = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(n) or b"{}")
        rater, data = body.get("rater", "khuyet-danh"), body.get("data", {})
        json.dump({"rater": rater, "cham": data}, open(path_for(rater), "w", encoding="utf-8"),
                  ensure_ascii=False, indent=2)
        done = sum(1 for v in data.values() if v.get("nhan_xet") and v.get("nhanh"))
        nx = sum(1 for v in data.values() if v.get("nhan_xet") == "ok")
        nh = sum(1 for v in data.values() if v.get("nhanh") == "ok")
        print(f"  [{rater}] đã chấm {done}/{len(rows)} · nhận xét ổn {nx} · chọn nhánh đúng {nh}")
        self.send_response(204)
        self.end_headers()


print(f"\nChấm tay {len(rows)} lượt tại  http://localhost:{PORT}")
print(f"Kết quả lưu liên tục vào  eval/human_review.json   (Ctrl+C để dừng)\n")
try:
    webbrowser.open(f"http://localhost:{PORT}")
except Exception:
    pass
HTTPServer(("127.0.0.1", PORT), H).serve_forever()
