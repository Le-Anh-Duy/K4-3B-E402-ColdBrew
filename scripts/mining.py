# -*- coding: utf-8 -*-
"""S0 · Mining bằng chứng từ chatlog VLearn (spec §1).

Chạy:  python scripts/mining.py            -> in báo cáo + ghi eval/evidence/mining.md
       python scripts/mining.py --selftest -> kiểm luật gom dịp hỏi

Data pack KHÔNG nằm trong repo. Tải về trước khi chạy:
  data/vlearn-pack/chatlog/tutor_turns.csv
  (nguồn: repo đề bài K4-3B-Day05-06-AI-Product-Hackathon, thư mục data/vlearn-pack)

Script này chỉ ghi ra SỐ ĐẾM và QUOTE NGẮN kèm turn_id — không sao chép data pack.
"""
import csv, re, sys, collections, datetime as dt, statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV = ROOT / "data/vlearn-pack/chatlog/tutor_turns.csv"
OUT = ROOT / "eval/evidence/mining.md"

# --- luật đếm, khai báo ở một chỗ để người khác kiểm lại được ---
COHORT = "K4"          # khoá hiện tại; K3 là khoá trước, không tính
GAP_MIN = 30           # hai câu cách nhau quá 30 phút = hai DỊP HỎI khác nhau
SEC = re.compile(r'\(Đang học phần\s*[“"](.+?)[”"]\s*của buổi này\)')
KW = ['ôn lại', 'học lại', 'xem lại', 'ôn tập', 'nhắc lại', 'giải thích lại', 'chưa hiểu',
      'không hiểu', 'khó hiểu', 'vẫn chưa', 'quên mất', 'nên ôn', 'ôn phần', 'ôn thế nào',
      'lú', 'rối quá']
KWRE = re.compile('|'.join(map(re.escape, KW)), re.I)


def bursts(times, gap_min=GAP_MIN):
    """Gom các mốc thời gian thành từng dịp hỏi; cách nhau > gap_min phút là dịp mới."""
    times = sorted(times)
    out = [[times[0]]]
    for a, b in zip(times, times[1:]):
        (out.append([b]) if (b - a).total_seconds() > gap_min * 60 else out[-1].append(b))
    return out


def load():
    if not CSV.exists():
        sys.exit(f"Chưa có data pack: {CSV}\nTải tutor_turns.csv về đúng đường dẫn đó rồi chạy lại.")
    csv.field_size_limit(10 ** 9)
    rows = list(csv.DictReader(CSV.open(encoding="utf-8")))
    for r in rows:
        r["t"] = dt.datetime.strptime(r["asked_at_vn"], "%Y-%m-%d %H:%M")
        m = SEC.search(r["student_question"])
        r["sec"] = m.group(1) if m else None
    return rows


def clean_q(r, n=110):
    """Bỏ tiền tố ngữ cảnh trong ngoặc, gộp một dòng."""
    return re.sub(r"^\(.*?\)\s*", "", r["student_question"]).replace("\n", " ").strip()[:n]


def report():
    rows = load()
    k4 = [r for r in rows if r["cohort_hint"] == COHORT]
    live = [r for r in k4 if r["is_preset"] != "True"]          # bỏ câu mẫu bấm sẵn (22,7% toàn pack)
    tagged = [r for r in live if r["sec"]]

    byss = collections.defaultdict(list)
    for r in tagged:
        byss[(r["student"], r["sec"])].append(r["t"])
    studs = {s for s, _ in byss}
    nb = {k: len(bursts(v)) for k, v in byss.items()}
    ge2 = {s for (s, _), n in nb.items() if n >= 2}
    ge3 = {s for (s, _), n in nb.items() if n >= 3}

    byday = collections.defaultdict(set)
    for r in tagged:
        byday[(r["student"], r["sec"])].add(r["t"].date())
    otherday = {s for (s, _), d in byday.items() if len(d) >= 2}

    gaps = []
    for ts in byss.values():
        bs = bursts(ts)
        gaps += [(b[0] - a[-1]).total_seconds() / 3600 for a, b in zip(bs, bs[1:])]

    secsize = collections.Counter(r["sec"] for r in tagged)
    kw = [r for r in live if KWRE.search(r["student_question"])]
    moves = collections.Counter(r["move_used"] for r in live)
    nocite = sum(1 for r in live if r["has_citation"] == "False")
    rated = sum(1 for r in live if r["rating"])
    graded = sum(1 for r in live if r["understanding_level"])

    def pct(a, b):
        r = a / b * 100
        return f"{a}/{b} = {r:.1f}%" if r < 10 else f"{a}/{b} = {r:.0f}%"
    L = [
        "# Mining bằng chứng — chatlog VLearn",
        "",
        f"Sinh bởi `scripts/mining.py` · {dt.date.today().isoformat()}. "
        "Data pack không nằm trong repo; chạy lại script để tái lập.",
        "",
        "## Luật đếm",
        "",
        f"- Quần thể: `cohort_hint == {COHORT}` (khoá hiện tại). Bỏ K3.",
        "- **Bỏ câu mẫu bấm sẵn** (`is_preset`) — đó là nút của giao diện, không phải câu học viên nghĩ ra.",
        f"- Đơn vị **không phải turn**: hai câu của cùng một học viên cách nhau > {GAP_MIN} phút "
        "được tính là **hai dịp hỏi** khác nhau. Đếm theo turn thì mọi hội thoại dài hơn một tin "
        "đều bị tính là 'hỏi lại', con số sẽ phồng lên vô nghĩa.",
        "- **Mục bài học** = nhãn trong tiền tố `(Đang học phần \"…\" của buổi này)` do giao diện VLearn "
        "tự gắn vào câu hỏi — không phải nhóm tự chia. K4 có 118 mục; độ mịn không đều.",
        f"- **Dịp hỏi** = một cụm câu hỏi liền mạch; cách nhau > {GAP_MIN} phút là hai dịp khác nhau.",
        "- Chỉ số 3–5 là **hành vi**, không phải nguyên nhân: 'quay lại mục đó' không đồng nghĩa "
        "'hỏi lại vì chưa hiểu'. Hai dịp hỏi về cùng một mục thường là hai câu hỏi khác nhau.",
        f"- Từ khoá cho chỉ số ôn/chưa hiểu: `{', '.join(KW)}`.",
        "",
        "## Quy mô",
        "",
        f"| Lớp lọc | Lượt | Học viên |",
        f"|---|---|---|",
        f"| Toàn pack | {len(rows)} | {len({r['student'] for r in rows})} |",
        f"| {COHORT} | {len(k4)} | {len({r['student'] for r in k4})} |",
        f"| {COHORT}, bỏ câu mẫu | {len(live)} | {len({r['student'] for r in live})} |",
        f"| … có nhãn phần học | {len(tagged)} | {len(studs)} |",
        "",
        "## Kết quả",
        "",
        "| # | Chỉ số | Kết quả |",
        "|---|---|---|",
        f"| 1 | Tutor **hỏi ngược** để chẩn đoán (`ask_probing_question`) | "
        f"{pct(moves['ask_probing_question'], len(live))} |",
        f"| 2 | Tutor **giảng lại khái niệm** (`review_concept`) | {pct(moves['review_concept'], len(live))} |",
        f"| 3 | Học viên **quay lại hỏi thêm về cùng một mục bài học ở một dịp khác** | {pct(len(ge2), len(studs))} |",
        f"| 4 | … ở **≥3 dịp** | {pct(len(ge3), len(studs))} |",
        f"| 5 | … quay lại **vào một ngày khác** | {pct(len(otherday), len(studs))} |",
        f"| 6 | Câu hỏi mang ý *ôn / học lại / chưa hiểu* | {pct(len(kw), len(live))} |",
        f"| 7 | Câu trả lời tutor **không trích nguồn** | {pct(nocite, len(live))} |",
        f"| 8 | Lượt có học viên **bấm đánh giá** (`rating`) | {pct(rated, len(live))} |",
        f"| 9 | Lượt có tutor **chấm mức hiểu** (`understanding_level`) | {pct(graded, len(live))} |",
        "",
        f"Khoảng cách giữa hai dịp hỏi liên tiếp về cùng một mục: trung vị "
        f"**{statistics.median(gaps):.1f} giờ**, p90 **{sorted(gaps)[int(len(gaps) * .9)]:.1f} giờ** "
        f"(n={len(gaps)} cặp) — tức không phải hỏi dồn một lúc, mà có cả quay lại hôm sau.",
        "",
    ]
    # --- kiểm độ nhạy của chỉ số 3 theo cỡ mục ---
    med = statistics.median(secsize.values())
    def rate(pool):
        d = collections.defaultdict(list)
        for r in pool:
            d[(r["student"], r["sec"])].append(r["t"])
        st = {x for x, _ in d}
        hit = {x for (x, _), v in d.items() if len(bursts(v)) >= 2}
        return f"{len(hit)}/{len(st)} = {len(hit) / len(st) * 100:.1f}%"
    top5 = {x for x, _ in secsize.most_common(5)}
    solo = collections.defaultdict(list)
    for r in tagged:
        solo[(r["student"], r["sec"])].append(r)
    small_pairs = [v for k, v in solo.items() if secsize[k[1]] <= med]
    L += [
        "## Độ nhạy của chỉ số 3 theo cỡ mục",
        "",
        f"118 mục rất lệch cỡ: trung vị **{med:.0f} lượt**, lớn nhất **{max(secsize.values())}**. "
        "Mục càng to thì 'quay lại cùng mục' càng dễ xảy ra một cách tầm thường, nên phải kiểm:",
        "",
        "| Giới hạn ở | Tỉ lệ |",
        "|---|---|",
        f"| tất cả 118 mục | **{rate(tagged)}** |",
        f"| bỏ 5 mục lớn nhất | {rate([r for r in tagged if r['sec'] not in top5])} |",
        f"| chỉ mục lớn (> trung vị) | {rate([r for r in tagged if secsize[r['sec']] > med])} |",
        f"| chỉ mục nhỏ (≤ trung vị) | {rate([r for r in tagged if secsize[r['sec']] <= med])} |",
        "",
        f"Con số **phụ thuộc mạnh vào cỡ mục**. Nhưng ở mục nhỏ, "
        f"**{sum(1 for v in small_pairs if len(v) == 1) / len(small_pairs) * 100:.0f}% cặp (học viên × mục) "
        "chỉ hỏi đúng một câu** — không có cơ hội quay lại — nên chênh lệch phần lớn là do **ít tiếp xúc**, "
        "không phải do mục to làm số phồng lên. Mức thận trọng nên báo cáo là con số **bỏ 5 mục lớn nhất**.",
        "",
        "## Quote nguyên văn (mã lượt, cắt ngắn theo luật data pack)",
        "",
        "*Minh hoạ định tính cho chỉ số 6, không phải thống kê — xem phần hạn chế.*",
        "",
    ]
    seen = set()
    for r in kw:
        q = clean_q(r)
        if 15 < len(q) and q.lower() not in seen:
            seen.add(q.lower())
            L.append(f"- **[{r['turn_id']}]** *\"{q}\"*")
        if len(seen) >= 8:
            break

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(L) + "\n", encoding="utf-8")
    print("\n".join(L))
    print(f"\n-> đã ghi {OUT.relative_to(ROOT)}")


def selftest():
    t = lambda h, m: dt.datetime(2026, 9, 11, h, m)
    assert len(bursts([t(9, 0), t(9, 5), t(9, 20)])) == 1, "trong 30 phút phải là một dịp"
    assert len(bursts([t(9, 0), t(10, 0)])) == 2, "cách 60 phút phải tách dịp"
    assert len(bursts([t(9, 0), t(9, 31), t(9, 40), t(14, 0)])) == 3
    print("selftest OK")


if __name__ == "__main__":
    selftest() if "--selftest" in sys.argv else report()
