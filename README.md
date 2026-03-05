# 🔐 PDF Toolkit Pro

PDF 파일을 위한 올인원 웹 도구입니다. 암호 해제부터 병합, 분할, 회전까지 — 브라우저에서 간편하게 처리하세요.

> 모든 파일 처리는 서버 메모리에서 이루어지며, 별도로 저장되지 않습니다.

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🔓 **암호 해제** | 비밀번호가 걸린 PDF의 암호를 제거합니다 (일괄 처리 지원) |
| 🔒 **암호 설정** | PDF에 소유자/열람 비밀번호를 설정합니다 |
| 📋 **PDF 병합** | 여러 PDF 파일을 하나로 합칩니다 |
| ✂️ **PDF 분할** | 페이지 범위별 분할 또는 전체 개별 분할 |
| 📄 **페이지 추출** | 원하는 페이지만 골라 새 PDF를 만듭니다 |
| 🔄 **페이지 회전** | 전체 또는 특정 페이지를 90°/180°/270° 회전 |
| ℹ️ **PDF 정보** | 페이지 수, 파일 크기, 메타데이터 확인 |

## 🚀 실행 방법

### 요구사항

- Python 3.9+

### 설치 및 실행

```bash
# 의존성 설치
pip install -r requirements.txt

# 앱 실행
streamlit run app.py
```

브라우저에서 `http://localhost:8501` 으로 접속합니다.

## 📦 기술 스택

- **[Streamlit](https://streamlit.io/)** — 웹 UI 프레임워크
- **[pikepdf](https://pikepdf.readthedocs.io/)** — PDF 처리 라이브러리 (QPDF 기반)

## 📁 프로젝트 구조

```
.
├── app.py                 # 메인 애플리케이션
├── requirements.txt       # Python 의존성
├── keep_alive.py          # Streamlit Cloud 슬립 방지 스크립트
└── .streamlit/
    └── config.toml        # Streamlit 설정 (업로드 제한, 테마)
```

## ⚙️ 설정

`.streamlit/config.toml` 에서 다음 항목을 조정할 수 있습니다:

- `maxUploadSize` — 최대 업로드 파일 크기 (기본 200MB)
- 테마 색상

## 📄 License

MIT
