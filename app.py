import streamlit as st
import pikepdf
import io
import zipfile
import time
from datetime import datetime

# ─── Page Config ───
st.set_page_config(
    page_title="PDF Toolkit Pro",
    page_icon="🔐",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─── Custom CSS ───
st.markdown("""
<style>
    /* Global */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    .stApp {
        font-family: 'Inter', sans-serif;
    }

    /* Hero Header */
    .hero-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2.5rem 2rem;
        border-radius: 16px;
        margin-bottom: 2rem;
        text-align: center;
        box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
    }
    .hero-header h1 {
        color: white;
        font-size: 2.2rem;
        font-weight: 700;
        margin: 0;
        letter-spacing: -0.5px;
    }
    .hero-header p {
        color: rgba(255,255,255,0.85);
        font-size: 1.05rem;
        margin-top: 0.5rem;
        font-weight: 300;
    }

    /* Feature Cards */
    .feature-card {
        background: white;
        border: 1px solid #e8ecf1;
        border-radius: 14px;
        padding: 1.8rem;
        text-align: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        cursor: pointer;
        height: 100%;
    }
    .feature-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 32px rgba(0,0,0,0.12);
        border-color: #667eea;
    }
    .feature-icon {
        font-size: 2.5rem;
        margin-bottom: 0.8rem;
        display: block;
    }
    .feature-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: #1a1a2e;
        margin-bottom: 0.4rem;
    }
    .feature-desc {
        font-size: 0.85rem;
        color: #6b7280;
        line-height: 1.5;
    }

    /* Status Cards */
    .status-card {
        border-radius: 12px;
        padding: 1.2rem 1.5rem;
        margin: 0.8rem 0;
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .status-success {
        background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
        border-left: 4px solid #28a745;
    }
    .status-error {
        background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
        border-left: 4px solid #dc3545;
    }
    .status-info {
        background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
        border-left: 4px solid #17a2b8;
    }

    /* File Info Box */
    .file-info-box {
        background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
        border: 1px solid #e0e4f5;
        border-radius: 12px;
        padding: 1.2rem 1.5rem;
        margin: 1rem 0;
    }
    .file-info-box .file-name {
        font-weight: 600;
        color: #1a1a2e;
        font-size: 1rem;
    }
    .file-info-box .file-meta {
        color: #6b7280;
        font-size: 0.85rem;
        margin-top: 0.3rem;
    }

    /* Sidebar */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
    }
    [data-testid="stSidebar"] .stMarkdown h1,
    [data-testid="stSidebar"] .stMarkdown h2,
    [data-testid="stSidebar"] .stMarkdown h3 {
        color: white !important;
    }
    [data-testid="stSidebar"] .stMarkdown p,
    [data-testid="stSidebar"] .stMarkdown li {
        color: rgba(255,255,255,0.7) !important;
    }
    [data-testid="stSidebar"] .stRadio label span {
        color: rgba(255,255,255,0.85) !important;
    }

    /* Buttons */
    .stButton > button[kind="primary"] {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 10px;
        padding: 0.6rem 2rem;
        font-weight: 600;
        letter-spacing: 0.3px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
    .stButton > button[kind="primary"]:hover {
        box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
        transform: translateY(-1px);
    }

    .stDownloadButton > button {
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;
        border: none !important;
        border-radius: 10px !important;
        font-weight: 600 !important;
        box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3) !important;
    }

    /* File Uploader */
    [data-testid="stFileUploader"] {
        border: 2px dashed #c5cae9;
        border-radius: 14px;
        padding: 1rem;
        background: #fafbff;
        transition: all 0.3s ease;
    }
    [data-testid="stFileUploader"]:hover {
        border-color: #667eea;
        background: #f0f2ff;
    }

    /* Divider */
    .custom-divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, #667eea, transparent);
        margin: 1.5rem 0;
        border: none;
    }

    /* Stats Row */
    .stat-box {
        background: white;
        border: 1px solid #e8ecf1;
        border-radius: 12px;
        padding: 1rem 1.2rem;
        text-align: center;
    }
    .stat-number {
        font-size: 1.6rem;
        font-weight: 700;
        color: #667eea;
    }
    .stat-label {
        font-size: 0.8rem;
        color: #6b7280;
        margin-top: 0.2rem;
    }

    /* Footer */
    .footer {
        text-align: center;
        padding: 2rem 0 1rem;
        color: #9ca3af;
        font-size: 0.8rem;
        border-top: 1px solid #e8ecf1;
        margin-top: 3rem;
    }
</style>

<!-- Keep-alive: 5분마다 자동 핑으로 Streamlit Cloud 슬립 방지 -->
<script>
    setInterval(function() {
        fetch(window.location.href, { method: 'HEAD', mode: 'no-cors' })
            .catch(function(){});
    }, 5 * 60 * 1000);
</script>
""", unsafe_allow_html=True)


# ─── Session State ───
if "history" not in st.session_state:
    st.session_state.history = []


# ─── Helper Functions ───
def format_size(size_bytes):
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"


def get_pdf_info(pdf_bytes):
    """PDF 메타데이터 추출"""
    try:
        pdf = pikepdf.open(io.BytesIO(pdf_bytes))
        info = {
            "pages": len(pdf.pages),
            "encrypted": False,
        }
        docinfo = pdf.docinfo
        if "/Title" in docinfo:
            info["title"] = str(docinfo["/Title"])
        if "/Author" in docinfo:
            info["author"] = str(docinfo["/Author"])
        if "/Creator" in docinfo:
            info["creator"] = str(docinfo["/Creator"])
        if "/Producer" in docinfo:
            info["producer"] = str(docinfo["/Producer"])
        pdf.close()
        return info
    except pikepdf.PasswordError:
        return {"encrypted": True}
    except Exception:
        return None


def unlock_pdf(file_bytes, password):
    """PDF 암호 해제"""
    pdf = pikepdf.open(io.BytesIO(file_bytes), password=password)
    output = io.BytesIO()
    pdf.save(output)
    pdf.close()
    output.seek(0)
    return output


def protect_pdf(file_bytes, owner_pw, user_pw=""):
    """PDF 암호 설정"""
    pdf = pikepdf.open(io.BytesIO(file_bytes))
    output = io.BytesIO()
    permissions = pikepdf.Permissions(
        extract=True,
        print_lowres=True,
        print_highres=True,
    )
    encryption = pikepdf.Encryption(
        owner=owner_pw,
        user=user_pw if user_pw else "",
        R=6,
        allow=permissions,
    )
    pdf.save(output, encryption=encryption)
    pdf.close()
    output.seek(0)
    return output


def merge_pdfs(file_list):
    """PDF 병합"""
    merged = pikepdf.Pdf.new()
    for file_bytes in file_list:
        src = pikepdf.open(io.BytesIO(file_bytes))
        merged.pages.extend(src.pages)
    output = io.BytesIO()
    merged.save(output)
    merged.close()
    output.seek(0)
    return output


def split_pdf(file_bytes, ranges_str):
    """PDF 분할 - 페이지 범위별 분할"""
    pdf = pikepdf.open(io.BytesIO(file_bytes))
    total = len(pdf.pages)
    results = []

    for part in ranges_str.split(","):
        part = part.strip()
        if "-" in part:
            start, end = part.split("-", 1)
            start = max(1, int(start.strip()))
            end = min(total, int(end.strip()))
        else:
            start = end = int(part.strip())
            start = max(1, min(total, start))
            end = start

        new_pdf = pikepdf.Pdf.new()
        for i in range(start - 1, end):
            new_pdf.pages.append(pdf.pages[i])

        buf = io.BytesIO()
        new_pdf.save(buf)
        new_pdf.close()
        buf.seek(0)
        results.append((f"pages_{start}-{end}.pdf", buf))

    pdf.close()
    return results


def extract_pages(file_bytes, page_numbers):
    """특정 페이지 추출"""
    pdf = pikepdf.open(io.BytesIO(file_bytes))
    total = len(pdf.pages)
    new_pdf = pikepdf.Pdf.new()

    for p in page_numbers:
        if 1 <= p <= total:
            new_pdf.pages.append(pdf.pages[p - 1])

    buf = io.BytesIO()
    new_pdf.save(buf)
    new_pdf.close()
    buf.seek(0)
    pdf.close()
    return buf


def rotate_pages(file_bytes, rotation, page_numbers=None):
    """페이지 회전"""
    pdf = pikepdf.open(io.BytesIO(file_bytes))
    total = len(pdf.pages)

    if page_numbers is None:
        page_numbers = list(range(1, total + 1))

    for p in page_numbers:
        if 1 <= p <= total:
            page = pdf.pages[p - 1]
            current = int(page.get("/Rotate", 0))
            page["/Rotate"] = pikepdf.Name(str((current + rotation) % 360))

    buf = io.BytesIO()
    pdf.save(buf)
    pdf.close()
    buf.seek(0)
    return buf


def add_to_history(action, filename, status):
    st.session_state.history.insert(0, {
        "time": datetime.now().strftime("%H:%M:%S"),
        "action": action,
        "file": filename,
        "status": status,
    })
    if len(st.session_state.history) > 20:
        st.session_state.history = st.session_state.history[:20]


# ─── Sidebar ───
with st.sidebar:
    st.markdown("## 🔐 PDF Toolkit Pro")
    st.markdown("---")

    tool = st.radio(
        "**도구 선택**",
        [
            "🔓 암호 해제",
            "🔒 암호 설정",
            "📋 PDF 병합",
            "✂️ PDF 분할",
            "📄 페이지 추출",
            "🔄 페이지 회전",
            "ℹ️ PDF 정보 보기",
        ],
        index=0,
    )

    st.markdown("---")

    # History
    if st.session_state.history:
        st.markdown("### 📜 작업 기록")
        for item in st.session_state.history[:8]:
            icon = "✅" if item["status"] == "success" else "❌"
            st.markdown(
                f"<small>{icon} <b>{item['time']}</b> {item['action']}<br>"
                f"&nbsp;&nbsp;&nbsp;{item['file']}</small>",
                unsafe_allow_html=True,
            )
        if st.button("기록 초기화", use_container_width=True):
            st.session_state.history = []
            st.rerun()

    st.markdown("---")
    st.markdown(
        "<small style='color:rgba(255,255,255,0.4)'>Built with Streamlit + pikepdf</small>",
        unsafe_allow_html=True,
    )


# ─── Hero Header ───
st.markdown("""
<div class="hero-header">
    <h1>🔐 PDF Toolkit Pro</h1>
    <p>암호 해제 · 암호 설정 · 병합 · 분할 · 추출 · 회전 · 정보 보기</p>
</div>
""", unsafe_allow_html=True)


# ─── Tool: 암호 해제 ───
if tool == "🔓 암호 해제":
    st.markdown("### 🔓 PDF 암호 해제")
    st.markdown("암호가 걸린 PDF를 업로드하고 비밀번호를 입력하면, 암호가 해제된 PDF를 다운로드할 수 있습니다.")
    st.markdown('<div class="custom-divider"></div>', unsafe_allow_html=True)

    uploaded_files = st.file_uploader(
        "PDF 파일을 업로드하세요 (여러 파일 가능)",
        type=["pdf"],
        accept_multiple_files=True,
        key="unlock_uploader",
    )

    if uploaded_files:
        password = st.text_input("PDF 비밀번호를 입력하세요", type="password", key="unlock_pw")

        if st.button("암호 해제 실행", type="primary", disabled=not password, use_container_width=True):
            results = []
            progress = st.progress(0, text="처리 중...")

            for idx, f in enumerate(uploaded_files):
                try:
                    result = unlock_pdf(f.read(), password)
                    out_name = f.name.replace(".pdf", "_unlocked.pdf")
                    results.append((out_name, result))
                    add_to_history("암호 해제", f.name, "success")
                except pikepdf.PasswordError:
                    st.error(f"**{f.name}** — 비밀번호가 올바르지 않습니다.")
                    add_to_history("암호 해제", f.name, "fail")
                except Exception as e:
                    st.error(f"**{f.name}** — 오류: {e}")
                    add_to_history("암호 해제", f.name, "fail")
                progress.progress((idx + 1) / len(uploaded_files), text=f"{idx+1}/{len(uploaded_files)} 완료")

            if results:
                st.markdown('<div class="status-card status-success">✅ 암호 해제 완료!</div>', unsafe_allow_html=True)

                if len(results) == 1:
                    name, data = results[0]
                    st.download_button(
                        label=f"📥 {name} 다운로드",
                        data=data,
                        file_name=name,
                        mime="application/pdf",
                        type="primary",
                        use_container_width=True,
                    )
                else:
                    # ZIP으로 묶어서 다운로드
                    zip_buf = io.BytesIO()
                    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
                        for name, data in results:
                            zf.writestr(name, data.read())
                    zip_buf.seek(0)
                    st.download_button(
                        label=f"📥 {len(results)}개 파일 일괄 다운로드 (ZIP)",
                        data=zip_buf,
                        file_name="unlocked_pdfs.zip",
                        mime="application/zip",
                        type="primary",
                        use_container_width=True,
                    )


# ─── Tool: 암호 설정 ───
elif tool == "🔒 암호 설정":
    st.markdown("### 🔒 PDF 암호 설정")
    st.markdown("PDF 파일에 비밀번호를 설정하여 보호합니다.")
    st.markdown('<div class="custom-divider"></div>', unsafe_allow_html=True)

    uploaded_file = st.file_uploader("PDF 파일을 업로드하세요", type=["pdf"], key="protect_uploader")

    if uploaded_file:
        st.markdown(
            f'<div class="file-info-box">'
            f'<div class="file-name">📄 {uploaded_file.name}</div>'
            f'<div class="file-meta">{format_size(uploaded_file.size)}</div>'
            f'</div>',
            unsafe_allow_html=True,
        )

        col1, col2 = st.columns(2)
        with col1:
            owner_pw = st.text_input("소유자 비밀번호 (필수)", type="password", key="owner_pw",
                                     help="PDF 권한 변경 시 필요한 비밀번호")
        with col2:
            user_pw = st.text_input("열람 비밀번호 (선택)", type="password", key="user_pw",
                                    help="PDF 열 때 필요한 비밀번호 (비워두면 열람은 자유)")

        if st.button("암호 설정 실행", type="primary", disabled=not owner_pw, use_container_width=True):
            try:
                result = protect_pdf(uploaded_file.read(), owner_pw, user_pw)
                out_name = uploaded_file.name.replace(".pdf", "_protected.pdf")
                add_to_history("암호 설정", uploaded_file.name, "success")

                st.markdown('<div class="status-card status-success">✅ 암호 설정 완료!</div>', unsafe_allow_html=True)
                st.download_button(
                    label=f"📥 {out_name} 다운로드",
                    data=result,
                    file_name=out_name,
                    mime="application/pdf",
                    type="primary",
                    use_container_width=True,
                )
            except Exception as e:
                st.error(f"오류: {e}")
                add_to_history("암호 설정", uploaded_file.name, "fail")


# ─── Tool: PDF 병합 ───
elif tool == "📋 PDF 병합":
    st.markdown("### 📋 PDF 병합")
    st.markdown("여러 PDF 파일을 하나로 합칩니다. 업로드 순서대로 병합됩니다.")
    st.markdown('<div class="custom-divider"></div>', unsafe_allow_html=True)

    uploaded_files = st.file_uploader(
        "PDF 파일을 업로드하세요 (2개 이상)",
        type=["pdf"],
        accept_multiple_files=True,
        key="merge_uploader",
    )

    if uploaded_files:
        st.markdown(f"**{len(uploaded_files)}개 파일 선택됨:**")
        for i, f in enumerate(uploaded_files, 1):
            st.markdown(f"{i}. 📄 **{f.name}** ({format_size(f.size)})")

        if len(uploaded_files) < 2:
            st.warning("2개 이상의 파일을 업로드해주세요.")
        elif st.button("병합 실행", type="primary", use_container_width=True):
            try:
                progress = st.progress(0, text="병합 중...")
                file_bytes_list = []
                for idx, f in enumerate(uploaded_files):
                    file_bytes_list.append(f.read())
                    progress.progress((idx + 1) / len(uploaded_files), text=f"파일 읽는 중... {idx+1}/{len(uploaded_files)}")

                result = merge_pdfs(file_bytes_list)
                progress.progress(1.0, text="완료!")
                add_to_history("PDF 병합", f"{len(uploaded_files)}개 파일", "success")

                st.markdown('<div class="status-card status-success">✅ 병합 완료!</div>', unsafe_allow_html=True)

                # 결과 정보
                info = get_pdf_info(result.getvalue())
                if info and not info.get("encrypted"):
                    st.markdown(f"총 **{info['pages']}페이지**로 병합되었습니다.")

                st.download_button(
                    label="📥 병합된 PDF 다운로드",
                    data=result,
                    file_name="merged.pdf",
                    mime="application/pdf",
                    type="primary",
                    use_container_width=True,
                )
            except Exception as e:
                st.error(f"병합 오류: {e}")
                add_to_history("PDF 병합", f"{len(uploaded_files)}개 파일", "fail")


# ─── Tool: PDF 분할 ───
elif tool == "✂️ PDF 분할":
    st.markdown("### ✂️ PDF 분할")
    st.markdown("PDF 파일을 페이지 범위별로 분할합니다.")
    st.markdown('<div class="custom-divider"></div>', unsafe_allow_html=True)

    uploaded_file = st.file_uploader("PDF 파일을 업로드하세요", type=["pdf"], key="split_uploader")

    if uploaded_file:
        file_bytes = uploaded_file.read()
        info = get_pdf_info(file_bytes)

        if info and not info.get("encrypted"):
            st.markdown(
                f'<div class="file-info-box">'
                f'<div class="file-name">📄 {uploaded_file.name}</div>'
                f'<div class="file-meta">{format_size(uploaded_file.size)} · {info["pages"]}페이지</div>'
                f'</div>',
                unsafe_allow_html=True,
            )

            split_mode = st.radio("분할 방식", ["페이지 범위 지정", "모든 페이지 개별 분할"], horizontal=True)

            if split_mode == "페이지 범위 지정":
                ranges = st.text_input(
                    "페이지 범위 입력",
                    placeholder="예: 1-3, 4-6, 7-10",
                    help="콤마로 구분하여 여러 범위를 입력할 수 있습니다",
                )

                if st.button("분할 실행", type="primary", disabled=not ranges, use_container_width=True):
                    try:
                        results = split_pdf(file_bytes, ranges)
                        add_to_history("PDF 분할", uploaded_file.name, "success")

                        st.markdown('<div class="status-card status-success">✅ 분할 완료!</div>', unsafe_allow_html=True)

                        if len(results) == 1:
                            name, data = results[0]
                            st.download_button(
                                label=f"📥 {name} 다운로드",
                                data=data,
                                file_name=name,
                                mime="application/pdf",
                                type="primary",
                                use_container_width=True,
                            )
                        else:
                            zip_buf = io.BytesIO()
                            with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
                                for name, data in results:
                                    zf.writestr(name, data.read())
                            zip_buf.seek(0)
                            st.download_button(
                                label=f"📥 {len(results)}개 분할 파일 다운로드 (ZIP)",
                                data=zip_buf,
                                file_name="split_pdfs.zip",
                                mime="application/zip",
                                type="primary",
                                use_container_width=True,
                            )
                    except Exception as e:
                        st.error(f"분할 오류: {e}")
                        add_to_history("PDF 분할", uploaded_file.name, "fail")
            else:
                if st.button("모든 페이지 개별 분할", type="primary", use_container_width=True):
                    try:
                        all_ranges = ", ".join(str(i) for i in range(1, info["pages"] + 1))
                        results = split_pdf(file_bytes, all_ranges)
                        add_to_history("PDF 개별 분할", uploaded_file.name, "success")

                        st.markdown('<div class="status-card status-success">✅ 분할 완료!</div>', unsafe_allow_html=True)

                        zip_buf = io.BytesIO()
                        with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
                            for name, data in results:
                                zf.writestr(name, data.read())
                        zip_buf.seek(0)
                        st.download_button(
                            label=f"📥 {info['pages']}개 페이지 다운로드 (ZIP)",
                            data=zip_buf,
                            file_name="split_pages.zip",
                            mime="application/zip",
                            type="primary",
                            use_container_width=True,
                        )
                    except Exception as e:
                        st.error(f"분할 오류: {e}")
                        add_to_history("PDF 개별 분할", uploaded_file.name, "fail")
        elif info and info.get("encrypted"):
            st.warning("이 PDF는 암호가 걸려 있습니다. 먼저 '암호 해제' 도구를 사용하세요.")


# ─── Tool: 페이지 추출 ───
elif tool == "📄 페이지 추출":
    st.markdown("### 📄 페이지 추출")
    st.markdown("PDF에서 원하는 페이지만 추출하여 새로운 PDF를 만듭니다.")
    st.markdown('<div class="custom-divider"></div>', unsafe_allow_html=True)

    uploaded_file = st.file_uploader("PDF 파일을 업로드하세요", type=["pdf"], key="extract_uploader")

    if uploaded_file:
        file_bytes = uploaded_file.read()
        info = get_pdf_info(file_bytes)

        if info and not info.get("encrypted"):
            st.markdown(
                f'<div class="file-info-box">'
                f'<div class="file-name">📄 {uploaded_file.name}</div>'
                f'<div class="file-meta">{format_size(uploaded_file.size)} · {info["pages"]}페이지</div>'
                f'</div>',
                unsafe_allow_html=True,
            )

            pages_input = st.text_input(
                "추출할 페이지 번호",
                placeholder="예: 1, 3, 5, 7-10",
                help="콤마로 구분. 범위도 지원합니다 (예: 3-7)",
            )

            if st.button("추출 실행", type="primary", disabled=not pages_input, use_container_width=True):
                try:
                    page_nums = []
                    for part in pages_input.split(","):
                        part = part.strip()
                        if "-" in part:
                            start, end = part.split("-", 1)
                            page_nums.extend(range(int(start.strip()), int(end.strip()) + 1))
                        else:
                            page_nums.append(int(part))

                    result = extract_pages(file_bytes, page_nums)
                    out_name = uploaded_file.name.replace(".pdf", "_extracted.pdf")
                    add_to_history("페이지 추출", uploaded_file.name, "success")

                    st.markdown('<div class="status-card status-success">✅ 추출 완료!</div>', unsafe_allow_html=True)
                    st.markdown(f"**{len(page_nums)}페이지**가 추출되었습니다.")

                    st.download_button(
                        label=f"📥 {out_name} 다운로드",
                        data=result,
                        file_name=out_name,
                        mime="application/pdf",
                        type="primary",
                        use_container_width=True,
                    )
                except Exception as e:
                    st.error(f"추출 오류: {e}")
                    add_to_history("페이지 추출", uploaded_file.name, "fail")


# ─── Tool: 페이지 회전 ───
elif tool == "🔄 페이지 회전":
    st.markdown("### 🔄 페이지 회전")
    st.markdown("PDF 페이지를 원하는 각도로 회전합니다.")
    st.markdown('<div class="custom-divider"></div>', unsafe_allow_html=True)

    uploaded_file = st.file_uploader("PDF 파일을 업로드하세요", type=["pdf"], key="rotate_uploader")

    if uploaded_file:
        file_bytes = uploaded_file.read()
        info = get_pdf_info(file_bytes)

        if info and not info.get("encrypted"):
            st.markdown(
                f'<div class="file-info-box">'
                f'<div class="file-name">📄 {uploaded_file.name}</div>'
                f'<div class="file-meta">{format_size(uploaded_file.size)} · {info["pages"]}페이지</div>'
                f'</div>',
                unsafe_allow_html=True,
            )

            col1, col2 = st.columns(2)
            with col1:
                rotation = st.selectbox("회전 각도", [90, 180, 270], format_func=lambda x: f"{x}°")
            with col2:
                scope = st.radio("적용 범위", ["모든 페이지", "특정 페이지"], horizontal=True)

            page_nums = None
            if scope == "특정 페이지":
                pages_input = st.text_input("회전할 페이지 번호", placeholder="예: 1, 3, 5")
                if pages_input:
                    page_nums = [int(p.strip()) for p in pages_input.split(",")]

            if st.button("회전 실행", type="primary", use_container_width=True):
                try:
                    result = rotate_pages(file_bytes, rotation, page_nums)
                    out_name = uploaded_file.name.replace(".pdf", f"_rotated{rotation}.pdf")
                    add_to_history("페이지 회전", uploaded_file.name, "success")

                    st.markdown('<div class="status-card status-success">✅ 회전 완료!</div>', unsafe_allow_html=True)
                    st.download_button(
                        label=f"📥 {out_name} 다운로드",
                        data=result,
                        file_name=out_name,
                        mime="application/pdf",
                        type="primary",
                        use_container_width=True,
                    )
                except Exception as e:
                    st.error(f"회전 오류: {e}")
                    add_to_history("페이지 회전", uploaded_file.name, "fail")


# ─── Tool: PDF 정보 ───
elif tool == "ℹ️ PDF 정보 보기":
    st.markdown("### ℹ️ PDF 정보 보기")
    st.markdown("PDF 파일의 상세 정보와 메타데이터를 확인합니다.")
    st.markdown('<div class="custom-divider"></div>', unsafe_allow_html=True)

    uploaded_file = st.file_uploader("PDF 파일을 업로드하세요", type=["pdf"], key="info_uploader")

    if uploaded_file:
        file_bytes = uploaded_file.read()
        info = get_pdf_info(file_bytes)

        st.markdown(
            f'<div class="file-info-box">'
            f'<div class="file-name">📄 {uploaded_file.name}</div>'
            f'<div class="file-meta">{format_size(uploaded_file.size)}</div>'
            f'</div>',
            unsafe_allow_html=True,
        )

        if info:
            if info.get("encrypted"):
                st.markdown('<div class="status-card status-error">🔒 이 PDF는 암호로 보호되어 있습니다.</div>', unsafe_allow_html=True)
                st.info("상세 정보를 보려면 먼저 '암호 해제' 도구로 비밀번호를 풀어주세요.")
            else:
                # Stats row
                cols = st.columns(4)
                stats = [
                    ("📑", str(info.get("pages", "-")), "총 페이지"),
                    ("💾", format_size(uploaded_file.size), "파일 크기"),
                    ("🔐", "아니오", "암호화"),
                    ("📊", f"~{uploaded_file.size // max(info.get('pages', 1), 1) // 1024} KB", "페이지당 크기"),
                ]
                for col, (icon, val, label) in zip(cols, stats):
                    col.markdown(
                        f'<div class="stat-box">'
                        f'<div class="stat-number">{icon} {val}</div>'
                        f'<div class="stat-label">{label}</div>'
                        f'</div>',
                        unsafe_allow_html=True,
                    )

                # Metadata table
                st.markdown("#### 메타데이터")
                meta_items = {
                    "제목": info.get("title", "-"),
                    "저자": info.get("author", "-"),
                    "생성 프로그램": info.get("creator", "-"),
                    "PDF 프로듀서": info.get("producer", "-"),
                }
                for key, val in meta_items.items():
                    st.markdown(f"**{key}:** {val}")
        else:
            st.error("PDF 정보를 읽을 수 없습니다.")


# ─── Footer ───
st.markdown("""
<div class="footer">
    PDF Toolkit Pro &mdash; 모든 파일 처리는 브라우저에서 이루어지며, 서버에 저장되지 않습니다.<br>
    Built with ❤️ using Streamlit & pikepdf
</div>
""", unsafe_allow_html=True)
