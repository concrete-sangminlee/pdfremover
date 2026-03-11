import streamlit as st
import pikepdf
import io
import zipfile
from PIL import Image
import fitz  # PyMuPDF
from datetime import datetime

# ──────────────────────────────────────────────
# Configuration & Page Setup
# ──────────────────────────────────────────────

st.set_page_config(
    page_title="PDF Tools Pro",
    page_icon="📄",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ──────────────────────────────────────────────
# Translations
# ──────────────────────────────────────────────

TRANSLATIONS = {
    "ko": {
        "app_title": "PDF Tools Pro",
        "app_subtitle": "올인원 PDF 도구 — 비밀번호 해제, 병합, 분할, 압축, 워터마크, 이미지 변환",
        "sidebar_title": "도구 선택",
        "tool_unlock": "🔓 비밀번호 해제",
        "tool_merge": "📎 PDF 병합",
        "tool_split": "✂️ PDF 분할",
        "tool_compress": "🗜️ PDF 압축",
        "tool_watermark": "💧 워터마크 추가",
        "tool_to_image": "🖼️ PDF → 이미지",
        "tool_image_to_pdf": "📄 이미지 → PDF",
        "tool_extract_pages": "📑 페이지 추출",
        "tool_rotate": "🔄 페이지 회전",
        "tool_protect": "🔒 비밀번호 설정",
        "upload_pdf": "PDF 파일을 업로드하세요",
        "upload_pdfs": "PDF 파일들을 업로드하세요 (여러 개 가능)",
        "upload_images": "이미지 파일들을 업로드하세요 (여러 개 가능)",
        "file_info": "업로드된 파일: **{name}** ({size})",
        "password_input": "PDF 비밀번호를 입력하세요",
        "btn_unlock": "암호 해제",
        "btn_merge": "PDF 병합하기",
        "btn_split": "PDF 분할하기",
        "btn_compress": "압축하기",
        "btn_watermark": "워터마크 추가",
        "btn_convert": "변환하기",
        "btn_extract": "페이지 추출",
        "btn_rotate": "회전하기",
        "btn_protect": "비밀번호 설정",
        "btn_download": "다운로드",
        "btn_download_all": "전체 다운로드 (ZIP)",
        "success": "처리가 완료되었습니다!",
        "error_password": "비밀번호가 올바르지 않습니다.",
        "error_general": "처리 중 오류가 발생했습니다: {error}",
        "processing": "처리 중...",
        "page_range": "페이지 범위 (예: 1-3, 5, 7-10)",
        "page_range_help": "쉼표로 구분하여 개별 페이지 또는 범위를 지정할 수 있습니다.",
        "watermark_text": "워터마크 텍스트",
        "watermark_opacity": "투명도",
        "compress_level": "압축 수준",
        "compress_low": "낮음 (품질 우선)",
        "compress_medium": "보통",
        "compress_high": "높음 (용량 우선)",
        "total_pages": "총 페이지: {pages}",
        "original_size": "원본 크기",
        "result_size": "결과 크기",
        "compression_ratio": "압축률",
        "rotate_angle": "회전 각도",
        "rotate_pages": "적용할 페이지",
        "rotate_all": "전체 페이지",
        "rotate_specific": "특정 페이지만",
        "new_password": "새 비밀번호 설정",
        "confirm_password": "비밀번호 확인",
        "password_mismatch": "비밀번호가 일치하지 않습니다.",
        "image_format": "이미지 포맷",
        "image_dpi": "해상도 (DPI)",
        "security_notice": "🔒 **보안 안내**: 모든 파일은 서버에 저장되지 않으며, 처리 후 즉시 삭제됩니다.",
        "footer": "PDF Tools Pro — 빠르고 안전한 PDF 도구",
        "split_mode": "분할 방식",
        "split_each": "각 페이지별 분할",
        "split_range": "범위 지정 분할",
        "split_every_n": "N페이지마다 분할",
        "split_n_pages": "몇 페이지마다?",
        "files_count": "{count}개 파일이 업로드되었습니다.",
        "preview": "미리보기",
        "no_file": "파일을 업로드해주세요.",
        "already_optimized": "이미 최적화된 파일입니다. 추가 압축이 불가합니다.",
        "files_generated": "**{count}**개의 파일이 생성되었습니다.",
        "extracted_pages": "**{count}**개의 페이지가 추출되었습니다.",
        "individual_files": "개별 파일 다운로드",
    },
    "en": {
        "app_title": "PDF Tools Pro",
        "app_subtitle": "All-in-One PDF Tools — Unlock, Merge, Split, Compress, Watermark, Convert",
        "sidebar_title": "Select Tool",
        "tool_unlock": "🔓 Remove Password",
        "tool_merge": "📎 Merge PDFs",
        "tool_split": "✂️ Split PDF",
        "tool_compress": "🗜️ Compress PDF",
        "tool_watermark": "💧 Add Watermark",
        "tool_to_image": "🖼️ PDF to Image",
        "tool_image_to_pdf": "📄 Image to PDF",
        "tool_extract_pages": "📑 Extract Pages",
        "tool_rotate": "🔄 Rotate Pages",
        "tool_protect": "🔒 Set Password",
        "upload_pdf": "Upload a PDF file",
        "upload_pdfs": "Upload PDF files (multiple allowed)",
        "upload_images": "Upload image files (multiple allowed)",
        "file_info": "Uploaded: **{name}** ({size})",
        "password_input": "Enter PDF password",
        "btn_unlock": "Remove Password",
        "btn_merge": "Merge PDFs",
        "btn_split": "Split PDF",
        "btn_compress": "Compress",
        "btn_watermark": "Add Watermark",
        "btn_convert": "Convert",
        "btn_extract": "Extract Pages",
        "btn_rotate": "Rotate",
        "btn_protect": "Set Password",
        "btn_download": "Download",
        "btn_download_all": "Download All (ZIP)",
        "success": "Processing complete!",
        "error_password": "Incorrect password.",
        "error_general": "An error occurred: {error}",
        "processing": "Processing...",
        "page_range": "Page range (e.g., 1-3, 5, 7-10)",
        "page_range_help": "Separate individual pages or ranges with commas.",
        "watermark_text": "Watermark text",
        "watermark_opacity": "Opacity",
        "compress_level": "Compression level",
        "compress_low": "Low (quality first)",
        "compress_medium": "Medium",
        "compress_high": "High (size first)",
        "total_pages": "Total pages: {pages}",
        "original_size": "Original size",
        "result_size": "Result size",
        "compression_ratio": "Compression ratio",
        "rotate_angle": "Rotation angle",
        "rotate_pages": "Apply to pages",
        "rotate_all": "All pages",
        "rotate_specific": "Specific pages only",
        "new_password": "Set new password",
        "confirm_password": "Confirm password",
        "password_mismatch": "Passwords do not match.",
        "image_format": "Image format",
        "image_dpi": "Resolution (DPI)",
        "security_notice": "🔒 **Security**: All files are processed in memory and never stored on our servers.",
        "footer": "PDF Tools Pro — Fast & Secure PDF Tools",
        "split_mode": "Split mode",
        "split_each": "Split each page",
        "split_range": "Split by range",
        "split_every_n": "Split every N pages",
        "split_n_pages": "Every how many pages?",
        "files_count": "{count} file(s) uploaded.",
        "preview": "Preview",
        "no_file": "Please upload a file.",
        "already_optimized": "The file is already optimized — compression did not reduce size.",
        "files_generated": "**{count}** file(s) generated.",
        "extracted_pages": "**{count}** page(s) extracted.",
        "individual_files": "Individual file downloads",
    },
}


def t(key, **kwargs):
    """Get translation for current language."""
    lang = st.session_state.get("lang", "ko")
    text = TRANSLATIONS.get(lang, TRANSLATIONS["ko"]).get(key, key)
    if kwargs:
        text = text.format(**kwargs)
    return text


def format_size(size_bytes):
    """Format file size in human-readable format."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"


def parse_page_range(page_range_str, total_pages):
    """Parse page range string like '1-3, 5, 7-10' into a list of 0-indexed page numbers."""
    pages = []
    parts = page_range_str.replace(" ", "").split(",")
    for part in parts:
        if "-" in part:
            start, end = part.split("-", 1)
            start = max(1, int(start))
            end = min(total_pages, int(end))
            pages.extend(range(start - 1, end))
        else:
            page_num = int(part)
            if 1 <= page_num <= total_pages:
                pages.append(page_num - 1)
    return sorted(set(pages))


def get_pdf_preview(pdf_bytes, max_pages=3):
    """Generate preview images from PDF bytes."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    images = []
    for i in range(min(max_pages, len(doc))):
        page = doc[i]
        mat = fitz.Matrix(1.5, 1.5)
        pix = page.get_pixmap(matrix=mat)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        images.append(img)
    doc.close()
    return images


def create_zip(files_dict):
    """Create a ZIP file from a dict of {filename: bytes_data}."""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, data in files_dict.items():
            zf.writestr(name, data)
    zip_buffer.seek(0)
    return zip_buffer


# ──────────────────────────────────────────────
# Custom CSS
# ──────────────────────────────────────────────

st.markdown(
    """
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    .stApp {
        font-family: 'Inter', sans-serif;
    }

    /* Hero header */
    .hero {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem 2rem;
        border-radius: 16px;
        color: white;
        margin-bottom: 2rem;
        text-align: center;
    }
    .hero h1 {
        font-size: 2.2rem;
        font-weight: 700;
        margin-bottom: 0.3rem;
        color: white;
    }
    .hero p {
        font-size: 1rem;
        opacity: 0.9;
        margin-bottom: 0;
        color: white;
    }

    /* Stats cards */
    .stat-card {
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        padding: 1rem 1.2rem;
        border-radius: 12px;
        text-align: center;
        margin-bottom: 0.5rem;
    }
    .stat-card h3 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
        color: #333;
    }
    .stat-card p {
        font-size: 0.85rem;
        color: #666;
        margin: 0;
    }

    /* Result card */
    .result-card {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 12px;
        padding: 1.5rem;
        margin: 1rem 0;
    }

    /* Security badge */
    .security-badge {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 8px;
        padding: 0.8rem 1rem;
        font-size: 0.85rem;
        margin-top: 1rem;
    }

    /* Footer */
    .footer {
        text-align: center;
        padding: 1.5rem;
        color: #999;
        font-size: 0.8rem;
        border-top: 1px solid #eee;
        margin-top: 3rem;
    }

    /* Hide Streamlit branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}

    .stFileUploader > div > div {
        border-radius: 12px;
    }

    .stButton > button[kind="primary"] {
        border-radius: 8px;
        font-weight: 600;
        padding: 0.5rem 2rem;
    }

    .stDownloadButton > button {
        border-radius: 8px;
        font-weight: 600;
    }
</style>
""",
    unsafe_allow_html=True,
)

# ──────────────────────────────────────────────
# Session State Init
# ──────────────────────────────────────────────

if "lang" not in st.session_state:
    st.session_state.lang = "ko"

# ──────────────────────────────────────────────
# Sidebar
# ──────────────────────────────────────────────

with st.sidebar:
    col1, col2 = st.columns(2)
    with col1:
        if st.button("🇰🇷 한국어", use_container_width=True,
                      type="primary" if st.session_state.lang == "ko" else "secondary"):
            st.session_state.lang = "ko"
            st.rerun()
    with col2:
        if st.button("🇺🇸 English", use_container_width=True,
                      type="primary" if st.session_state.lang == "en" else "secondary"):
            st.session_state.lang = "en"
            st.rerun()

    st.markdown("---")
    st.markdown(f"### {t('sidebar_title')}")

    tools = [
        "tool_unlock",
        "tool_merge",
        "tool_split",
        "tool_compress",
        "tool_watermark",
        "tool_to_image",
        "tool_image_to_pdf",
        "tool_extract_pages",
        "tool_rotate",
        "tool_protect",
    ]

    selected_tool = st.radio(
        t("sidebar_title"),
        tools,
        format_func=lambda x: t(x),
        label_visibility="collapsed",
    )

    st.markdown("---")
    st.markdown(f'<div class="security-badge">{t("security_notice")}</div>', unsafe_allow_html=True)

# ──────────────────────────────────────────────
# Header
# ──────────────────────────────────────────────

st.markdown(
    f"""
<div class="hero">
    <h1>{t("app_title")}</h1>
    <p>{t("app_subtitle")}</p>
</div>
""",
    unsafe_allow_html=True,
)

# ──────────────────────────────────────────────
# Tool: Password Removal
# ──────────────────────────────────────────────

if selected_tool == "tool_unlock":
    uploaded_file = st.file_uploader(t("upload_pdf"), type=["pdf"], key="unlock_upload")

    if uploaded_file:
        file_bytes = uploaded_file.read()
        st.info(t("file_info", name=uploaded_file.name, size=format_size(len(file_bytes))))

        # Preview (may fail for encrypted PDFs)
        try:
            previews = get_pdf_preview(file_bytes, max_pages=2)
            if previews:
                cols = st.columns(len(previews))
                for i, img in enumerate(previews):
                    with cols[i]:
                        st.image(img, caption=f"Page {i + 1}", use_container_width=True)
        except Exception:
            pass

        password = st.text_input(t("password_input"), type="password")

        if st.button(t("btn_unlock"), type="primary", disabled=not password, use_container_width=True):
            with st.spinner(t("processing")):
                try:
                    pdf = pikepdf.open(io.BytesIO(file_bytes), password=password)
                    output = io.BytesIO()
                    pdf.save(output)
                    pdf.close()
                    output.seek(0)
                    result_bytes = output.getvalue()
                    output_filename = uploaded_file.name.replace(".pdf", "_unlocked.pdf")

                    st.markdown('<div class="result-card">', unsafe_allow_html=True)
                    st.success(t("success"))

                    col1, col2 = st.columns(2)
                    with col1:
                        st.markdown(
                            f'<div class="stat-card"><h3>{format_size(len(file_bytes))}</h3><p>{t("original_size")}</p></div>',
                            unsafe_allow_html=True,
                        )
                    with col2:
                        st.markdown(
                            f'<div class="stat-card"><h3>{format_size(len(result_bytes))}</h3><p>{t("result_size")}</p></div>',
                            unsafe_allow_html=True,
                        )

                    st.download_button(
                        label=f"⬇️ {t('btn_download')} — {output_filename}",
                        data=result_bytes,
                        file_name=output_filename,
                        mime="application/pdf",
                        type="primary",
                        use_container_width=True,
                    )
                    st.markdown("</div>", unsafe_allow_html=True)

                except pikepdf.PasswordError:
                    st.error(t("error_password"))
                except Exception as e:
                    st.error(t("error_general", error=str(e)))

# ──────────────────────────────────────────────
# Tool: Merge PDFs
# ──────────────────────────────────────────────

elif selected_tool == "tool_merge":
    uploaded_files = st.file_uploader(t("upload_pdfs"), type=["pdf"], accept_multiple_files=True, key="merge_upload")

    if uploaded_files:
        st.info(t("files_count", count=len(uploaded_files)))
        for i, f in enumerate(uploaded_files):
            st.markdown(f"**{i + 1}.** {f.name} ({format_size(f.size)})")

        if st.button(t("btn_merge"), type="primary", use_container_width=True):
            with st.spinner(t("processing")):
                try:
                    merger = pikepdf.Pdf.new()
                    for f in uploaded_files:
                        src = pikepdf.open(io.BytesIO(f.read()))
                        merger.pages.extend(src.pages)

                    output = io.BytesIO()
                    merger.save(output)
                    merger.close()
                    output.seek(0)
                    result_bytes = output.getvalue()

                    st.markdown('<div class="result-card">', unsafe_allow_html=True)
                    st.success(t("success"))
                    st.markdown(
                        f'<div class="stat-card"><h3>{format_size(len(result_bytes))}</h3><p>{t("result_size")}</p></div>',
                        unsafe_allow_html=True,
                    )

                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    st.download_button(
                        label=f"⬇️ {t('btn_download')} — merged_{timestamp}.pdf",
                        data=result_bytes,
                        file_name=f"merged_{timestamp}.pdf",
                        mime="application/pdf",
                        type="primary",
                        use_container_width=True,
                    )
                    st.markdown("</div>", unsafe_allow_html=True)

                except Exception as e:
                    st.error(t("error_general", error=str(e)))

# ──────────────────────────────────────────────
# Tool: Split PDF
# ──────────────────────────────────────────────

elif selected_tool == "tool_split":
    uploaded_file = st.file_uploader(t("upload_pdf"), type=["pdf"], key="split_upload")

    if uploaded_file:
        file_bytes = uploaded_file.read()
        src_pdf = pikepdf.open(io.BytesIO(file_bytes))
        total_pages = len(src_pdf.pages)
        st.info(t("file_info", name=uploaded_file.name, size=format_size(len(file_bytes))))
        st.markdown(t("total_pages", pages=total_pages))

        split_mode = st.radio(
            t("split_mode"),
            ["split_each", "split_range", "split_every_n"],
            format_func=lambda x: t(x),
            horizontal=True,
        )

        page_range_str = ""
        n_pages = 1
        if split_mode == "split_range":
            page_range_str = st.text_input(t("page_range"), help=t("page_range_help"))
        elif split_mode == "split_every_n":
            n_pages = st.number_input(t("split_n_pages"), min_value=1, max_value=total_pages, value=1)

        if st.button(t("btn_split"), type="primary", use_container_width=True):
            with st.spinner(t("processing")):
                try:
                    result_files = {}

                    if split_mode == "split_each":
                        for i in range(total_pages):
                            new_pdf = pikepdf.Pdf.new()
                            new_pdf.pages.append(src_pdf.pages[i])
                            buf = io.BytesIO()
                            new_pdf.save(buf)
                            new_pdf.close()
                            name = uploaded_file.name.replace(".pdf", f"_page{i + 1}.pdf")
                            result_files[name] = buf.getvalue()

                    elif split_mode == "split_range":
                        pages = parse_page_range(page_range_str, total_pages)
                        if pages:
                            new_pdf = pikepdf.Pdf.new()
                            for p in pages:
                                new_pdf.pages.append(src_pdf.pages[p])
                            buf = io.BytesIO()
                            new_pdf.save(buf)
                            new_pdf.close()
                            name = uploaded_file.name.replace(".pdf", "_extracted.pdf")
                            result_files[name] = buf.getvalue()

                    elif split_mode == "split_every_n":
                        for start in range(0, total_pages, n_pages):
                            end = min(start + n_pages, total_pages)
                            new_pdf = pikepdf.Pdf.new()
                            for p in range(start, end):
                                new_pdf.pages.append(src_pdf.pages[p])
                            buf = io.BytesIO()
                            new_pdf.save(buf)
                            new_pdf.close()
                            name = uploaded_file.name.replace(
                                ".pdf", f"_pages{start + 1}-{end}.pdf"
                            )
                            result_files[name] = buf.getvalue()

                    src_pdf.close()

                    if result_files:
                        st.markdown('<div class="result-card">', unsafe_allow_html=True)
                        st.success(t("success"))

                        if len(result_files) == 1:
                            name, data = next(iter(result_files.items()))
                            st.download_button(
                                label=f"⬇️ {t('btn_download')} — {name}",
                                data=data,
                                file_name=name,
                                mime="application/pdf",
                                type="primary",
                                use_container_width=True,
                            )
                        else:
                            st.markdown(t("files_generated", count=len(result_files)))
                            zip_data = create_zip(result_files)
                            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                            st.download_button(
                                label=f"⬇️ {t('btn_download_all')}",
                                data=zip_data,
                                file_name=f"split_{timestamp}.zip",
                                mime="application/zip",
                                type="primary",
                                use_container_width=True,
                            )
                            with st.expander(t("individual_files")):
                                for name, data in result_files.items():
                                    st.download_button(
                                        label=f"⬇️ {name}",
                                        data=data,
                                        file_name=name,
                                        mime="application/pdf",
                                        key=f"dl_{name}",
                                        use_container_width=True,
                                    )
                        st.markdown("</div>", unsafe_allow_html=True)

                except Exception as e:
                    st.error(t("error_general", error=str(e)))

# ──────────────────────────────────────────────
# Tool: Compress PDF
# ──────────────────────────────────────────────

elif selected_tool == "tool_compress":
    uploaded_file = st.file_uploader(t("upload_pdf"), type=["pdf"], key="compress_upload")

    if uploaded_file:
        file_bytes = uploaded_file.read()
        st.info(t("file_info", name=uploaded_file.name, size=format_size(len(file_bytes))))

        compress_level = st.select_slider(
            t("compress_level"),
            options=["compress_low", "compress_medium", "compress_high"],
            format_func=lambda x: t(x),
            value="compress_medium",
        )

        if st.button(t("btn_compress"), type="primary", use_container_width=True):
            with st.spinner(t("processing")):
                try:
                    pdf = pikepdf.open(io.BytesIO(file_bytes))
                    pdf.remove_unreferenced_resources()

                    output = io.BytesIO()
                    if compress_level == "compress_high":
                        pdf.save(output, recompress_flate=True, object_stream_mode=pikepdf.ObjectStreamMode.generate)
                    elif compress_level == "compress_medium":
                        pdf.save(output, object_stream_mode=pikepdf.ObjectStreamMode.generate)
                    else:
                        pdf.save(output)

                    pdf.close()
                    output.seek(0)
                    result_bytes = output.getvalue()

                    original_size = len(file_bytes)
                    result_size = len(result_bytes)
                    ratio = ((original_size - result_size) / original_size) * 100 if original_size > 0 else 0

                    st.markdown('<div class="result-card">', unsafe_allow_html=True)
                    st.success(t("success"))

                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.markdown(
                            f'<div class="stat-card"><h3>{format_size(original_size)}</h3><p>{t("original_size")}</p></div>',
                            unsafe_allow_html=True,
                        )
                    with col2:
                        st.markdown(
                            f'<div class="stat-card"><h3>{format_size(result_size)}</h3><p>{t("result_size")}</p></div>',
                            unsafe_allow_html=True,
                        )
                    with col3:
                        st.markdown(
                            f'<div class="stat-card"><h3>{ratio:.1f}%</h3><p>{t("compression_ratio")}</p></div>',
                            unsafe_allow_html=True,
                        )

                    if result_size < original_size:
                        output_name = uploaded_file.name.replace(".pdf", "_compressed.pdf")
                        st.download_button(
                            label=f"⬇️ {t('btn_download')} — {output_name}",
                            data=result_bytes,
                            file_name=output_name,
                            mime="application/pdf",
                            type="primary",
                            use_container_width=True,
                        )
                    else:
                        st.warning(t("already_optimized"))
                    st.markdown("</div>", unsafe_allow_html=True)

                except Exception as e:
                    st.error(t("error_general", error=str(e)))

# ──────────────────────────────────────────────
# Tool: Add Watermark
# ──────────────────────────────────────────────

elif selected_tool == "tool_watermark":
    uploaded_file = st.file_uploader(t("upload_pdf"), type=["pdf"], key="watermark_upload")

    if uploaded_file:
        file_bytes = uploaded_file.read()
        st.info(t("file_info", name=uploaded_file.name, size=format_size(len(file_bytes))))

        col1, col2 = st.columns(2)
        with col1:
            watermark_text = st.text_input(t("watermark_text"), value="CONFIDENTIAL")
        with col2:
            opacity = st.slider(t("watermark_opacity"), 0.05, 0.5, 0.15, 0.05)

        col3, col4 = st.columns(2)
        with col3:
            font_size = st.slider("Font size", 20, 120, 60, 5)
        with col4:
            watermark_color = st.color_picker("Color", "#FF0000")

        if st.button(t("btn_watermark"), type="primary", use_container_width=True, disabled=not watermark_text):
            with st.spinner(t("processing")):
                try:
                    doc = fitz.open(stream=file_bytes, filetype="pdf")

                    hex_color = watermark_color.lstrip("#")
                    r = int(hex_color[0:2], 16) / 255
                    g = int(hex_color[2:4], 16) / 255
                    b = int(hex_color[4:6], 16) / 255

                    for page in doc:
                        rect = page.rect
                        text_point = fitz.Point(rect.width / 4, rect.height * 2 / 3)
                        page.insert_text(
                            text_point,
                            watermark_text,
                            fontsize=font_size,
                            color=(r, g, b),
                            rotate=45,
                            overlay=True,
                            opacity=opacity,
                        )

                    output = io.BytesIO()
                    doc.save(output)
                    doc.close()
                    output.seek(0)
                    result_bytes = output.getvalue()

                    st.markdown('<div class="result-card">', unsafe_allow_html=True)
                    st.success(t("success"))

                    previews = get_pdf_preview(result_bytes, max_pages=1)
                    if previews:
                        st.image(previews[0], caption=t("preview"), use_container_width=True)

                    output_name = uploaded_file.name.replace(".pdf", "_watermarked.pdf")
                    st.download_button(
                        label=f"⬇️ {t('btn_download')} — {output_name}",
                        data=result_bytes,
                        file_name=output_name,
                        mime="application/pdf",
                        type="primary",
                        use_container_width=True,
                    )
                    st.markdown("</div>", unsafe_allow_html=True)

                except Exception as e:
                    st.error(t("error_general", error=str(e)))

# ──────────────────────────────────────────────
# Tool: PDF to Image
# ──────────────────────────────────────────────

elif selected_tool == "tool_to_image":
    uploaded_file = st.file_uploader(t("upload_pdf"), type=["pdf"], key="toimg_upload")

    if uploaded_file:
        file_bytes = uploaded_file.read()
        src_pdf = fitz.open(stream=file_bytes, filetype="pdf")
        total_pages = len(src_pdf)
        st.info(t("file_info", name=uploaded_file.name, size=format_size(len(file_bytes))))
        st.markdown(t("total_pages", pages=total_pages))

        col1, col2 = st.columns(2)
        with col1:
            img_format = st.selectbox(t("image_format"), ["PNG", "JPEG", "WEBP"])
        with col2:
            dpi = st.selectbox(t("image_dpi"), [72, 150, 300, 600], index=1)

        page_range_str = st.text_input(t("page_range"), value=f"1-{total_pages}", help=t("page_range_help"))

        if st.button(t("btn_convert"), type="primary", use_container_width=True):
            with st.spinner(t("processing")):
                try:
                    pages = parse_page_range(page_range_str, total_pages)
                    zoom = dpi / 72
                    mat = fitz.Matrix(zoom, zoom)
                    result_files = {}

                    progress_bar = st.progress(0)
                    for idx, page_num in enumerate(pages):
                        page = src_pdf[page_num]
                        pix = page.get_pixmap(matrix=mat)
                        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

                        buf = io.BytesIO()
                        fmt = img_format.upper()
                        if fmt == "JPEG":
                            img.save(buf, format="JPEG", quality=95)
                        elif fmt == "WEBP":
                            img.save(buf, format="WEBP", quality=90)
                        else:
                            img.save(buf, format="PNG")

                        ext = img_format.lower()
                        if ext == "jpeg":
                            ext = "jpg"
                        name = uploaded_file.name.replace(".pdf", f"_page{page_num + 1}.{ext}")
                        result_files[name] = buf.getvalue()
                        progress_bar.progress((idx + 1) / len(pages))

                    src_pdf.close()
                    progress_bar.empty()

                    st.markdown('<div class="result-card">', unsafe_allow_html=True)
                    st.success(t("success"))

                    if len(result_files) == 1:
                        name, data = next(iter(result_files.items()))
                        st.image(data, caption=name, use_container_width=True)
                        st.download_button(
                            label=f"⬇️ {t('btn_download')} — {name}",
                            data=data,
                            file_name=name,
                            mime=f"image/{img_format.lower()}",
                            type="primary",
                            use_container_width=True,
                        )
                    else:
                        preview_items = list(result_files.items())[:3]
                        cols = st.columns(len(preview_items))
                        for i, (name, data) in enumerate(preview_items):
                            with cols[i]:
                                st.image(data, caption=name, use_container_width=True)

                        zip_data = create_zip(result_files)
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        st.download_button(
                            label=f"⬇️ {t('btn_download_all')} ({len(result_files)} files)",
                            data=zip_data,
                            file_name=f"images_{timestamp}.zip",
                            mime="application/zip",
                            type="primary",
                            use_container_width=True,
                        )
                    st.markdown("</div>", unsafe_allow_html=True)

                except Exception as e:
                    st.error(t("error_general", error=str(e)))

# ──────────────────────────────────────────────
# Tool: Image to PDF
# ──────────────────────────────────────────────

elif selected_tool == "tool_image_to_pdf":
    uploaded_files = st.file_uploader(
        t("upload_images"),
        type=["png", "jpg", "jpeg", "webp", "bmp", "tiff"],
        accept_multiple_files=True,
        key="img2pdf_upload",
    )

    if uploaded_files:
        st.info(t("files_count", count=len(uploaded_files)))
        for i, f in enumerate(uploaded_files):
            st.markdown(f"**{i + 1}.** {f.name} ({format_size(f.size)})")

        if st.button(t("btn_convert"), type="primary", use_container_width=True):
            with st.spinner(t("processing")):
                try:
                    doc = fitz.open()
                    for f in uploaded_files:
                        img_bytes = f.read()
                        img = Image.open(io.BytesIO(img_bytes))
                        if img.mode in ("RGBA", "P"):
                            img = img.convert("RGB")
                        img_buf = io.BytesIO()
                        img.save(img_buf, format="JPEG", quality=95)
                        img_buf.seek(0)

                        img_doc = fitz.open(stream=img_buf, filetype="jpeg")
                        rect = img_doc[0].rect
                        pdf_page = doc.new_page(width=rect.width, height=rect.height)
                        pdf_page.insert_image(rect, stream=img_buf.getvalue())
                        img_doc.close()

                    output = io.BytesIO()
                    doc.save(output)
                    doc.close()
                    output.seek(0)
                    result_bytes = output.getvalue()

                    st.markdown('<div class="result-card">', unsafe_allow_html=True)
                    st.success(t("success"))

                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    st.download_button(
                        label=f"⬇️ {t('btn_download')} — images_to_pdf_{timestamp}.pdf",
                        data=result_bytes,
                        file_name=f"images_to_pdf_{timestamp}.pdf",
                        mime="application/pdf",
                        type="primary",
                        use_container_width=True,
                    )
                    st.markdown("</div>", unsafe_allow_html=True)

                except Exception as e:
                    st.error(t("error_general", error=str(e)))

# ──────────────────────────────────────────────
# Tool: Extract Pages
# ──────────────────────────────────────────────

elif selected_tool == "tool_extract_pages":
    uploaded_file = st.file_uploader(t("upload_pdf"), type=["pdf"], key="extract_upload")

    if uploaded_file:
        file_bytes = uploaded_file.read()
        src_pdf = pikepdf.open(io.BytesIO(file_bytes))
        total_pages = len(src_pdf.pages)
        st.info(t("file_info", name=uploaded_file.name, size=format_size(len(file_bytes))))
        st.markdown(t("total_pages", pages=total_pages))

        try:
            previews = get_pdf_preview(file_bytes, max_pages=min(6, total_pages))
            if previews:
                cols = st.columns(min(3, len(previews)))
                for i, img in enumerate(previews):
                    with cols[i % 3]:
                        st.image(img, caption=f"Page {i + 1}", use_container_width=True)
        except Exception:
            pass

        page_range_str = st.text_input(t("page_range"), help=t("page_range_help"))

        if st.button(t("btn_extract"), type="primary", use_container_width=True, disabled=not page_range_str):
            with st.spinner(t("processing")):
                try:
                    pages = parse_page_range(page_range_str, total_pages)
                    new_pdf = pikepdf.Pdf.new()
                    for p in pages:
                        new_pdf.pages.append(src_pdf.pages[p])

                    output = io.BytesIO()
                    new_pdf.save(output)
                    new_pdf.close()
                    src_pdf.close()
                    output.seek(0)
                    result_bytes = output.getvalue()

                    st.markdown('<div class="result-card">', unsafe_allow_html=True)
                    st.success(t("success"))
                    st.markdown(t("extracted_pages", count=len(pages)))

                    output_name = uploaded_file.name.replace(".pdf", "_extracted.pdf")
                    st.download_button(
                        label=f"⬇️ {t('btn_download')} — {output_name}",
                        data=result_bytes,
                        file_name=output_name,
                        mime="application/pdf",
                        type="primary",
                        use_container_width=True,
                    )
                    st.markdown("</div>", unsafe_allow_html=True)

                except Exception as e:
                    st.error(t("error_general", error=str(e)))

# ──────────────────────────────────────────────
# Tool: Rotate Pages
# ──────────────────────────────────────────────

elif selected_tool == "tool_rotate":
    uploaded_file = st.file_uploader(t("upload_pdf"), type=["pdf"], key="rotate_upload")

    if uploaded_file:
        file_bytes = uploaded_file.read()
        src_pdf = pikepdf.open(io.BytesIO(file_bytes))
        total_pages = len(src_pdf.pages)
        st.info(t("file_info", name=uploaded_file.name, size=format_size(len(file_bytes))))
        st.markdown(t("total_pages", pages=total_pages))

        col1, col2 = st.columns(2)
        with col1:
            angle = st.selectbox(t("rotate_angle"), [90, 180, 270])
        with col2:
            apply_to = st.radio(t("rotate_pages"), [t("rotate_all"), t("rotate_specific")], horizontal=True)

        page_range_str = ""
        if apply_to == t("rotate_specific"):
            page_range_str = st.text_input(t("page_range"), help=t("page_range_help"))

        if st.button(t("btn_rotate"), type="primary", use_container_width=True):
            with st.spinner(t("processing")):
                try:
                    if apply_to == t("rotate_all"):
                        pages_to_rotate = list(range(total_pages))
                    else:
                        pages_to_rotate = parse_page_range(page_range_str, total_pages)

                    for p in pages_to_rotate:
                        page = src_pdf.pages[p]
                        current = int(page.get("/Rotate", 0))
                        page["/Rotate"] = pikepdf.Name(str((current + angle) % 360))

                    output = io.BytesIO()
                    src_pdf.save(output)
                    src_pdf.close()
                    output.seek(0)
                    result_bytes = output.getvalue()

                    st.markdown('<div class="result-card">', unsafe_allow_html=True)
                    st.success(t("success"))

                    try:
                        previews = get_pdf_preview(result_bytes, max_pages=2)
                        if previews:
                            cols = st.columns(len(previews))
                            for i, img in enumerate(previews):
                                with cols[i]:
                                    st.image(img, caption=f"Page {i + 1}", use_container_width=True)
                    except Exception:
                        pass

                    output_name = uploaded_file.name.replace(".pdf", "_rotated.pdf")
                    st.download_button(
                        label=f"⬇️ {t('btn_download')} — {output_name}",
                        data=result_bytes,
                        file_name=output_name,
                        mime="application/pdf",
                        type="primary",
                        use_container_width=True,
                    )
                    st.markdown("</div>", unsafe_allow_html=True)

                except Exception as e:
                    st.error(t("error_general", error=str(e)))

# ──────────────────────────────────────────────
# Tool: Password Protect
# ──────────────────────────────────────────────

elif selected_tool == "tool_protect":
    uploaded_file = st.file_uploader(t("upload_pdf"), type=["pdf"], key="protect_upload")

    if uploaded_file:
        file_bytes = uploaded_file.read()
        st.info(t("file_info", name=uploaded_file.name, size=format_size(len(file_bytes))))

        col1, col2 = st.columns(2)
        with col1:
            new_password = st.text_input(t("new_password"), type="password")
        with col2:
            confirm_password = st.text_input(t("confirm_password"), type="password")

        passwords_match = new_password and new_password == confirm_password
        if new_password and confirm_password and not passwords_match:
            st.warning(t("password_mismatch"))

        if st.button(t("btn_protect"), type="primary", use_container_width=True, disabled=not passwords_match):
            with st.spinner(t("processing")):
                try:
                    pdf = pikepdf.open(io.BytesIO(file_bytes))
                    output = io.BytesIO()
                    pdf.save(
                        output,
                        encryption=pikepdf.Encryption(
                            owner=new_password,
                            user=new_password,
                            R=6,
                        ),
                    )
                    pdf.close()
                    output.seek(0)
                    result_bytes = output.getvalue()

                    st.markdown('<div class="result-card">', unsafe_allow_html=True)
                    st.success(t("success"))

                    output_name = uploaded_file.name.replace(".pdf", "_protected.pdf")
                    st.download_button(
                        label=f"⬇️ {t('btn_download')} — {output_name}",
                        data=result_bytes,
                        file_name=output_name,
                        mime="application/pdf",
                        type="primary",
                        use_container_width=True,
                    )
                    st.markdown("</div>", unsafe_allow_html=True)

                except Exception as e:
                    st.error(t("error_general", error=str(e)))

# ──────────────────────────────────────────────
# Footer
# ──────────────────────────────────────────────

st.markdown(f'<div class="footer">{t("footer")} &copy; {datetime.now().year}</div>', unsafe_allow_html=True)
