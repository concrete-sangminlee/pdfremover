"""
Streamlit Cloud 슬립 방지 스크립트.

Streamlit Community Cloud는 일정 시간 사용하지 않으면 앱을 슬립 모드로 전환합니다.
이 스크립트를 별도로 실행하면 주기적으로 앱에 HTTP 요청을 보내 활성 상태를 유지합니다.

사용법:
    python keep_alive.py --url https://your-app.streamlit.app --interval 300
"""

import argparse
import time
import urllib.request
import urllib.error
from datetime import datetime


def ping(url):
    try:
        req = urllib.request.Request(url, method="HEAD")
        resp = urllib.request.urlopen(req, timeout=15)
        status = resp.status
    except urllib.error.HTTPError as e:
        status = e.code
    except Exception as e:
        print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] ERROR: {e}")
        return

    print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] Ping {url} -> {status}")


def main():
    parser = argparse.ArgumentParser(description="Streamlit 앱 슬립 방지 핑")
    parser.add_argument("--url", required=True, help="Streamlit 앱 URL")
    parser.add_argument("--interval", type=int, default=300, help="핑 간격 (초, 기본 300)")
    args = parser.parse_args()

    print(f"Keep-alive 시작: {args.url} (매 {args.interval}초)")
    while True:
        ping(args.url)
        time.sleep(args.interval)


if __name__ == "__main__":
    main()
