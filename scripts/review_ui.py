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
OUT = os.path.join(ROOT, "eval", "human_review.json")
PORT = 5599

if not os.path.exists(DATA):
    sys.exit("Chưa có eval/grounding.json — chạy trước: python scripts/grounding.py")

rows = json.load(open(DATA, encoding="utf-8"))["rows"]
saved = json.load(open(OUT, encoding="utf-8")) if os.path.exists(OUT) else {}

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
.q{font-size:13px;font-weight:600;margin:10px 0 4px}
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
<p class="sub">Mỗi thẻ: đọc bài làm, xem hệ thống chỉ chỗ hổng nào, rồi trả lời hai câu.
Tự lưu vào <code>eval/human_review.json</code>.</p>
<div id="list"></div></div>
<div class="bar"><span id="tally"></span><span id="status">—</span></div>
<script>
const ROWS = __ROWS__, SAVED = __SAVED__;
const el = document.getElementById('list');
ROWS.forEach(r => {
  const s = SAVED[r.id] || {};
  const d = document.createElement('div');
  d.className = 'card' + (s.nhan_xet && s.nhanh ? ' done' : '');
  d.id = 'c_' + r.id;
  d.innerHTML = `
   <div class="head"><b>${r.id} · ${r.desc}</b>
     <span class="tag">${r.scenario}</span></div>
   <div class="ans">${r.bai_lam.join('\\n')}</div>
   <div class="q">Hệ thống kết luận chỗ hổng: <b>${r.gap || '(một ý trong quiz)'}</b></div>
   <div class="out">${r.out.replace(/</g,'&lt;')}</div>
   <div class="q">① Nhận xét AI viết ra có ổn không?</div>
   <div><button class="yes" data-i="${r.id}" data-k="nhan_xet" data-v="ok">Ổn</button>
        <button class="no" data-i="${r.id}" data-k="nhan_xet" data-v="khong">Chưa ổn</button></div>
   <div class="q">② Chọn nhánh (chỗ hổng) có đúng với bài làm này không?</div>
   <div><button class="yes" data-i="${r.id}" data-k="nhanh" data-v="ok">Đúng</button>
        <button class="no" data-i="${r.id}" data-k="nhanh" data-v="khong">Sai</button></div>
   <div class="q">③ Có mâu thuẫn với vòng trước không? <span style="font-weight:400;color:var(--mocha)">(vd: bảo chưa nắm chương trong khi chương vừa đúng hết)</span></div>
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
  fetch('/save', {method:'POST', body: JSON.stringify(SAVED)})
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
        html = (PAGE.replace("__ROWS__", json.dumps(rows, ensure_ascii=False))
                    .replace("__SAVED__", json.dumps(saved, ensure_ascii=False)))
        body = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        data = json.loads(self.rfile.read(n) or b"{}")
        json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        done = sum(1 for v in data.values() if v.get("nhan_xet") and v.get("nhanh"))
        nx = sum(1 for v in data.values() if v.get("nhan_xet") == "ok")
        nh = sum(1 for v in data.values() if v.get("nhanh") == "ok")
        print(f"  đã chấm {done}/{len(rows)} · nhận xét ổn {nx} · chọn nhánh đúng {nh}")
        self.send_response(204)
        self.end_headers()


print(f"\nChấm tay {len(rows)} lượt tại  http://localhost:{PORT}")
print(f"Kết quả lưu liên tục vào  eval/human_review.json   (Ctrl+C để dừng)\n")
try:
    webbrowser.open(f"http://localhost:{PORT}")
except Exception:
    pass
HTTPServer(("127.0.0.1", PORT), H).serve_forever()
