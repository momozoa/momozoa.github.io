# 러닝메이트 개선: Wake Lock 강화 및 사용자 안내

## 사용자 검토 필요 사항

> [!NOTE]
> 도움말 버튼을 추가하여 "화면이 켜져 있어야 하는 이유"를 사용자에게 설명합니다. 배터리 소모에 대한 안내가 포함됩니다.

## 변경 사항

### 러닝메이트 앱

#### [수정] [main.js](file:///e:/Work/_homepage/momozoa.github.io/runningmate/main.js)
- `document.addEventListener('visibilitychange', ...)` 추가하여 Wake Lock 재요청
- 페이지로 돌아왔을 때 자동으로 Wake Lock 재연결
- 추적 중일 때만 Wake Lock 활성화

#### [수정] [index.html](file:///e:/Work/_homepage/momozoa.github.io/runningmate/index.html)
- 컨트롤 헤더에 `?` 도움말 버튼 추가
- 설명 텍스트를 위한 모달 구조 추가

#### [수정] [style.css](file:///e:/Work/_homepage/momozoa.github.io/runningmate/style.css)
- 도움말 버튼 스타일 (원형, 물음표)
- 모달 스타일 (중앙 정렬, 오버레이)

## 검증 계획

### 수동 검증
1. **재연결 테스트**:
    - 추적 시작
    - 다른 탭/앱으로 전환 (백그라운드 시뮬레이션)
    - 러닝메이트로 복귀
    - 상태 텍스트 확인: "화면 켜짐 유지 중" (재연결됨)
2. **UI 테스트**:
    - '?' 버튼 클릭
    - 모달 표시 확인
    - 모달 닫기
