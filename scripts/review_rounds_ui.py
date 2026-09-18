"""Trang chấm tay CHUỖI NHIỀU VÒNG (khác trang chấm câu lẻ ở cổng 5599).

    python scripts/review_rounds_ui.py     -> http://localhost:5600

Mỗi thẻ là MỘT PHIÊN: bài quiz → nhận xét AI vòng 1 → vòng 2 → kết luận cuối.
Người chấm trả lời ba câu mà máy không kiểm được:
  ① từng vòng có bám đúng trọng tâm vòng đó không
  ② vòng sau có NỐI TIẾP vòng trước không (không lặp, không mâu thuẫn, có tiến triển)
  ③ kết luận cuối có khớp với cả chuỗi không

Bản chấm gắn theo `hash` của chuỗi — chạy lại AI ra chữ khác thì nhận xét cũ hết hiệu lực.
Lưu vào eval/review_rounds/<id>.json
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
DATA = os.path.join(ROOT, "eval", "multiround.json")
OUTDIR = os.path.join(ROOT, "eval", "review_rounds")
os.makedirs(OUTDIR, exist_ok=True)
PORT = 5600

if not os.path.exists(DATA):
    sys.exit("Chưa có eval/multiround.json — chạy trước: python scripts/multiround.py")

_d = json.load(open(DATA, encoding="utf-8"))
rows, RUN_ID = _d["rows"], _d.get("run_id", "?")


def path_for(name):
    safe = "".join(c for c in name.lower().replace(" ", "-") if c.isalnum() or c in "-_")[:30]
    return os.path.join(OUTDIR, f"{safe or 'khuyet-danh'}.json")


PAGE = """<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>ColdBrew · Chấm chuỗi nhiều vòng</title>
<style>
:root{--cream:#fbf6ef;--milk:#fffdfa;--latte:#ead9c4;--caramel:#c08457;--espresso:#3b2a20;
--mocha:#7a5c48;--good:#5b8c5a;--bad:#c25b45;--amber:#d8a13a}
*{box-sizing:border-box}body{margin:0;background:var(--cream);color:var(--espresso);
font:15px/1.6 system-ui,"Segoe UI",sans-serif}
.wrap{max-width:940px;margin:0 auto;padding:20px 16px 90px}
h1{font-size:20px;margin:0 0 4px}.sub{color:var(--mocha);font-size:14px;margin:0 0 6px}
.card{background:var(--milk);border:1px solid var(--latte);border-radius:14px;padding:16px;margin-bottom:16px}
.head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap}
.tag{font-size:12px;background:var(--latte);padding:2px 8px;border-radius:999px}
.exp{font-size:13px;color:var(--mocha);font-style:italic;margin:6px 0 0}
.timeline{border-left:3px solid var(--latte);margin:14px 0 6px 6px;padding-left:14px}
.step{margin-bottom:14px;position:relative}
.step::before{content:"";position:absolute;left:-21px;top:6px;width:11px;height:11px;
border-radius:50%;background:var(--caramel)}
.step.pass::before{background:var(--good)}.step.fail::before{background:var(--bad)}
.step.last::before{background:var(--espresso)}
.lab{font-size:11px;font-weight:700;letter-spacing:.7px;color:var(--caramel);text-transform:uppercase}
.txt{background:var(--cream);border:1px solid var(--latte);border-radius:10px;padding:10px 12px;
white-space:pre-wrap;font-size:14px;margin-top:5px}
.q{font-size:13px;font-weight:600;margin:14px 0 4px}
.pin{display:inline-block;background:var(--espresso);color:var(--cream);font-size:10px;
font-weight:700;letter-spacing:.6px;padding:2px 7px;border-radius:999px;margin-right:6px;vertical-align:1px}
button{font:inherit;border:1px solid var(--latte);background:var(--milk);color:var(--mocha);
border-radius:9px;padding:6px 14px;cursor:pointer;margin-right:6px}
button.yes.on{background:var(--good);color:#fff;border-color:var(--good)}
button.no.on{background:var(--bad);color:#fff;border-color:var(--bad)}
input[type=text]{width:100%;font:inherit;padding:8px 10px;border:1px solid var(--latte);
border-radius:9px;background:var(--milk);margin-top:8px}
.may{font-size:12px;color:var(--mocha);margin-top:10px;border-top:1px dashed var(--latte);padding-top:8px}
.bar{position:fixed;left:0;right:0;bottom:0;background:var(--espresso);color:var(--cream);
padding:10px 16px;font-size:14px;display:flex;justify-content:space-between}
.stale{background:#fdf4f2;border:1px solid #e6bfb6;color:var(--bad);font-size:13px;
padding:8px 10px;border-radius:9px;margin-top:8px}
.done{opacity:.55}
</style></head><body><div class="wrap">
<h1>Chấm chuỗi nhiều vòng</h1>
<p class="sub" id="who"></p>
<p class="sub">Mỗi thẻ là <b>một phiên trọn vẹn</b>. Đọc dọc dòng thời gian: vòng 1 → vòng 2 → kết luận.
Ba câu hỏi bên dưới chấm <b>sự nối kết giữa các vòng</b> — thứ máy không kiểm nổi.</p>
<div id="list"></div></div>
<div class="bar"><span id="tally"></span><span id="status">—</span></div>
<script>
const ROWS = __ROWS__;
let RID = localStorage.getItem('coldbrew-rid');
if (!RID) { RID = 'r' + Date.now().toString(36).slice(-5); localStorage.setItem('coldbrew-rid', RID); }
let TEN = localStorage.getItem('coldbrew-ten') || '';
const NAME = () => (TEN ? TEN + '-' + RID : RID);
document.getElementById('who').innerHTML =
  `Lượt chạy <b>${ROWS[0] ? ROWS[0].run_id : '?'}</b> · bản chấm lưu ở ` +
  `<code>eval/review_rounds/<span id="fn">${NAME()}</span>.json</code>. Tên (tuỳ chọn): ` +
  `<input id="ten" type="text" style="width:150px;display:inline-block;margin:0" value="${TEN}" placeholder="vd: duy">`;
let SAVED = {};
try { SAVED = JSON.parse(localStorage.getItem('coldbrew-rounds-' + RID) || '{}'); } catch (e) {}
const el = document.getElementById('list');
const esc = t => (t || '').replace(/</g, '&lt;');

try {
ROWS.forEach(r => {
  let s = SAVED[r.id] || {};
  const cu = s.hash && s.hash !== r.hash;
  if (cu) s = { _cu: s };
  const d = document.createElement('div');
  d.className = 'card' + (s.tung_vong && s.noi_tiep && s.ket_luan ? ' done' : '');
  d.id = 'c_' + r.id;

  const steps = r.vong.map(v => `
    <div class="step ${v.decision === 'escalate' ? 'fail' : 'pass'}">
      <div class="lab">Vòng ${v.vong} · ${esc(v.node_label)} · sai ${v.bad}/3 → luật quyết: ${v.decision}</div>
      <div class="txt">${esc(v.ai_summary)}${v.ai_advice ? '\\n\\n' + esc(v.ai_advice) : ''}</div>
    </div>`).join('');

  const may = r.kiem;
  d.innerHTML = `
   <div class="head"><b>${r.id} · ${esc(r.desc)}</b><span class="tag">${r.scenario}</span></div>
   <div class="exp">Kỳ vọng của nhóm: ${esc(r.ky_vong)}</div>
   ${cu ? '<div class="stale">⚠ Bạn đã chấm phiên này ở BẢN CHẠY TRƯỚC. Chuỗi đã đổi — chấm lại.</div>' : ''}
   <div class="timeline">
     ${steps}
     <div class="step last">
       <div class="lab">Kết luận · hổng: ${esc(r.gap_label)}${r.ceiling_label && r.ceiling !== r.gap ? ' · nền đã đạt tới: ' + esc(r.ceiling_label) : ''}</div>
       <div class="txt">${esc(r.ket_luan)}</div>
     </div>
   </div>
   <div class="may">Máy đã kiểm: bám đúng node ${may.moi_vong_bam_dung_node ? '✅' : '❌'} ·
     không lặp vòng trước ${may.khong_lap_lai_vong_truoc ? '✅' : '❌'} (trùng ${may.do_trung_lap}) ·
     không mâu thuẫn trần ${may.khong_mau_thuan_tran ? '✅' : '❌'} ·
     nhắc đúng chỗ hổng ${may.ket_luan_nhac_dung_cho_hong ? '✅' : '❌'}</div>

   <div class="q">① <span class="pin">TỪNG VÒNG</span> Nhận xét mỗi vòng có bám đúng trọng tâm vòng đó không?</div>
   <div><button class="yes" data-i="${r.id}" data-k="tung_vong" data-v="ok">Có</button>
        <button class="no" data-i="${r.id}" data-k="tung_vong" data-v="khong">Không</button></div>
   <div class="q">② <span class="pin">NỐI VÒNG</span> Vòng sau có nối tiếp vòng trước không — không lặp lại, không mâu thuẫn, có tiến triển?</div>
   <div><button class="yes" data-i="${r.id}" data-k="noi_tiep" data-v="ok">Có nối tiếp</button>
        <button class="no" data-i="${r.id}" data-k="noi_tiep" data-v="khong">Rời rạc / lặp / mâu thuẫn</button></div>
   <div class="q">③ <span class="pin">KẾT LUẬN</span> Kết luận cuối có khớp với cả chuỗi vừa đọc không?</div>
   <div><button class="yes" data-i="${r.id}" data-k="ket_luan" data-v="ok">Khớp</button>
        <button class="no" data-i="${r.id}" data-k="ket_luan" data-v="khong">Không khớp</button></div>
   <input type="text" placeholder="Ghi chú (vòng nào hỏng, hỏng thế nào)"
          data-i="${r.id}" data-k="ghi_chu" value="${((s.ghi_chu || '')).replace(/"/g, '&quot;')}">`;
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
} catch (err) {
  el.innerHTML = '<div class="card"><b>Lỗi dựng trang:</b><pre>' + err.message + '</pre></div>';
}

function save(id, k, v) {
  const row = ROWS.find(x => x.id === id);
  if (!SAVED[id] || SAVED[id].hash !== row.hash) SAVED[id] = { hash: row.hash, run_id: row.run_id };
  SAVED[id][k] = v;
  localStorage.setItem('coldbrew-rounds-' + RID, JSON.stringify(SAVED));
  fetch('/save', { method: 'POST', body: JSON.stringify({ rater: NAME(), data: SAVED }) })
    .then(() => { document.getElementById('status').textContent = 'đã lưu'; tally(); })
    .catch(() => document.getElementById('status').textContent = 'lỗi lưu');
  const c = document.getElementById('c_' + id);
  c.classList.toggle('done', !!(SAVED[id].tung_vong && SAVED[id].noi_tiep && SAVED[id].ket_luan));
}
function tally() {
  const hs = new Set(ROWS.map(r => r.hash));
  const v = Object.values(SAVED).filter(x => hs.has(x.hash));
  const c = k => v.filter(x => x[k] === 'ok').length;
  document.getElementById('tally').textContent =
    `Đã chấm ${v.filter(x => x.tung_vong && x.noi_tiep && x.ket_luan).length}/${ROWS.length} · ` +
    `từng vòng ổn: ${c('tung_vong')} · nối tiếp được: ${c('noi_tiep')} · kết luận khớp: ${c('ket_luan')}`;
}
const ti = document.getElementById('ten');
if (ti) ti.oninput = e => {
  TEN = e.target.value.trim();
  localStorage.setItem('coldbrew-ten', TEN);
  document.getElementById('fn').textContent = NAME();
};
tally();
</script></body></html>"""


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_GET(self):
        body = PAGE.replace("__ROWS__", json.dumps(rows, ensure_ascii=False)).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        b = json.loads(self.rfile.read(n) or b"{}")
        rater, data = b.get("rater", "khuyet-danh"), b.get("data", {})
        json.dump({"rater": rater, "run_id": RUN_ID, "cham": data},
                  open(path_for(rater), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        xong = sum(1 for v in data.values() if v.get("tung_vong") and v.get("noi_tiep") and v.get("ket_luan"))
        print(f"  [{rater}] đã chấm {xong}/{len(rows)} phiên")
        self.send_response(204)
        self.end_headers()


print(f"\nChấm chuỗi {len(rows)} phiên tại  http://localhost:{PORT}   (lượt {RUN_ID})")
print("Trang này KHÁC trang chấm câu lẻ ở cổng 5599 — ở đây chấm sự nối kết giữa các vòng.\n")
try:
    srv = HTTPServer(("127.0.0.1", PORT), H)
except OSError as e:
    print(f"KHONG MO DUOC CONG {PORT}: {e}")
    print("Con tien trinh cu dang giu cong — tat no truoc roi chay lai.")
    sys.exit(1)
try:
    webbrowser.open(f"http://localhost:{PORT}")
except Exception:
    pass
srv.serve_forever()
