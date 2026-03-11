"""Utility functions for PDF Tools Pro."""
import io
import zipfile
import streamlit as st
from PIL import Image
import fitz  # PyMuPDF
from datetime import datetime


def t(key, **kwargs):
    """Get translation for current language."""
    from translations import TRANSLATIONS
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
    """Parse page range string like '1-3, 5, 7-10' into 0-indexed page numbers."""
    pages = []
    parts = page_range_str.replace(" ", "").split(",")
    for part in parts:
        if not part:
            continue
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


def add_to_history(action, filename, details=""):
    """Add an action to the processing history."""
    if "history" not in st.session_state:
        st.session_state.history = []
    st.session_state.history.insert(0, {
        "time": datetime.now().strftime("%H:%M:%S"),
        "action": action,
        "filename": filename,
        "details": details,
    })
    # Keep last 50
    st.session_state.history = st.session_state.history[:50]
    # Increment usage counter
    if "usage_count" not in st.session_state:
        st.session_state.usage_count = 0
    st.session_state.usage_count += 1


def get_pdf_metadata(pdf_bytes):
    """Extract metadata from PDF."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    meta = doc.metadata
    info = {
        "pages": len(doc),
        "title": meta.get("title", ""),
        "author": meta.get("author", ""),
        "subject": meta.get("subject", ""),
        "keywords": meta.get("keywords", ""),
        "creator": meta.get("creator", ""),
        "producer": meta.get("producer", ""),
        "creationDate": meta.get("creationDate", ""),
        "modDate": meta.get("modDate", ""),
        "format": meta.get("format", ""),
        "encryption": meta.get("encryption", ""),
    }
    # Get page dimensions
    if len(doc) > 0:
        page = doc[0]
        rect = page.rect
        info["width_pt"] = rect.width
        info["height_pt"] = rect.height
        info["width_mm"] = rect.width * 25.4 / 72
        info["height_mm"] = rect.height * 25.4 / 72
    doc.close()
    return info


def show_result_card_start():
    st.markdown('<div class="result-card">', unsafe_allow_html=True)


def show_result_card_end():
    st.markdown("</div>", unsafe_allow_html=True)


def show_stat_cards(stats):
    """Show stat cards. stats = list of (value, label) tuples."""
    cols = st.columns(len(stats))
    for i, (value, label) in enumerate(stats):
        with cols[i]:
            st.markdown(
                f'<div class="stat-card"><h3>{value}</h3><p>{label}</p></div>',
                unsafe_allow_html=True,
            )
