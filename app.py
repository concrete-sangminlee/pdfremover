import streamlit as st
import pikepdf
import io
import zipfile
from PIL import Image
import fitz  # PyMuPDF
from datetime import datetime

from translations import TRANSLATIONS
from utils import (
    t, format_size, parse_page_range, get_pdf_preview,
    create_zip, add_to_history, get_pdf_metadata,
    show_result_card_start, show_result_card_end, show_stat_cards,
)
from styles import LIGHT_CSS, DARK_CSS

# ──────────────────────────────────────────────
# Page Config
# ──────────────────────────────────────────────

st.set_page_config(
    page_title="PDF Tools Pro",
    page_icon="📄",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ──────────────────────────────────────────────
# Session State Init
# ──────────────────────────────────────────────

if "lang" not in st.session_state:
    st.session_state.lang = "ko"
if "dark_mode" not in st.session_state:
    st.session_state.dark_mode = False
if "history" not in st.session_state:
    st.session_state.history = []
if "usage_count" not in st.session_state:
    st.session_state.usage_count = 0

# ──────────────────────────────────────────────
# CSS
# ──────────────────────────────────────────────

st.markdown(DARK_CSS if st.session_state.dark_mode else LIGHT_CSS, unsafe_allow_html=True)

# ──────────────────────────────────────────────
# Tool Registry
# ──────────────────────────────────────────────

TOOL_CATEGORIES = {
    "cat_security": ["tool_unlock", "tool_protect"],
    "cat_organize": ["tool_merge", "tool_split", "tool_extract_pages", "tool_delete_pages", "tool_reorder", "tool_rotate"],
    "cat_convert": ["tool_to_image", "tool_image_to_pdf"],
    "cat_enhance": ["tool_compress", "tool_watermark", "tool_page_numbers"],
    "cat_info": ["tool_text_extract", "tool_metadata", "tool_pdf_info"],
}

ALL_TOOLS = ["tool_home"]
for tools in TOOL_CATEGORIES.values():
    ALL_TOOLS.extend(tools)

# ──────────────────────────────────────────────
# Sidebar
# ──────────────────────────────────────────────

with st.sidebar:
    # Language toggle
    lang_cols = st.columns(3)
    with lang_cols[0]:
        if st.button("🇰🇷", use_container_width=True,
                      type="primary" if st.session_state.lang == "ko" else "secondary",
                      help="한국어"):
            st.session_state.lang = "ko"
            st.rerun()
    with lang_cols[1]:
        if st.button("🇺🇸", use_container_width=True,
                      type="primary" if st.session_state.lang == "en" else "secondary",
                      help="English"):
            st.session_state.lang = "en"
            st.rerun()
    with lang_cols[2]:
        if st.button("🇯🇵", use_container_width=True,
                      type="primary" if st.session_state.lang == "ja" else "secondary",
                      help="日本語"):
            st.session_state.lang = "ja"
            st.rerun()

    # Dark mode toggle
    dark_label = t("light_mode") if st.session_state.dark_mode else t("dark_mode")
    if st.button(f"{'☀️' if st.session_state.dark_mode else '🌙'} {dark_label}", use_container_width=True):
        st.session_state.dark_mode = not st.session_state.dark_mode
        st.rerun()

    st.markdown("---")

    # Home button
    home_selected = st.button(t("tool_home"), use_container_width=True, type="secondary")
    if home_selected:
        st.session_state.selected_tool = "tool_home"
        st.rerun()

    # Categorized tool list
    selected_tool = st.session_state.get("selected_tool", "tool_home")

    for cat_key, cat_tools in TOOL_CATEGORIES.items():
        st.markdown(f'<div class="category-header">{t(cat_key)}</div>', unsafe_allow_html=True)
        for tool_key in cat_tools:
            is_selected = selected_tool == tool_key
            if st.button(
                t(tool_key),
                key=f"sb_{tool_key}",
                use_container_width=True,
                type="primary" if is_selected else "secondary",
            ):
                st.session_state.selected_tool = tool_key
                st.rerun()

    st.markdown("---")

    # Usage stats
    st.markdown(f'<div class="stat-card"><h3>{st.session_state.usage_count}</h3><p>{t("usage_today")}</p></div>', unsafe_allow_html=True)

    st.markdown(f'<div class="security-badge">{t("security_notice")}</div>', unsafe_allow_html=True)

# ──────────────────────────────────────────────
# Header
# ──────────────────────────────────────────────

selected_tool = st.session_state.get("selected_tool", "tool_home")

st.markdown(
    f'<div class="hero"><h1>{t("app_title")}</h1><p>{t("app_subtitle")}</p></div>',
    unsafe_allow_html=True,
)


# ──────────────────────────────────────────────
# HOME DASHBOARD
# ──────────────────────────────────────────────

if selected_tool == "tool_home":
    st.markdown(f"### {t('home_welcome')}")
    st.markdown(t("home_desc"))

    st.markdown(f"#### {t('home_popular')}")

    popular = ["tool_unlock", "tool_merge", "tool_compress", "tool_split", "tool_to_image", "tool_protect"]
    cols = st.columns(3)
    for i, tool_key in enumerate(popular):
        with cols[i % 3]:
            label = t(tool_key)
            if st.button(label, key=f"home_{tool_key}", use_container_width=True):
                st.session_state.selected_tool = tool_key
                st.rerun()

    st.markdown("---")

    total_tools = sum(len(v) for v in TOOL_CATEGORIES.values())
    st.markdown(f"#### {t('home_all_tools', count=total_tools)}")

    for cat_key, cat_tools in TOOL_CATEGORIES.items():
        st.markdown(f"**{t(cat_key)}**")
        cols = st.columns(min(4, len(cat_tools)))
        for i, tool_key in enumerate(cat_tools):
            with cols[i % 4]:
                if st.button(t(tool_key), key=f"all_{tool_key}", use_container_width=True):
                    st.session_state.selected_tool = tool_key
                    st.rerun()

    # History
    st.markdown("---")
    st.markdown(f"#### {t('history_title')}")
    if st.session_state.history:
        for item in st.session_state.history[:10]:
            st.markdown(
                f'<div class="history-item"><span>{item["action"]} — {item["filename"]}'
                f'{" — " + item["details"] if item["details"] else ""}</span>'
                f'<span class="history-time">{item["time"]}</span></div>',
                unsafe_allow_html=True,
            )
    else:
        st.caption(t("history_empty"))


# ──────────────────────────────────────────────
# TOOL: Password Removal
# ──────────────────────────────────────────────

elif selected_tool == "tool_unlock":
    uploaded_file = st.file_uploader(t("upload_pdf"), type=["pdf"], key="unlock_upload")

    if uploaded_file:
        file_bytes = uploaded_file.read()
        st.info(t("file_info", name=uploaded_file.name, size=format_size(len(file_bytes))))

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

                    show_result_card_start()
                    st.success(t("success"))
                    show_stat_cards([
                        (format_size(len(file_bytes)), t("original_size")),
                        (format_size(len(result_bytes)), t("result_size")),
                    ])
                    st.download_button(
                        label=f"⬇️ {t('btn_download')} — {output_filename}",
                        data=result_bytes, file_name=output_filename,
                        mime="application/pdf", type="primary", use_container_width=True,
                    )
                    show_result_card_end()
                    add_to_history(t("tool_unlock"), uploaded_file.name)

                except pikepdf.PasswordError:
                    st.error(t("error_password"))
                except Exception as e:
                    st.error(t("error_general", error=str(e)))


# ──────────────────────────────────────────────
# TOOL: Password Protect
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
                    pdf.save(output, encryption=pikepdf.Encryption(owner=new_password, user=new_password, R=6))
                    pdf.close()
                    output.seek(0)
                    result_bytes = output.getvalue()

                    show_result_card_start()
                    st.success(t("success"))
                    output_name = uploaded_file.name.replace(".pdf", "_protected.pdf")
                    st.download_button(
                        label=f"⬇️ {t('btn_download')} — {output_name}",
                        data=result_bytes, file_name=output_name,
                        mime="application/pdf", type="primary", use_container_width=True,
                    )
                    show_result_card_end()
                    add_to_history(t("tool_protect"), uploaded_file.name)

                except Exception as e:
                    st.error(t("error_general", error=str(e)))


# ──────────────────────────────────────────────
# TOOL: Merge PDFs
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

                    show_result_card_start()
                    st.success(t("success"))
                    show_stat_cards([(format_size(len(result_bytes)), t("result_size"))])

                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    st.download_button(
                        label=f"⬇️ {t('btn_download')} — merged_{timestamp}.pdf",
                        data=result_bytes, file_name=f"merged_{timestamp}.pdf",
                        mime="application/pdf", type="primary", use_container_width=True,
                    )
                    show_result_card_end()
                    add_to_history(t("tool_merge"), f"{len(uploaded_files)} files")

                except Exception as e:
                    st.error(t("error_general", error=str(e)))


# ──────────────────────────────────────────────
# TOOL: Split PDF
# ──────────────────────────────────────────────

elif selected_tool == "tool_split":
    uploaded_file = st.file_uploader(t("upload_pdf"), type=["pdf"], key="split_upload")

    if uploaded_file:
        file_bytes = uploaded_file.read()
        src_pdf = pikepdf.open(io.BytesIO(file_bytes))
        total_pages = len(src_pdf.pages)
        st.info(t("file_info", name=uploaded_file.name, size=format_size(len(file_bytes))))
        st.markdown(t("total_pages", pages=total_pages))

        split_mode = st.radio(t("split_mode"), ["split_each", "split_range", "split_every_n"],
                              format_func=lambda x: t(x), horizontal=True)

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
                            result_files[uploaded_file.name.replace(".pdf", f"_page{i+1}.pdf")] = buf.getvalue()
                    elif split_mode == "split_range":
                        pages = parse_page_range(page_range_str, total_pages)
                        if pages:
                            new_pdf = pikepdf.Pdf.new()
                            for p in pages:
                                new_pdf.pages.append(src_pdf.pages[p])
                            buf = io.BytesIO()
                            new_pdf.save(buf)
                            new_pdf.close()
                            result_files[uploaded_file.name.replace(".pdf", "_extracted.pdf")] = buf.getvalue()
                    elif split_mode == "split_every_n":
                        for start in range(0, total_pages, n_pages):
                            end = min(start + n_pages, total_pages)
                            new_pdf = pikepdf.Pdf.new()
                            for p in range(start, end):
                                new_pdf.pages.append(src_pdf.pages[p])
                            buf = io.BytesIO()
                            new_pdf.save(buf)
                            new_pdf.close()
                            result_files[uploaded_file.name.replace(".pdf", f"_pages{start+1}-{end}.pdf")] = buf.getvalue()

                    src_pdf.close()
                    if result_files:
                        show_result_card_start()
                        st.success(t("success"))
                        if len(result_files) == 1:
                            name, data = next(iter(result_files.items()))
                            st.download_button(f"⬇️ {t('btn_download')} — {name}", data=data, file_name=name,
                                               mime="application/pdf", type="primary", use_container_width=True)
                        else:
                            st.markdown(t("files_generated", count=len(result_files)))
                            zip_data = create_zip(result_files)
                            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
                            st.download_button(f"⬇️ {t('btn_download_all')}", data=zip_data, file_name=f"split_{ts}.zip",
                                               mime="application/zip", type="primary", use_container_width=True)
                            with st.expander(t("individual_files")):
                                for name, data in result_files.items():
                                    st.download_button(f"⬇️ {name}", data=data, file_name=name,
                                                       mime="application/pdf", key=f"dl_{name}", use_container_width=True)
                        show_result_card_end()
                        add_to_history(t("tool_split"), uploaded_file.name, f"{len(result_files)} files")

                except Exception as e:
                    st.error(t("error_general", error=str(e)))


# ──────────────────────────────────────────────
# TOOL: Extract Pages
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
                        st.image(img, caption=f"Page {i+1}", use_container_width=True)
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

                    show_result_card_start()
                    st.success(t("success"))
                    st.markdown(t("extracted_pages", count=len(pages)))
                    output_name = uploaded_file.name.replace(".pdf", "_extracted.pdf")
                    st.download_button(f"⬇️ {t('btn_download')} — {output_name}", data=result_bytes,
                                       file_name=output_name, mime="application/pdf", type="primary", use_container_width=True)
                    show_result_card_end()
                    add_to_history(t("tool_extract_pages"), uploaded_file.name, f"{len(pages)} pages")

                except Exception as e:
                    st.error(t("error_general", error=str(e)))


# ──────────────────────────────────────────────
# TOOL: Delete Pages
# ──────────────────────────────────────────────

elif selected_tool == "tool_delete_pages":
    uploaded_file = st.file_uploader(t("upload_pdf"), type=["pdf"], key="delete_upload")

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
                        st.image(img, caption=f"Page {i+1}", use_container_width=True)
        except Exception:
            pass

        page_range_str = st.text_input(t("pages_to_delete"), help=t("page_range_help"))
        if page_range_str:
            st.warning(t("delete_warning"))

        if st.button(t("btn_delete"), type="primary", use_container_width=True, disabled=not page_range_str):
            with st.spinner(t("processing")):
                try:
                    pages_to_delete = set(parse_page_range(page_range_str, total_pages))
                    pages_to_keep = [i for i in range(total_pages) if i not in pages_to_delete]

                    new_pdf = pikepdf.Pdf.new()
                    for p in pages_to_keep:
                        new_pdf.pages.append(src_pdf.pages[p])
                    output = io.BytesIO()
                    new_pdf.save(output)
                    new_pdf.close()
                    src_pdf.close()
                    output.seek(0)
                    result_bytes = output.getvalue()

                    show_result_card_start()
                    st.success(t("success"))
                    st.markdown(t("deleted_pages", count=len(pages_to_delete)))
                    show_stat_cards([
                        (str(total_pages), t("original_size")),
                        (str(len(pages_to_keep)), t("result_size")),
                    ])
                    output_name = uploaded_file.name.replace(".pdf", "_trimmed.pdf")
                    st.download_button(f"⬇️ {t('btn_download')} — {output_name}", data=result_bytes,
                                       file_name=output_name, mime="application/pdf", type="primary", use_container_width=True)
                    show_result_card_end()
                    add_to_history(t("tool_delete_pages"), uploaded_file.name, f"-{len(pages_to_delete)} pages")

                except Exception as e:
                    st.error(t("error_general", error=str(e)))


# ──────────────────────────────────────────────
# TOOL: Reorder Pages
# ──────────────────────────────────────────────

elif selected_tool == "tool_reorder":
    uploaded_file = st.file_uploader(t("upload_pdf"), type=["pdf"], key="reorder_upload")

    if uploaded_file:
        file_bytes = uploaded_file.read()
        src_pdf = pikepdf.open(io.BytesIO(file_bytes))
        total_pages = len(src_pdf.pages)
        st.info(t("file_info", name=uploaded_file.name, size=format_size(len(file_bytes))))
        st.markdown(t("total_pages", pages=total_pages))
        st.markdown(t("reorder_desc"))

        default_order = ",".join(str(i) for i in range(1, total_pages + 1))
        new_order_str = st.text_input(t("new_order"), value=default_order, help=t("new_order_help"))

        # Preview thumbnails
        try:
            previews = get_pdf_preview(file_bytes, max_pages=min(8, total_pages))
            if previews:
                cols = st.columns(min(4, len(previews)))
                for i, img in enumerate(previews):
                    with cols[i % 4]:
                        st.image(img, caption=f"Page {i+1}", use_container_width=True)
        except Exception:
            pass

        if st.button(t("btn_reorder"), type="primary", use_container_width=True):
            with st.spinner(t("processing")):
                try:
                    order = [int(x.strip()) for x in new_order_str.split(",") if x.strip()]
                    if sorted(order) != list(range(1, total_pages + 1)):
                        st.error(t("reorder_error", total=total_pages))
                    else:
                        new_pdf = pikepdf.Pdf.new()
                        for page_num in order:
                            new_pdf.pages.append(src_pdf.pages[page_num - 1])
                        output = io.BytesIO()
                        new_pdf.save(output)
                        new_pdf.close()
                        src_pdf.close()
                        output.seek(0)
                        result_bytes = output.getvalue()

                        show_result_card_start()
                        st.success(t("success"))
                        output_name = uploaded_file.name.replace(".pdf", "_reordered.pdf")
                        st.download_button(f"⬇️ {t('btn_download')} — {output_name}", data=result_bytes,
                                           file_name=output_name, mime="application/pdf", type="primary", use_container_width=True)
                        show_result_card_end()
                        add_to_history(t("tool_reorder"), uploaded_file.name)

                except Exception as e:
                    st.error(t("error_general", error=str(e)))


# ──────────────────────────────────────────────
# TOOL: Rotate Pages
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
                    pages_to_rotate = list(range(total_pages)) if apply_to == t("rotate_all") else parse_page_range(page_range_str, total_pages)
                    for p in pages_to_rotate:
                        page = src_pdf.pages[p]
                        current = int(page.get("/Rotate", 0))
                        page["/Rotate"] = pikepdf.Name(str((current + angle) % 360))

                    output = io.BytesIO()
                    src_pdf.save(output)
                    src_pdf.close()
                    output.seek(0)
                    result_bytes = output.getvalue()

                    show_result_card_start()
                    st.success(t("success"))
                    try:
                        previews = get_pdf_preview(result_bytes, max_pages=2)
                        if previews:
                            cols = st.columns(len(previews))
                            for i, img in enumerate(previews):
                                with cols[i]:
                                    st.image(img, caption=f"Page {i+1}", use_container_width=True)
                    except Exception:
                        pass

                    output_name = uploaded_file.name.replace(".pdf", "_rotated.pdf")
                    st.download_button(f"⬇️ {t('btn_download')} — {output_name}", data=result_bytes,
                                       file_name=output_name, mime="application/pdf", type="primary", use_container_width=True)
                    show_result_card_end()
                    add_to_history(t("tool_rotate"), uploaded_file.name, f"{angle}°")

                except Exception as e:
                    st.error(t("error_general", error=str(e)))


# ──────────────────────────────────────────────
# TOOL: Compress PDF
# ──────────────────────────────────────────────

elif selected_tool == "tool_compress":
    uploaded_file = st.file_uploader(t("upload_pdf"), type=["pdf"], key="compress_upload")

    if uploaded_file:
        file_bytes = uploaded_file.read()
        st.info(t("file_info", name=uploaded_file.name, size=format_size(len(file_bytes))))

        compress_level = st.select_slider(
            t("compress_level"),
            options=["compress_low", "compress_medium", "compress_high"],
            format_func=lambda x: t(x), value="compress_medium",
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

                    show_result_card_start()
                    st.success(t("success"))
                    show_stat_cards([
                        (format_size(original_size), t("original_size")),
                        (format_size(result_size), t("result_size")),
                        (f"{ratio:.1f}%", t("compression_ratio")),
                    ])
                    if result_size < original_size:
                        output_name = uploaded_file.name.replace(".pdf", "_compressed.pdf")
                        st.download_button(f"⬇️ {t('btn_download')} — {output_name}", data=result_bytes,
                                           file_name=output_name, mime="application/pdf", type="primary", use_container_width=True)
                    else:
                        st.warning(t("already_optimized"))
                    show_result_card_end()
                    add_to_history(t("tool_compress"), uploaded_file.name, f"{ratio:.1f}%")

                except Exception as e:
                    st.error(t("error_general", error=str(e)))


# ──────────────────────────────────────────────
# TOOL: PDF to Image
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
                        ext = "jpg" if img_format.lower() == "jpeg" else img_format.lower()
                        result_files[uploaded_file.name.replace(".pdf", f"_page{page_num+1}.{ext}")] = buf.getvalue()
                        progress_bar.progress((idx + 1) / len(pages))

                    src_pdf.close()
                    progress_bar.empty()

                    show_result_card_start()
                    st.success(t("success"))
                    if len(result_files) == 1:
                        name, data = next(iter(result_files.items()))
                        st.image(data, caption=name, use_container_width=True)
                        st.download_button(f"⬇️ {t('btn_download')} — {name}", data=data, file_name=name,
                                           mime=f"image/{img_format.lower()}", type="primary", use_container_width=True)
                    else:
                        preview_items = list(result_files.items())[:3]
                        cols = st.columns(len(preview_items))
                        for i, (name, data) in enumerate(preview_items):
                            with cols[i]:
                                st.image(data, caption=name, use_container_width=True)
                        zip_data = create_zip(result_files)
                        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
                        st.download_button(f"⬇️ {t('btn_download_all')} ({len(result_files)} files)",
                                           data=zip_data, file_name=f"images_{ts}.zip",
                                           mime="application/zip", type="primary", use_container_width=True)
                    show_result_card_end()
                    add_to_history(t("tool_to_image"), uploaded_file.name, f"{len(result_files)} images")

                except Exception as e:
                    st.error(t("error_general", error=str(e)))


# ──────────────────────────────────────────────
# TOOL: Image to PDF
# ──────────────────────────────────────────────

elif selected_tool == "tool_image_to_pdf":
    uploaded_files = st.file_uploader(t("upload_images"),
                                       type=["png", "jpg", "jpeg", "webp", "bmp", "tiff"],
                                       accept_multiple_files=True, key="img2pdf_upload")

    if uploaded_files:
        st.info(t("files_count", count=len(uploaded_files)))
        for i, f in enumerate(uploaded_files):
            st.markdown(f"**{i+1}.** {f.name} ({format_size(f.size)})")

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

                    show_result_card_start()
                    st.success(t("success"))
                    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
                    st.download_button(f"⬇️ {t('btn_download')} — images_to_pdf_{ts}.pdf",
                                       data=result_bytes, file_name=f"images_to_pdf_{ts}.pdf",
                                       mime="application/pdf", type="primary", use_container_width=True)
                    show_result_card_end()
                    add_to_history(t("tool_image_to_pdf"), f"{len(uploaded_files)} images")

                except Exception as e:
                    st.error(t("error_general", error=str(e)))


# ──────────────────────────────────────────────
# TOOL: Add Watermark
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
                    r, g, b = int(hex_color[0:2], 16)/255, int(hex_color[2:4], 16)/255, int(hex_color[4:6], 16)/255

                    for page in doc:
                        rect = page.rect
                        text_point = fitz.Point(rect.width / 4, rect.height * 2 / 3)
                        page.insert_text(text_point, watermark_text, fontsize=font_size,
                                         color=(r, g, b), rotate=45, overlay=True, opacity=opacity)

                    output = io.BytesIO()
                    doc.save(output)
                    doc.close()
                    output.seek(0)
                    result_bytes = output.getvalue()

                    show_result_card_start()
                    st.success(t("success"))
                    previews = get_pdf_preview(result_bytes, max_pages=1)
                    if previews:
                        st.image(previews[0], caption=t("preview"), use_container_width=True)
                    output_name = uploaded_file.name.replace(".pdf", "_watermarked.pdf")
                    st.download_button(f"⬇️ {t('btn_download')} — {output_name}", data=result_bytes,
                                       file_name=output_name, mime="application/pdf", type="primary", use_container_width=True)
                    show_result_card_end()
                    add_to_history(t("tool_watermark"), uploaded_file.name)

                except Exception as e:
                    st.error(t("error_general", error=str(e)))


# ──────────────────────────────────────────────
# TOOL: Add Page Numbers
# ──────────────────────────────────────────────

elif selected_tool == "tool_page_numbers":
    uploaded_file = st.file_uploader(t("upload_pdf"), type=["pdf"], key="pagenum_upload")

    if uploaded_file:
        file_bytes = uploaded_file.read()
        st.info(t("file_info", name=uploaded_file.name, size=format_size(len(file_bytes))))

        col1, col2 = st.columns(2)
        with col1:
            position_options = {
                "pos_bottom_center": "bottom_center",
                "pos_bottom_left": "bottom_left",
                "pos_bottom_right": "bottom_right",
                "pos_top_center": "top_center",
                "pos_top_left": "top_left",
                "pos_top_right": "top_right",
            }
            pos_key = st.selectbox(t("number_position"),
                                   list(position_options.keys()), format_func=lambda x: t(x))
            position = position_options[pos_key]
        with col2:
            fmt_options = {"fmt_number": "number", "fmt_dash": "dash", "fmt_page_of": "page_of"}
            fmt_key = st.selectbox(t("number_format"), list(fmt_options.keys()), format_func=lambda x: t(x))
            number_fmt = fmt_options[fmt_key]

        col3, col4, col5 = st.columns(3)
        with col3:
            start_num = st.number_input(t("number_start"), min_value=1, value=1)
        with col4:
            num_font_size = st.number_input(t("number_font_size"), min_value=6, max_value=36, value=11)
        with col5:
            skip_first = st.checkbox(t("skip_first"))

        if st.button(t("btn_add_numbers"), type="primary", use_container_width=True):
            with st.spinner(t("processing")):
                try:
                    doc = fitz.open(stream=file_bytes, filetype="pdf")
                    total = len(doc)
                    margin = 36  # 0.5 inch

                    for i, page in enumerate(doc):
                        if skip_first and i == 0:
                            continue
                        num = start_num + (i - 1 if skip_first else i)
                        rect = page.rect

                        if number_fmt == "number":
                            text = str(num)
                        elif number_fmt == "dash":
                            text = f"- {num} -"
                        else:
                            text = f"{num} / {total}"

                        # Calculate position
                        if "bottom" in position:
                            y = rect.height - margin
                        else:
                            y = margin
                        if "center" in position:
                            x = rect.width / 2
                        elif "left" in position:
                            x = margin
                        else:
                            x = rect.width - margin

                        align = 1 if "center" in position else (0 if "left" in position else 2)
                        tw = fitz.TextWriter(page.rect)
                        font = fitz.Font("helv")
                        text_width = font.text_length(text, fontsize=num_font_size)

                        if align == 1:
                            x -= text_width / 2
                        elif align == 2:
                            x -= text_width

                        tw.append((x, y), text, font=font, fontsize=num_font_size)
                        tw.write_text(page, color=(0.3, 0.3, 0.3))

                    output = io.BytesIO()
                    doc.save(output)
                    doc.close()
                    output.seek(0)
                    result_bytes = output.getvalue()

                    show_result_card_start()
                    st.success(t("success"))
                    previews = get_pdf_preview(result_bytes, max_pages=2)
                    if previews:
                        cols = st.columns(len(previews))
                        for i, img in enumerate(previews):
                            with cols[i]:
                                st.image(img, caption=f"Page {i+1}", use_container_width=True)

                    output_name = uploaded_file.name.replace(".pdf", "_numbered.pdf")
                    st.download_button(f"⬇️ {t('btn_download')} — {output_name}", data=result_bytes,
                                       file_name=output_name, mime="application/pdf", type="primary", use_container_width=True)
                    show_result_card_end()
                    add_to_history(t("tool_page_numbers"), uploaded_file.name)

                except Exception as e:
                    st.error(t("error_general", error=str(e)))


# ──────────────────────────────────────────────
# TOOL: Extract Text
# ──────────────────────────────────────────────

elif selected_tool == "tool_text_extract":
    uploaded_file = st.file_uploader(t("upload_pdf"), type=["pdf"], key="text_upload")

    if uploaded_file:
        file_bytes = uploaded_file.read()
        st.info(t("file_info", name=uploaded_file.name, size=format_size(len(file_bytes))))

        if st.button(t("btn_extract_text"), type="primary", use_container_width=True):
            with st.spinner(t("processing")):
                try:
                    doc = fitz.open(stream=file_bytes, filetype="pdf")
                    all_text = ""
                    progress_bar = st.progress(0)

                    for i, page in enumerate(doc):
                        text = page.get_text()
                        if text.strip():
                            all_text += f"{'='*40}\nPage {i+1}\n{'='*40}\n{text}\n\n"
                        progress_bar.progress((i + 1) / len(doc))

                    doc.close()
                    progress_bar.empty()

                    show_result_card_start()
                    st.success(t("success"))
                    st.markdown(t("text_pages_extracted", count=len(doc)))
                    st.markdown(t("text_char_count", count=len(all_text)))

                    st.text_area(t("extracted_text"), value=all_text, height=400)

                    st.download_button(
                        f"⬇️ {t('download_txt')}",
                        data=all_text.encode("utf-8"),
                        file_name=uploaded_file.name.replace(".pdf", "_text.txt"),
                        mime="text/plain", type="primary", use_container_width=True,
                    )
                    show_result_card_end()
                    add_to_history(t("tool_text_extract"), uploaded_file.name, f"{len(all_text)} chars")

                except Exception as e:
                    st.error(t("error_general", error=str(e)))


# ──────────────────────────────────────────────
# TOOL: Edit Metadata
# ──────────────────────────────────────────────

elif selected_tool == "tool_metadata":
    uploaded_file = st.file_uploader(t("upload_pdf"), type=["pdf"], key="meta_upload")

    if uploaded_file:
        file_bytes = uploaded_file.read()
        st.info(t("file_info", name=uploaded_file.name, size=format_size(len(file_bytes))))

        meta = get_pdf_metadata(file_bytes)

        st.markdown(f"#### {t('meta_current')}")
        for key in ["title", "author", "subject", "keywords", "creator", "producer", "creationDate", "modDate"]:
            label_key = f"meta_{key}" if key in ["title", "author", "subject", "keywords", "creator", "producer"] else ("meta_creation_date" if key == "creationDate" else "meta_mod_date")
            st.markdown(f"**{t(label_key)}:** {meta.get(key, '-') or '-'}")

        st.markdown("---")
        st.markdown(f"#### {t('meta_edit')}")

        new_title = st.text_input(t("meta_title"), value=meta.get("title", ""))
        new_author = st.text_input(t("meta_author"), value=meta.get("author", ""))
        new_subject = st.text_input(t("meta_subject"), value=meta.get("subject", ""))
        new_keywords = st.text_input(t("meta_keywords"), value=meta.get("keywords", ""))

        if st.button(t("btn_save_metadata"), type="primary", use_container_width=True):
            with st.spinner(t("processing")):
                try:
                    doc = fitz.open(stream=file_bytes, filetype="pdf")
                    doc.set_metadata({
                        "title": new_title,
                        "author": new_author,
                        "subject": new_subject,
                        "keywords": new_keywords,
                        "creator": meta.get("creator", ""),
                        "producer": "PDF Tools Pro",
                    })

                    output = io.BytesIO()
                    doc.save(output)
                    doc.close()
                    output.seek(0)
                    result_bytes = output.getvalue()

                    show_result_card_start()
                    st.success(t("success"))
                    output_name = uploaded_file.name.replace(".pdf", "_meta.pdf")
                    st.download_button(f"⬇️ {t('btn_download')} — {output_name}", data=result_bytes,
                                       file_name=output_name, mime="application/pdf", type="primary", use_container_width=True)
                    show_result_card_end()
                    add_to_history(t("tool_metadata"), uploaded_file.name)

                except Exception as e:
                    st.error(t("error_general", error=str(e)))


# ──────────────────────────────────────────────
# TOOL: PDF Analysis / Info
# ──────────────────────────────────────────────

elif selected_tool == "tool_pdf_info":
    uploaded_file = st.file_uploader(t("upload_pdf"), type=["pdf"], key="info_upload")

    if uploaded_file:
        file_bytes = uploaded_file.read()
        st.info(t("file_info", name=uploaded_file.name, size=format_size(len(file_bytes))))

        with st.spinner(t("processing")):
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            meta = doc.metadata

            # Basic info
            st.markdown(f"#### {t('info_basic')}")
            show_stat_cards([
                (str(len(doc)), t("info_pages")),
                (format_size(len(file_bytes)), t("info_size")),
            ])

            if len(doc) > 0:
                page0 = doc[0]
                rect = page0.rect
                w_mm = rect.width * 25.4 / 72
                h_mm = rect.height * 25.4 / 72
                st.markdown(f"**{t('info_dimensions')}:** {w_mm:.0f} x {h_mm:.0f} mm ({rect.width:.0f} x {rect.height:.0f} pt)")

            st.markdown(f"**{t('info_version')}:** {meta.get('format', 'N/A')}")
            encrypted = meta.get("encryption", "")
            st.markdown(f"**{t('info_encrypted')}:** {t('info_yes') if encrypted else t('info_no')}")

            # Preview
            try:
                previews = get_pdf_preview(file_bytes, max_pages=min(4, len(doc)))
                if previews:
                    cols = st.columns(len(previews))
                    for i, img in enumerate(previews):
                        with cols[i]:
                            st.image(img, caption=f"Page {i+1}", use_container_width=True)
            except Exception:
                pass

            # Page-by-page analysis
            st.markdown("---")
            st.markdown(f"#### {t('info_page_details')}")

            total_images = 0
            total_chars = 0
            page_data = []

            for i in range(len(doc)):
                page = doc[i]
                rect = page.rect
                w_mm = rect.width * 25.4 / 72
                h_mm = rect.height * 25.4 / 72
                text = page.get_text()
                images = page.get_images(full=True)
                total_images += len(images)
                total_chars += len(text)
                page_data.append({
                    t("info_page_num"): i + 1,
                    t("info_page_size"): f"{w_mm:.0f}x{h_mm:.0f}",
                    t("info_page_rotation"): str(page.rotation),
                    t("info_images"): len(images),
                    t("info_text_length"): len(text),
                })

            st.dataframe(page_data, use_container_width=True, hide_index=True)

            # Summary
            st.markdown("---")
            st.markdown(f"#### {t('info_analysis')}")
            show_stat_cards([
                (str(total_images), t("info_total_images")),
                (f"{total_chars:,}", t("info_total_chars")),
            ])

            doc.close()
            add_to_history(t("tool_pdf_info"), uploaded_file.name)


# ──────────────────────────────────────────────
# Footer
# ──────────────────────────────────────────────

st.markdown(f'<div class="footer">{t("footer")} &copy; {datetime.now().year}</div>', unsafe_allow_html=True)
