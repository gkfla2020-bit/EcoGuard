# EcoTrade 개발 대화 로그

## 프로젝트 정보
- **이름**: EcoTrade
- **팀**: 유니하나
- **목적**: EUDR·CBAM 컴플라이언스 플랫폼 (단독 SaaS)
- **위치**: ~/Desktop/esg-tradeguard

---

## 핵심 결정사항

### 1. GAN → CNN으로 전환
- GAN은 이미지 "생성"에 집중된 모델로, EUDR 산림전용 검증에는 CNN이 더 적합
- **판정 엔진: CNN (U-Net segmentation + Grad-CAM)**
- GAN은 보조 역할 (Review 케이스에서만)
- 선배(안지홍) 피드백: "CNN의 CAM을 응용한 거라서 CNN쪽으로 가면 논문 주장이 더 강함"

### 2. 디자인
- **Borealis 스타일** (v1-precision.jsx 참조)
- 흰 배경, hairline 보더(#E4E4E7), 잉크 블랙 단일 액센트(#0A0A0A)
- Inter Tight(헤딩) + Inter(본문) + JetBrains Mono(데이터)
- 좌측 사이드바 (220px)

### 3. 위성 데이터
- **Sentinel-2 Cloudless (EOX)** — 년도별 무료 WMS
- 현재 지역: Central Kalimantan, Indonesia (팜유 전환 지역)
- bbox: `111.75,-2.55,111.83,-2.47`
- 2019~2023 실제 다운로드, 2024=2023 복사

### 4. CNN 분석 구조
- 원본 위성사진 (좌) | CNN Segmentation 또는 Grad-CAM (우)
- 년도별 전환 가능 + 타임라인 자동 재생 (3초 간격)
- NDVI 그래프 (Recharts AreaChart)
- 통계: Forest/Farmland/Bare/Urban + Verdict

---

## 기술 스택
- React 18 + TypeScript
- Tailwind CSS
- Recharts (NDVI 그래프)
- Python (이미지 생성): scipy, PIL, numpy
- Vite 6

## 디렉토리 구조
```
~/Desktop/esg-tradeguard/
├── src/
│   ├── App.tsx              (메인 — 사이드바 + 라우팅)
│   ├── components/steps/
│   │   └── Step5Satellite.tsx  (위성 검증 — CNN + NDVI)
│   └── styles/index.css
├── public/satellite/
│   ├── orig_2019~2024.png   (실제 Sentinel-2 위성사진)
│   ├── seg_2019~2024.png    (CNN segmentation 결과)
│   ├── overlay_2019~2024.png (Grad-CAM overlay)
│   └── gan_generated.png    (GAN 보조 — 미사용)
├── generate_gan.py          (GAN 이미지 생성 — ControlNet+SD1.5)
├── generate_cnn.py          (CNN segmentation 생성)
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## 실행 방법
```bash
cd ~/Desktop/esg-tradeguard
npm run dev
# http://localhost:5190/
```

## 이미지 재생성
```bash
python3 generate_cnn.py   # CNN segmentation + Grad-CAM
python3 generate_gan.py   # GAN (보조, 선택)
```

---

## 참조 프로젝트
1. **기존 프로토타입**: `/Users/djajagggjg/서울경제신문/esg-tradeguard-prototype`
   - 하나금융 플랫폼 위 → 이번엔 단독 SaaS
   - Step1~6 워크플로우, Tailwind, framer-motion
2. **eudr-dashboard**: `~/Desktop/eudr-dashboard`
   - Leaflet 위성 비교, NDVI 차트
3. **디자인 템플릿**: `/Users/djajagggjg/Downloads/리액트/v1-precision.jsx`
   - Borealis 스타일 — Linear/Vercel급 미니멀
4. **HiGAN 참조**: https://soccz.github.io/projects/higan/
   - GAN saliency 시각화 (보라/마젠타 히트맵)

---

## 선배 피드백 요약 (안지홍)

> "GAN을 쓰려면 최소한 기존 이미지를 기반으로 새로운 이미지를 도출하는 과정이 있어야 합니다."

> "CNN이 더 가볍고 편하긴 합니다. 애초에 CNN에 있는 CAM을 응용한거라서 CNN쪽으로 가면 오히려 더 논문 주장은 강해요."

> "19년도 이미지랑 26년도 이미지 차이를 보는게 좀 더 맞는 방법이라고 보입니다. CNN쪽으로요."

### 최종 방향
- **산업용이면 CNN이 주력, GAN은 보조**
- 판정 엔진: CNN 80%, GIS/지수 기반 rule 15%, GAN 5%
- EUDR은 감사 가능성, 재현성, 설명 가능한 리포트가 중요

---

## TODO (남은 작업)
- [ ] Step 1~4 구현 (서류접수, OCR, 규제심사, CBAM)
- [ ] 실제 훼손 변화가 눈에 보이는 위성사진 지역 선정
- [ ] CNN segmentation 정확도 개선 (현재는 RGB 기반 근사)
- [ ] Grad-CAM 시각화 개선
- [ ] DDS 보고서 생성 기능
- [ ] 발표 시연용 자동 데모 모드
