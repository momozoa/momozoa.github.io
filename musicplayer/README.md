# Music Player

## 개요
- HTML5/JS 기반의 미니멀 음악 플레이어
- 플레이리스트, 곡 넘김/반복/정지, 볼륨/음소거, 실시간 비주얼라이저, 글래스모피즘 UI

## 주요 파일
- index.html: 메인 UI
- main.js: 오디오/플레이리스트/비주얼라이저 로직
- style.css: 글래스모피즘/네온 UI 스타일
- docs/: 설계 및 구현 문서

## UI/UX
- SVG 아이콘 기반 컨트롤(재생/정지/이전/다음/볼륨/음소거)
- 곡 정보, 진행 바, 볼륨 슬라이더, 플레이리스트(현재 곡 selected 강조)
- 실시간 Web Audio API 비주얼라이저(막대, glow, 평탄화)
- Glassmorphism/Neon 스타일 적용

## 사용법
1. index.html 또는 루트 index.html의 Music Player 버튼 클릭
2. 곡 선택 및 재생/정지/이동/반복/볼륨 조절 등 사용
3. 플레이리스트에서 현재 곡은 selected 효과로 강조됨

## 최근 업데이트
- 플레이리스트 selected/hover 효과 통일
- 플레이 버튼 SVG 중앙 정렬
- 스크롤바/불릿/간격/팝업 크기 등 UI 개선
- CSS 구조 표준화 및 중복 제거

## 참고
- 자세한 설계/구현/테스트: docs/implementation_plan.md, docs/walkthrough.md
