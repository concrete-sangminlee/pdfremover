import streamlit as st
import pikepdf
import io
import zipfile
from datetime import datetime

# ─── Page Config ───
st.set_page_config(
    page_title="PDF Toolkit Pro",
    page_icon="🔐",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─── CSS: passlab-inspired dark theme ───
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');

    :root {
        --bg-primary: #050505;
        --bg-secondary: #0d0d0d;
        --bg-card: #111111;
        --bg-card-hover: #171717;
        --bg-elevated: #1a1a1a;
        --border: #2a2a2a;
        --border-light: #222222;
        --accent: #8cff2e;
        --accent-dim: rgba(140, 255, 46, 0.08);
        --accent-glow: rgba(140, 255, 46, 0.15);
        --text-primary: #ffffff;
        --text-secondary: rgba(255, 255, 255, 0.55);
        --text-tertiary: rgba(255, 255, 255, 0.3);
        --text-muted: rgba(255, 255, 255, 0.18);
        --danger: #ff4757;
        --warning: #ffa502;
        --success: #8cff2e;
        --radius: 14px;
        --radius-sm: 10px;
        --radius-lg: 20px;
        --radius-xl: 28px;
    }

    /* ── Global ── */
    .stApp, [data-testid="stAppViewContainer"], .main .block-container {
        background-color: var(--bg-primary) !important;
        color: var(--text-primary);
        font-family: 'Manrope', -apple-system, sans-serif;
    }
    .main .block-container {
        max-width: 900px;
        padding: 2rem 1.5rem 4rem;
    }
    header[data-testid="stHeader"] {
        background: transparent !important;
    }

    /* Hide default streamlit elements */
    #MainMenu, footer, .stDeployButton { display: none !important; }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg-primary); }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }

    /* ── Hero ── */
    .hero {
        text-align: center;
        padding: 3.5rem 1rem 2.5rem;
        position: relative;
    }
    .hero::before {
        content: '';
        position: absolute;
        top: -100px; left: 50%;
        transform: translateX(-50%);
        width: 600px; height: 400px;
        background: radial-gradient(ellipse, rgba(140,255,46,0.06) 0%, transparent 70%);
        pointer-events: none;
    }
    .hero-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: var(--accent-dim);
        border: 1px solid rgba(140,255,46,0.12);
        color: var(--accent);
        font-size: 0.72rem;
        font-weight: 600;
        padding: 6px 16px;
        border-radius: 50px;
        margin-bottom: 1.5rem;
        letter-spacing: 1px;
        text-transform: uppercase;
    }
    .hero-pill::before {
        content: '';
        width: 6px; height: 6px;
        background: var(--accent);
        border-radius: 50%;
        box-shadow: 0 0 8px var(--accent);
    }
    .hero h1 {
        font-size: 3.2rem;
        font-weight: 800;
        color: var(--text-primary);
        margin: 0;
        letter-spacing: -1.5px;
        line-height: 1.1;
    }
    .hero h1 .accent { color: var(--accent); }
    .hero-sub {
        color: var(--text-secondary);
        font-size: 1.05rem;
        margin-top: 0.8rem;
        font-weight: 400;
        line-height: 1.6;
    }

    /* Hero features row */
    .hero-features {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        margin-top: 2rem;
        flex-wrap: wrap;
    }
    .hero-feat {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-tertiary);
        font-size: 0.82rem;
        font-weight: 500;
    }
    .hero-feat-dot {
        width: 5px; height: 5px;
        background: var(--accent);
        border-radius: 50%;
        flex-shrink: 0;
    }

    /* ── Section Header ── */
    .sec-header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 6px;
    }
    .sec-icon {
        width: 44px; height: 44px;
        background: var(--accent-dim);
        border: 1px solid rgba(140,255,46,0.1);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        flex-shrink: 0;
    }
    .sec-title {
        font-size: 1.35rem;
        font-weight: 700;
        color: var(--text-primary);
        letter-spacing: -0.3px;
    }
    .sec-desc {
        color: var(--text-secondary);
        font-size: 0.88rem;
        font-weight: 400;
    }

    /* ── Divider ── */
    .divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--border), transparent);
        margin: 1.2rem 0 1.8rem;
    }

    /* ── File Card ── */
    .file-card {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius);
        padding: 14px 18px;
        margin: 8px 0;
        display: flex;
        align-items: center;
        gap: 14px;
        transition: all 0.25s ease;
    }
    .file-card:hover {
        border-color: var(--border);
        background: var(--bg-card-hover);
    }
    .file-card-icon {
        width: 40px; height: 40px;
        background: linear-gradient(135deg, rgba(140,255,46,0.1), rgba(140,255,46,0.04));
        border: 1px solid rgba(140,255,46,0.08);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        flex-shrink: 0;
    }
    .file-card-name {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.9rem;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .file-card-meta {
        color: var(--text-tertiary);
        font-size: 0.78rem;
        font-family: 'JetBrains Mono', monospace;
        flex-shrink: 0;
    }

    /* ── File List (Merge) ── */
    .flist-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-sm);
        margin: 5px 0;
        transition: all 0.2s ease;
    }
    .flist-item:hover {
        border-color: rgba(140,255,46,0.15);
        background: var(--bg-card-hover);
    }
    .flist-num {
        width: 24px; height: 24px;
        background: var(--accent);
        color: #050505;
        border-radius: 7px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 800;
        flex-shrink: 0;
    }
    .flist-name {
        flex: 1;
        font-weight: 500;
        color: var(--text-primary);
        font-size: 0.88rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .flist-size {
        color: var(--text-tertiary);
        font-size: 0.75rem;
        font-family: 'JetBrains Mono', monospace;
    }

    /* ── Toast / Status ── */
    .toast {
        border-radius: var(--radius-sm);
        padding: 12px 18px;
        margin: 10px 0;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        font-size: 0.9rem;
        animation: fadeSlide 0.4s ease;
    }
    @keyframes fadeSlide {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .toast-success {
        background: rgba(140,255,46,0.06);
        border: 1px solid rgba(140,255,46,0.12);
        color: var(--accent);
    }
    .toast-error {
        background: rgba(255,71,87,0.06);
        border: 1px solid rgba(255,71,87,0.12);
        color: var(--danger);
    }
    .toast-warning {
        background: rgba(255,165,2,0.06);
        border: 1px solid rgba(255,165,2,0.12);
        color: var(--warning);
    }
    .toast-icon { font-size: 1.1rem; flex-shrink: 0; }

    /* ── Tip Box ── */
    .tip {
        background: rgba(140,255,46,0.03);
        border: 1px solid rgba(140,255,46,0.06);
        border-radius: var(--radius-sm);
        padding: 10px 16px;
        margin: 10px 0;
        font-size: 0.82rem;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .tip-icon { font-size: 1rem; flex-shrink: 0; }

    /* ── Stats Grid ── */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin: 1.5rem 0;
    }
    .stat-card {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius);
        padding: 16px;
        text-align: center;
        transition: all 0.25s ease;
    }
    .stat-card:hover {
        border-color: rgba(140,255,46,0.15);
        background: var(--bg-card-hover);
    }
    .stat-icon { font-size: 1.3rem; margin-bottom: 6px; }
    .stat-val {
        font-size: 1.3rem;
        font-weight: 800;
        color: var(--text-primary);
        font-family: 'JetBrains Mono', monospace;
    }
    .stat-label {
        font-size: 0.68rem;
        color: var(--text-tertiary);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 4px;
        font-weight: 600;
    }

    /* ── Meta Table ── */
    .meta-tbl {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        border-radius: var(--radius);
        overflow: hidden;
        border: 1px solid var(--border-light);
        margin: 1rem 0;
    }
    .meta-tbl tr { transition: background 0.2s; }
    .meta-tbl tr:hover { background: var(--bg-card-hover); }
    .meta-tbl td {
        padding: 12px 18px;
        border-bottom: 1px solid var(--border-light);
        font-size: 0.88rem;
    }
    .meta-tbl tr:last-child td { border-bottom: none; }
    .meta-tbl td:first-child {
        font-weight: 600;
        color: var(--text-secondary);
        width: 130px;
        background: rgba(255,255,255,0.02);
    }
    .meta-tbl td:last-child { color: var(--text-primary); }

    /* ── Sidebar ── */
    [data-testid="stSidebar"] {
        background: var(--bg-secondary) !important;
        border-right: 1px solid var(--border-light) !important;
    }
    [data-testid="stSidebar"] .stMarkdown h1,
    [data-testid="stSidebar"] .stMarkdown h2,
    [data-testid="stSidebar"] .stMarkdown h3,
    [data-testid="stSidebar"] .stMarkdown h4 {
        color: var(--text-primary) !important;
    }
    [data-testid="stSidebar"] .stMarkdown p,
    [data-testid="stSidebar"] .stMarkdown li,
    [data-testid="stSidebar"] .stMarkdown small {
        color: var(--text-secondary) !important;
    }
    [data-testid="stSidebar"] .stRadio label p,
    [data-testid="stSidebar"] .stRadio label span {
        color: rgba(255,255,255,0.75) !important;
        font-weight: 500 !important;
    }
    [data-testid="stSidebar"] hr {
        border-color: var(--border-light) !important;
    }

    /* Sidebar logo */
    .sb-logo {
        text-align: center;
        padding: 1.5rem 0 0.8rem;
    }
    .sb-logo-icon { font-size: 2rem; display: block; margin-bottom: 4px; }
    .sb-logo-name {
        font-size: 1.05rem;
        font-weight: 800;
        color: var(--text-primary);
        letter-spacing: -0.3px;
    }
    .sb-logo-name .accent { color: var(--accent); }
    .sb-logo-ver {
        font-size: 0.6rem;
        color: var(--text-muted);
        letter-spacing: 2px;
        text-transform: uppercase;
        margin-top: 2px;
    }

    /* History */
    .hist-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 7px 10px;
        border-radius: 8px;
        margin: 3px 0;
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.03);
    }
    .hist-item:hover { background: rgba(255,255,255,0.04); }
    .hist-dot {
        width: 7px; height: 7px;
        border-radius: 50%;
        margin-top: 5px;
        flex-shrink: 0;
    }
    .hist-dot.ok { background: var(--accent); box-shadow: 0 0 6px rgba(140,255,46,0.4); }
    .hist-dot.fail { background: var(--danger); box-shadow: 0 0 6px rgba(255,71,87,0.4); }
    .hist-text {
        font-size: 0.72rem;
        color: var(--text-tertiary);
        line-height: 1.4;
    }
    .hist-text b { color: var(--text-secondary); }
    .hist-time {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.6rem;
        color: var(--text-muted);
    }

    /* ── Buttons ── */
    .stButton > button[kind="primary"] {
        background: var(--accent) !important;
        color: #050505 !important;
        border: none !important;
        border-radius: var(--radius-sm) !important;
        padding: 10px 24px !important;
        font-weight: 700 !important;
        font-size: 0.92rem !important;
        font-family: 'Manrope', sans-serif !important;
        letter-spacing: -0.2px !important;
        transition: all 0.25s ease !important;
        box-shadow: 0 0 20px rgba(140,255,46,0.15) !important;
    }
    .stButton > button[kind="primary"]:hover {
        box-shadow: 0 0 35px rgba(140,255,46,0.25) !important;
        transform: translateY(-1px) !important;
    }
    .stButton > button[kind="primary"]:active {
        transform: translateY(0) !important;
    }

    .stDownloadButton > button {
        background: var(--accent) !important;
        color: #050505 !important;
        border: none !important;
        border-radius: var(--radius-sm) !important;
        font-weight: 700 !important;
        font-size: 0.92rem !important;
        font-family: 'Manrope', sans-serif !important;
        box-shadow: 0 0 20px rgba(140,255,46,0.15) !important;
        transition: all 0.25s ease !important;
    }
    .stDownloadButton > button:hover {
        box-shadow: 0 0 35px rgba(140,255,46,0.25) !important;
        transform: translateY(-1px) !important;
    }

    /* secondary buttons */
    .stButton > button:not([kind="primary"]) {
        background: var(--bg-card) !important;
        color: var(--text-secondary) !important;
        border: 1px solid var(--border) !important;
        border-radius: var(--radius-sm) !important;
        font-family: 'Manrope', sans-serif !important;
        font-weight: 600 !important;
        transition: all 0.2s ease !important;
    }
    .stButton > button:not([kind="primary"]):hover {
        border-color: var(--accent) !important;
        color: var(--accent) !important;
        background: var(--accent-dim) !important;
    }

    /* ── File Uploader ── */
    [data-testid="stFileUploader"] {
        border: 1.5px dashed var(--border) !important;
        border-radius: var(--radius) !important;
        padding: 16px !important;
        background: var(--bg-card) !important;
        transition: all 0.25s ease !important;
    }
    [data-testid="stFileUploader"]:hover {
        border-color: rgba(140,255,46,0.2) !important;
        background: var(--bg-card-hover) !important;
    }
    [data-testid="stFileUploader"] label p {
        color: var(--text-secondary) !important;
    }
    [data-testid="stFileUploader"] small {
        color: var(--text-tertiary) !important;
    }
    [data-testid="stFileUploader"] button {
        background: var(--bg-elevated) !important;
        color: var(--text-primary) !important;
        border: 1px solid var(--border) !important;
        border-radius: 8px !important;
    }

    /* ── Text Input ── */
    .stTextInput label p { color: var(--text-secondary) !important; }
    .stTextInput > div > div > input {
        background: var(--bg-card) !important;
        border: 1.5px solid var(--border) !important;
        border-radius: var(--radius-sm) !important;
        color: var(--text-primary) !important;
        padding: 10px 14px !important;
        font-family: 'Manrope', sans-serif !important;
        font-size: 0.92rem !important;
        transition: all 0.25s ease !important;
    }
    .stTextInput > div > div > input:focus {
        border-color: var(--accent) !important;
        box-shadow: 0 0 0 2px var(--accent-dim) !important;
    }
    .stTextInput > div > div > input::placeholder {
        color: var(--text-muted) !important;
    }

    /* ── Select / Radio ── */
    .stSelectbox label p,
    .stRadio label { color: var(--text-secondary) !important; }
    .stSelectbox > div > div {
        background: var(--bg-card) !important;
        border: 1.5px solid var(--border) !important;
        border-radius: var(--radius-sm) !important;
        color: var(--text-primary) !important;
    }
    .stRadio > div > label > div:first-child {
        background-color: var(--accent) !important;
    }

    /* ── Progress ── */
    .stProgress > div > div > div > div {
        background: var(--accent) !important;
        border-radius: 50px !important;
    }
    .stProgress > div > div {
        background: var(--bg-elevated) !important;
    }

    /* ── Markdown in main ── */
    .stMarkdown p, .stMarkdown li { color: var(--text-secondary); }
    .stMarkdown h1, .stMarkdown h2, .stMarkdown h3,
    .stMarkdown h4, .stMarkdown h5 { color: var(--text-primary); }
    .stMarkdown strong { color: var(--text-primary); }
    .stMarkdown code {
        background: var(--bg-card);
        color: var(--accent);
        padding: 2px 6px;
        border-radius: 4px;
    }

    /* ── Warning / Error ── */
    .stAlert {
        background: var(--bg-card) !important;
        border: 1px solid var(--border) !important;
        border-radius: var(--radius-sm) !important;
        color: var(--text-secondary) !important;
    }

    /* ── Footer ── */
    .footer {
        text-align: center;
        padding: 2.5rem 0 1.5rem;
        margin-top: 4rem;
        position: relative;
    }
    .footer::before {
        content: '';
        position: absolute;
        top: 0; left: 15%; right: 15%;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--border), transparent);
    }
    .footer-text {
        color: var(--text-muted);
        font-size: 0.75rem;
        line-height: 1.8;
    }
    .footer-brand {
        font-weight: 700;
        color: var(--accent);
    }

    /* ── Responsive ── */
    @media (max-width: 768px) {
        .hero h1 { font-size: 2.2rem; }
        .hero-features { flex-direction: column; align-items: center; gap: 0.6rem; }
        .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
</style>

<!-- Keep-alive -->
<script>
    setInterval(function() {
        fetch(window.location.href, { method: 'HEAD', mode: 'no-cors' }).catch(function(){});
    }, 5 * 60 * 1000);
</script>
""", unsafe_allow_html=True)


# ─── Session State ───
if "history" not in st.session_state:
    st.session_state.history = []


# ─── Helpers ───
def fmt_size(b):
    if b < 1024: return f"{b} B"
    if b < 1024**2: return f"{b/1024:.1f} KB"
    return f"{b/1024**2:.1f} MB"


def pdf_info(data):
    try:
        pdf = pikepdf.open(io.BytesIO(data))
        info = {"pages": len(pdf.pages), "encrypted": False}
        di = pdf.docinfo
        for k, f in [("/Title","title"),("/Author","author"),("/Creator","creator"),("/Producer","producer")]:
            if k in di: info[f] = str(di[k])
        pdf.close()
        return info
    except pikepdf.PasswordError:
        return {"encrypted": True}
    except Exception:
        return None


def unlock(data, pw):
    pdf = pikepdf.open(io.BytesIO(data), password=pw)
    out = io.BytesIO(); pdf.save(out); pdf.close(); out.seek(0); return out


def protect(data, opw, upw=""):
    pdf = pikepdf.open(io.BytesIO(data))
    out = io.BytesIO()
    perms = pikepdf.Permissions(extract=True, print_lowres=True, print_highres=True)
    enc = pikepdf.Encryption(owner=opw, user=upw or "", R=6, allow=perms)
    pdf.save(out, encryption=enc); pdf.close(); out.seek(0); return out


def merge(files):
    m = pikepdf.Pdf.new()
    for d in files:
        s = pikepdf.open(io.BytesIO(d)); m.pages.extend(s.pages)
    out = io.BytesIO(); m.save(out); m.close(); out.seek(0); return out


def split(data, ranges_str):
    pdf = pikepdf.open(io.BytesIO(data)); total = len(pdf.pages); results = []
    for part in ranges_str.split(","):
        part = part.strip()
        if "-" in part:
            s, e = part.split("-",1); s, e = max(1,int(s)), min(total,int(e))
        else:
            s = e = max(1, min(total, int(part)))
        n = pikepdf.Pdf.new()
        for i in range(s-1, e): n.pages.append(pdf.pages[i])
        b = io.BytesIO(); n.save(b); n.close(); b.seek(0)
        results.append((f"pages_{s}-{e}.pdf", b))
    pdf.close(); return results


def extract(data, pages):
    pdf = pikepdf.open(io.BytesIO(data)); total = len(pdf.pages)
    n = pikepdf.Pdf.new()
    for p in pages:
        if 1 <= p <= total: n.pages.append(pdf.pages[p-1])
    b = io.BytesIO(); n.save(b); n.close(); b.seek(0); pdf.close(); return b


def rotate(data, deg, pages=None):
    pdf = pikepdf.open(io.BytesIO(data)); total = len(pdf.pages)
    if pages is None: pages = list(range(1, total+1))
    for p in pages:
        if 1 <= p <= total:
            pg = pdf.pages[p-1]; cur = int(pg.get("/Rotate",0))
            pg["/Rotate"] = pikepdf.Name(str((cur+deg)%360))
    b = io.BytesIO(); pdf.save(b); pdf.close(); b.seek(0); return b


def hist_add(action, fname, status):
    st.session_state.history.insert(0, {"time": datetime.now().strftime("%H:%M:%S"), "action": action, "file": fname, "status": status})
    st.session_state.history = st.session_state.history[:20]


def file_card(name, size, extra=""):
    m = fmt_size(size) + (f" · {extra}" if extra else "")
    st.markdown(f'<div class="file-card"><div class="file-card-icon">📄</div><div class="file-card-name">{name}</div><div class="file-card-meta">{m}</div></div>', unsafe_allow_html=True)


def sec_header(icon, title, desc):
    st.markdown(f'<div class="sec-header"><div class="sec-icon">{icon}</div><div><div class="sec-title">{title}</div><div class="sec-desc">{desc}</div></div></div>', unsafe_allow_html=True)


TOOLS = {
    "🔓 암호 해제": ("🔓","PDF 암호 해제","비밀번호가 걸린 PDF의 암호를 제거합니다"),
    "🔒 암호 설정": ("🔒","PDF 암호 설정","PDF에 비밀번호를 설정하여 보호합니다"),
    "📋 PDF 병합": ("📋","PDF 병합","여러 PDF를 하나로 합칩니다"),
    "✂️ PDF 분할": ("✂️","PDF 분할","페이지 범위별로 분할합니다"),
    "📄 페이지 추출": ("📄","페이지 추출","원하는 페이지만 추출합니다"),
    "🔄 페이지 회전": ("🔄","페이지 회전","원하는 각도로 회전합니다"),
    "ℹ️ PDF 정보": ("ℹ️","PDF 정보 보기","메타데이터와 상세 정보를 확인합니다"),
}


# ─── Sidebar ───
with st.sidebar:
    st.markdown('<div class="sb-logo"><span class="sb-logo-icon">🔐</span><div class="sb-logo-name">PDF Toolkit <span class="accent">Pro</span></div><div class="sb-logo-ver">v2.0</div></div>', unsafe_allow_html=True)
    st.markdown("---")
    tool = st.radio("도구 선택", list(TOOLS.keys()), index=0, label_visibility="collapsed")
    st.markdown("---")

    if st.session_state.history:
        st.markdown("#### 📜 작업 기록")
        for h in st.session_state.history[:8]:
            dc = "ok" if h["status"]=="success" else "fail"
            st.markdown(f'<div class="hist-item"><div class="hist-dot {dc}"></div><div><div class="hist-text"><b>{h["action"]}</b><br>{h["file"]}</div><div class="hist-time">{h["time"]}</div></div></div>', unsafe_allow_html=True)
        if st.button("기록 초기화", use_container_width=True):
            st.session_state.history = []; st.rerun()
        st.markdown("---")

    st.markdown('<div style="text-align:center;padding:1rem 0"><small style="color:rgba(255,255,255,0.12)">Built with Streamlit & pikepdf</small></div>', unsafe_allow_html=True)


# ─── Hero ───
st.markdown("""
<div class="hero">
    <div class="hero-pill">All-in-One PDF Solution</div>
    <h1>PDF Toolkit <span class="accent">Pro</span></h1>
    <div class="hero-sub">PDF 암호 해제부터 병합, 분할, 보호까지 — 하나의 도구로 해결하세요.</div>
    <div class="hero-features">
        <div class="hero-feat"><div class="hero-feat-dot"></div>AES-256 암호화</div>
        <div class="hero-feat"><div class="hero-feat-dot"></div>최대 200MB 업로드</div>
        <div class="hero-feat"><div class="hero-feat-dot"></div>서버 저장 없음</div>
        <div class="hero-feat"><div class="hero-feat-dot"></div>일괄 처리 지원</div>
    </div>
</div>
""", unsafe_allow_html=True)


# ─── Tool Header ───
c = TOOLS[tool]
sec_header(c[0], c[1], c[2])
st.markdown('<div class="divider"></div>', unsafe_allow_html=True)


# ─── 암호 해제 ───
if tool == "🔓 암호 해제":
    files = st.file_uploader("PDF 파일을 업로드하세요 (여러 파일 가능)", type=["pdf"], accept_multiple_files=True, key="u1")
    if files:
        for f in files: file_card(f.name, f.size)
        pw = st.text_input("PDF 비밀번호", type="password", key="p1")
        if st.button("암호 해제 실행", type="primary", disabled=not pw, use_container_width=True):
            res = []; prog = st.progress(0, text="처리 중...")
            for i, f in enumerate(files):
                try:
                    r = unlock(f.read(), pw); res.append((f.name.replace(".pdf","_unlocked.pdf"), r)); hist_add("암호 해제", f.name, "success")
                except pikepdf.PasswordError:
                    st.markdown(f'<div class="toast toast-error"><span class="toast-icon">✕</span><b>{f.name}</b> — 비밀번호가 올바르지 않습니다.</div>', unsafe_allow_html=True); hist_add("암호 해제", f.name, "fail")
                except Exception as e:
                    st.markdown(f'<div class="toast toast-error"><span class="toast-icon">✕</span><b>{f.name}</b> — {e}</div>', unsafe_allow_html=True); hist_add("암호 해제", f.name, "fail")
                prog.progress((i+1)/len(files), text=f"{i+1}/{len(files)} 완료")
            if res:
                st.markdown('<div class="toast toast-success"><span class="toast-icon">✓</span>암호 해제 완료!</div>', unsafe_allow_html=True)
                if len(res)==1:
                    n,d = res[0]; st.download_button(f"📥 {n} 다운로드", data=d, file_name=n, mime="application/pdf", type="primary", use_container_width=True)
                else:
                    zb = io.BytesIO()
                    with zipfile.ZipFile(zb,"w",zipfile.ZIP_DEFLATED) as zf:
                        for n,d in res: zf.writestr(n, d.read())
                    zb.seek(0); st.download_button(f"📥 {len(res)}개 파일 다운로드 (ZIP)", data=zb, file_name="unlocked.zip", mime="application/zip", type="primary", use_container_width=True)


# ─── 암호 설정 ───
elif tool == "🔒 암호 설정":
    f = st.file_uploader("PDF 파일을 업로드하세요", type=["pdf"], key="u2")
    if f:
        file_card(f.name, f.size)
        c1, c2 = st.columns(2)
        with c1: opw = st.text_input("소유자 비밀번호 (필수)", type="password", key="op", help="권한 변경용")
        with c2: upw = st.text_input("열람 비밀번호 (선택)", type="password", key="up", help="열 때 필요 (비워두면 자유)")
        st.markdown('<div class="tip"><span class="tip-icon">💡</span>소유자 비밀번호는 권한 수정용이고, 열람 비밀번호를 설정하면 열 때 입력해야 합니다.</div>', unsafe_allow_html=True)
        if st.button("암호 설정 실행", type="primary", disabled=not opw, use_container_width=True):
            try:
                r = protect(f.read(), opw, upw); on = f.name.replace(".pdf","_protected.pdf"); hist_add("암호 설정", f.name, "success")
                st.markdown('<div class="toast toast-success"><span class="toast-icon">✓</span>암호 설정 완료!</div>', unsafe_allow_html=True)
                st.download_button(f"📥 {on} 다운로드", data=r, file_name=on, mime="application/pdf", type="primary", use_container_width=True)
            except Exception as e:
                st.markdown(f'<div class="toast toast-error"><span class="toast-icon">✕</span>오류: {e}</div>', unsafe_allow_html=True); hist_add("암호 설정", f.name, "fail")


# ─── 병합 ───
elif tool == "📋 PDF 병합":
    st.markdown('<div class="tip"><span class="tip-icon">💡</span>업로드 순서대로 병합됩니다. 2개 이상 선택해주세요.</div>', unsafe_allow_html=True)
    files = st.file_uploader("PDF 파일 업로드 (2개 이상)", type=["pdf"], accept_multiple_files=True, key="u3")
    if files:
        for i, f in enumerate(files, 1):
            st.markdown(f'<div class="flist-item"><div class="flist-num">{i}</div><div class="flist-name">{f.name}</div><div class="flist-size">{fmt_size(f.size)}</div></div>', unsafe_allow_html=True)
        if len(files) < 2:
            st.markdown('<div class="toast toast-warning"><span class="toast-icon">⚠</span>2개 이상의 파일을 업로드해주세요.</div>', unsafe_allow_html=True)
        elif st.button("병합 실행", type="primary", use_container_width=True):
            try:
                prog = st.progress(0, text="병합 중...")
                bl = []
                for i, f in enumerate(files): bl.append(f.read()); prog.progress((i+1)/len(files), text=f"읽는 중... {i+1}/{len(files)}")
                r = merge(bl); prog.progress(1.0, text="완료!"); hist_add("PDF 병합", f"{len(files)}개 파일", "success")
                st.markdown('<div class="toast toast-success"><span class="toast-icon">✓</span>병합 완료!</div>', unsafe_allow_html=True)
                info = pdf_info(r.getvalue())
                if info and not info.get("encrypted"): st.markdown(f"총 **{info['pages']}페이지**로 병합되었습니다.")
                st.download_button("📥 병합된 PDF 다운로드", data=r, file_name="merged.pdf", mime="application/pdf", type="primary", use_container_width=True)
            except Exception as e:
                st.markdown(f'<div class="toast toast-error"><span class="toast-icon">✕</span>병합 오류: {e}</div>', unsafe_allow_html=True); hist_add("PDF 병합", f"{len(files)}개", "fail")


# ─── 분할 ───
elif tool == "✂️ PDF 분할":
    f = st.file_uploader("PDF 파일을 업로드하세요", type=["pdf"], key="u4")
    if f:
        fb = f.read(); info = pdf_info(fb)
        if info and not info.get("encrypted"):
            file_card(f.name, f.size, f"{info['pages']}페이지")
            mode = st.radio("분할 방식", ["페이지 범위 지정","모든 페이지 개별 분할"], horizontal=True)
            if mode == "페이지 범위 지정":
                rng = st.text_input("페이지 범위", placeholder="예: 1-3, 4-6, 7-10", help="콤마로 구분")
                if st.button("분할 실행", type="primary", disabled=not rng, use_container_width=True):
                    try:
                        rs = split(fb, rng); hist_add("PDF 분할", f.name, "success")
                        st.markdown('<div class="toast toast-success"><span class="toast-icon">✓</span>분할 완료!</div>', unsafe_allow_html=True)
                        if len(rs)==1:
                            n,d = rs[0]; st.download_button(f"📥 {n}", data=d, file_name=n, mime="application/pdf", type="primary", use_container_width=True)
                        else:
                            zb = io.BytesIO()
                            with zipfile.ZipFile(zb,"w",zipfile.ZIP_DEFLATED) as zf:
                                for n,d in rs: zf.writestr(n,d.read())
                            zb.seek(0); st.download_button(f"📥 {len(rs)}개 파일 (ZIP)", data=zb, file_name="split.zip", mime="application/zip", type="primary", use_container_width=True)
                    except Exception as e:
                        st.markdown(f'<div class="toast toast-error"><span class="toast-icon">✕</span>{e}</div>', unsafe_allow_html=True); hist_add("PDF 분할", f.name, "fail")
            else:
                if st.button("모든 페이지 개별 분할", type="primary", use_container_width=True):
                    try:
                        ar = ", ".join(str(i) for i in range(1, info["pages"]+1)); rs = split(fb, ar); hist_add("개별 분할", f.name, "success")
                        st.markdown('<div class="toast toast-success"><span class="toast-icon">✓</span>분할 완료!</div>', unsafe_allow_html=True)
                        zb = io.BytesIO()
                        with zipfile.ZipFile(zb,"w",zipfile.ZIP_DEFLATED) as zf:
                            for n,d in rs: zf.writestr(n,d.read())
                        zb.seek(0); st.download_button(f"📥 {info['pages']}개 페이지 (ZIP)", data=zb, file_name="split_pages.zip", mime="application/zip", type="primary", use_container_width=True)
                    except Exception as e:
                        st.markdown(f'<div class="toast toast-error"><span class="toast-icon">✕</span>{e}</div>', unsafe_allow_html=True); hist_add("개별 분할", f.name, "fail")
        elif info and info.get("encrypted"):
            st.markdown('<div class="toast toast-warning"><span class="toast-icon">🔒</span>암호가 걸려 있습니다. 먼저 암호 해제를 사용하세요.</div>', unsafe_allow_html=True)


# ─── 추출 ───
elif tool == "📄 페이지 추출":
    f = st.file_uploader("PDF 파일을 업로드하세요", type=["pdf"], key="u5")
    if f:
        fb = f.read(); info = pdf_info(fb)
        if info and not info.get("encrypted"):
            file_card(f.name, f.size, f"{info['pages']}페이지")
            pi = st.text_input("추출할 페이지", placeholder="예: 1, 3, 5, 7-10", help="콤마로 구분, 범위 지원")
            if st.button("추출 실행", type="primary", disabled=not pi, use_container_width=True):
                try:
                    pn = []
                    for p in pi.split(","):
                        p = p.strip()
                        if "-" in p: s,e = p.split("-",1); pn.extend(range(int(s),int(e)+1))
                        else: pn.append(int(p))
                    r = extract(fb, pn); on = f.name.replace(".pdf","_extracted.pdf"); hist_add("페이지 추출", f.name, "success")
                    st.markdown(f'<div class="toast toast-success"><span class="toast-icon">✓</span>{len(pn)}페이지 추출 완료!</div>', unsafe_allow_html=True)
                    st.download_button(f"📥 {on} 다운로드", data=r, file_name=on, mime="application/pdf", type="primary", use_container_width=True)
                except Exception as e:
                    st.markdown(f'<div class="toast toast-error"><span class="toast-icon">✕</span>{e}</div>', unsafe_allow_html=True); hist_add("페이지 추출", f.name, "fail")


# ─── 회전 ───
elif tool == "🔄 페이지 회전":
    f = st.file_uploader("PDF 파일을 업로드하세요", type=["pdf"], key="u6")
    if f:
        fb = f.read(); info = pdf_info(fb)
        if info and not info.get("encrypted"):
            file_card(f.name, f.size, f"{info['pages']}페이지")
            c1, c2 = st.columns(2)
            with c1: deg = st.selectbox("회전 각도", [90,180,270], format_func=lambda x: f"↻ {x}°")
            with c2: scope = st.radio("적용 범위", ["모든 페이지","특정 페이지"], horizontal=True)
            pn = None
            if scope == "특정 페이지":
                pi = st.text_input("회전할 페이지", placeholder="예: 1, 3, 5")
                if pi: pn = [int(p.strip()) for p in pi.split(",")]
            if st.button("회전 실행", type="primary", use_container_width=True):
                try:
                    r = rotate(fb, deg, pn); on = f.name.replace(".pdf",f"_rot{deg}.pdf"); hist_add("페이지 회전", f.name, "success")
                    st.markdown('<div class="toast toast-success"><span class="toast-icon">✓</span>회전 완료!</div>', unsafe_allow_html=True)
                    st.download_button(f"📥 {on} 다운로드", data=r, file_name=on, mime="application/pdf", type="primary", use_container_width=True)
                except Exception as e:
                    st.markdown(f'<div class="toast toast-error"><span class="toast-icon">✕</span>{e}</div>', unsafe_allow_html=True); hist_add("페이지 회전", f.name, "fail")


# ─── 정보 ───
elif tool == "ℹ️ PDF 정보":
    f = st.file_uploader("PDF 파일을 업로드하세요", type=["pdf"], key="u7")
    if f:
        fb = f.read(); info = pdf_info(fb)
        file_card(f.name, f.size)
        if info:
            if info.get("encrypted"):
                st.markdown('<div class="toast toast-warning"><span class="toast-icon">🔒</span>암호로 보호되어 있습니다. 먼저 암호를 해제하세요.</div>', unsafe_allow_html=True)
            else:
                pp = f.size // max(info.get("pages",1),1)
                st.markdown(
                    f'<div class="stats-grid">'
                    f'<div class="stat-card"><div class="stat-icon">📑</div><div class="stat-val">{info.get("pages","-")}</div><div class="stat-label">Pages</div></div>'
                    f'<div class="stat-card"><div class="stat-icon">💾</div><div class="stat-val">{fmt_size(f.size)}</div><div class="stat-label">Size</div></div>'
                    f'<div class="stat-card"><div class="stat-icon">🔐</div><div class="stat-val">No</div><div class="stat-label">Encrypted</div></div>'
                    f'<div class="stat-card"><div class="stat-icon">📊</div><div class="stat-val">{fmt_size(pp)}</div><div class="stat-label">Per Page</div></div>'
                    f'</div>', unsafe_allow_html=True)
                st.markdown("#### 메타데이터")
                meta = [("제목",info.get("title","—")),("저자",info.get("author","—")),("생성 프로그램",info.get("creator","—")),("프로듀서",info.get("producer","—"))]
                rows = "".join(f"<tr><td>{k}</td><td>{v}</td></tr>" for k,v in meta)
                st.markdown(f'<table class="meta-tbl">{rows}</table>', unsafe_allow_html=True)
        else:
            st.markdown('<div class="toast toast-error"><span class="toast-icon">✕</span>PDF 정보를 읽을 수 없습니다.</div>', unsafe_allow_html=True)


# ─── Footer ───
st.markdown("""
<div class="footer">
    <div class="footer-text">
        <span class="footer-brand">PDF Toolkit Pro</span> — 모든 파일은 서버에 저장되지 않습니다<br>
        Built with ❤ using Streamlit & pikepdf
    </div>
</div>
""", unsafe_allow_html=True)
