import streamlit as st
import pikepdf
import io

st.set_page_config(
    page_title="PDF Password Remover",
    page_icon="🔓",
    layout="centered",
)

st.title("PDF Password Remover")
st.markdown("암호가 걸린 PDF 파일을 업로드하고 비밀번호를 입력하면, 암호가 해제된 PDF를 다운로드할 수 있습니다.")

uploaded_file = st.file_uploader(
    "PDF 파일을 드래그 앤 드롭하거나 클릭하여 업로드하세요",
    type=["pdf"],
)

if uploaded_file is not None:
    st.info(f"업로드된 파일: **{uploaded_file.name}** ({uploaded_file.size / 1024:.1f} KB)")

    password = st.text_input("PDF 비밀번호를 입력하세요", type="password")

    if st.button("암호 해제", type="primary", disabled=not password):
        try:
            pdf = pikepdf.open(io.BytesIO(uploaded_file.read()), password=password)
            output = io.BytesIO()
            pdf.save(output)
            pdf.close()
            output.seek(0)

            output_filename = uploaded_file.name.replace(".pdf", "_unlocked.pdf")

            st.success("암호가 성공적으로 해제되었습니다!")
            st.download_button(
                label="암호 해제된 PDF 다운로드",
                data=output,
                file_name=output_filename,
                mime="application/pdf",
                type="primary",
            )
        except pikepdf.PasswordError:
            st.error("비밀번호가 올바르지 않습니다. 다시 확인해주세요.")
        except Exception as e:
            st.error(f"PDF 처리 중 오류가 발생했습니다: {e}")
