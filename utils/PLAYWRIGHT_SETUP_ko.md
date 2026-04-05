# Playwright 설치 가이드

## 🎯 모든 환경에서 작동하는 설치 방법

MarketPulse는 PDF 생성을 위해 Playwright (Chromium 브라우저)를 사용합니다.

---

## 📦 자동 설치 (권장)

첫 실행 시 자동으로 브라우저를 다운로드하려고 시도합니다.

```bash
# 그냥 실행하면 자동으로 설치 시도
python3 stock_analysis_orchestrator.py --mode afternoon
```

---

## 🔧 수동 설치

자동 설치가 실패하면 수동으로 설치하세요.

### 방법 1: 설치 스크립트 사용 (Mac/Linux)

```bash
cd utils
chmod +x setup_playwright.sh
./setup_playwright.sh
```

### 방법 2: 직접 명령어 실행

```bash
# Playwright 패키지 설치
pip install playwright

# Chromium 브라우저 다운로드
python3 -m playwright install chromium
```

### 방법 3: 시스템 의존성 포함 (Linux 서버)

```bash
# Chromium과 필요한 시스템 라이브러리까지 설치
python3 -m playwright install --with-deps chromium
```

---

## 🐳 Docker 환경

Docker에서는 **자동으로 설치**됩니다. 아무 작업도 필요 없습니다!

```bash
# Docker 빌드 시 자동 설치됨
docker-compose build

# 컨테이너 실행
docker-compose up -d
```

---

## 🖥️ 환경별 설치 가이드

### macOS (로컬 개발)

```bash
# Homebrew로 Python 설치 (선택사항)
brew install python3

# Playwright 설치
pip3 install playwright
python3 -m playwright install chromium
```

### Rocky Linux 8 (운영 서버)

```bash
# Python 3.9+ 필요
sudo dnf install python39

# Playwright 설치
pip3 install playwright
python3 -m playwright install --with-deps chromium
```

### Ubuntu 24.04 (Docker 또는 로컬)

```bash
# Python 3.12 이미 포함
pip install playwright
python3 -m playwright install --with-deps chromium
```

### Windows (WSL2)

```bash
# WSL2 Ubuntu에서
sudo apt update
sudo apt install python3-pip
pip3 install playwright
python3 -m playwright install chromium
```

---

## ✅ 설치 확인

### 테스트 명령어

```bash
# Python에서 확인
python3 -c "from playwright.sync_api import sync_playwright; print('✅ Playwright OK')"

# 브라우저 버전 확인
python3 -m playwright --version
```

### PDF 변환 테스트

```python
from pdf_converter import markdown_to_pdf

# 간단한 테스트
with open('test.md', 'w') as f:
    f.write('# 테스트 보고서\n\n이것은 테스트입니다.')

markdown_to_pdf('test.md', 'test.pdf', method='playwright')
print('✅ PDF 생성 성공!')
```

---

## 🔍 문제 해결

### 에러: "Executable doesn't exist"

**원인**: Chromium 브라우저가 다운로드되지 않음

**해결**:
```bash
python3 -m playwright install chromium
```

### 에러: "Playwright library is not installed"

**원인**: playwright 패키지가 설치되지 않음

**해결**:
```bash
pip install playwright
```

### 에러: "Missing dependencies" (Linux)

**원인**: 시스템 라이브러리 부족

**해결**:
```bash
# Ubuntu/Debian
sudo apt-get install -y \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2

# Rocky/RHEL
sudo dnf install -y \
    nss nspr atk at-spi2-atk cups-libs libdrm libxkbcommon \
    libXcomposite libXdamage libXfixes libXrandr mesa-libgbm alsa-lib
```

### Docker에서 실행 안됨

**확인사항**:
1. Dockerfile에 `playwright install --with-deps chromium` 있는지 확인
2. 이미지 재빌드: `docker-compose build --no-cache`

---

## 📊 브라우저 크기 및 저장 위치

- **다운로드 크기**: ~150-200MB
- **설치 위치**:
  - **macOS**: `~/Library/Caches/ms-playwright/`
  - **Linux**: `~/.cache/ms-playwright/`
  - **Windows**: `%USERPROFILE%\AppData\Local\ms-playwright\`

---

## 🎉 완료!

이제 PDF 생성 기능을 사용할 수 있습니다:

```bash
python3 stock_analysis_orchestrator.py --mode afternoon
```

궁금한 점이 있으면 이슈를 등록해주세요!
