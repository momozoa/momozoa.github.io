# 프로젝트 구조

이 프로젝트는 여러 미니 앱들을 포함하는 모노레포입니다 (runningmate, bit-dashboard, snp500 등).

# 아티팩트 저장 규칙

- 특정 미니 앱 작업 시 (예: runningmate), 해당 앱의 `docs/` 폴더에 아티팩트 저장
- 예시: `runningmate/docs/task.md`, `runningmate/docs/walkthrough.md`
- 현재 작업 중인 앱은 편집 중인 파일을 기준으로 판단
- 루트 레벨 파일(index.html) 작업 시에는 루트의 `docs/` 폴더 사용

# 문서 작성 규칙

- 모든 아티팩트 문서는 **한글**로 작성
- task.md, implementation_plan.md, walkthrough.md 모두 한글 사용
- 코드 주석이나 변수명은 영어 사용 가능

# 자동화 및 동기화 규칙

- 모든 작업 진행 상황은 각 미니 앱의 docs/task.md 파일과 항상 동기화한다.
	(내부 todo 상태가 변경될 때마다 task.md 체크박스도 자동으로 반영)
