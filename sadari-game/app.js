// Modern Interactive Sadari (Ladder) Game JS

// ==========================================
// 1. Global State & Constants
// ==========================================
const SVG_WIDTH = 1000;
const SVG_HEIGHT = 440;
const Y_START = 30;
const Y_END = 410;
const NUM_LEVELS = 12; // 사다리 가로선 배치 후보 레벨 수

const PALETTE = [
  '#00f0ff', // neon blue
  '#ff007f', // neon magenta
  '#ffb700', // neon yellow
  '#39ff14', // neon green
  '#9d00ff', // neon purple
  '#ff5e00', // neon orange
  '#ff00f0', // neon pink
  '#00ffcc', // neon teal
  '#e6ff00', // neon lime
  '#ff3c3c'  // neon red
];

let state = {
  playerCount: 4,
  currentPreset: 'lunch',
  names: [],
  results: [],
  rungs: [],         // 가로선 2차원 배열 [level][verticalLineIndex]
  paths: [],         // 각 플레이어별 이동 경로 [{x, y}, ...]
  mappings: [],      // 플레이어 인덱스 -> 도착 인덱스 매핑
  tracingStatus: [], // 플레이어별 상태: 'idle' | 'tracing' | 'completed'
  speed: 'normal',   // 'slow' | 'normal' | 'fast'
  soundEnabled: true,
  activeAnimations: [] // 현재 실행 중인 requestAnimationFrame ID 목록
};

// Web Audio API Context
let audioCtx = null;

// ==========================================
// 2. Preset Data Definition
// ==========================================
const PRESETS = {
  lunch: {
    getNames: (count) => {
      const defaultNames = ['김대리', '이과장', '박부장', '최사원', '정대리', '한주임', '조인턴', '윤팀장', '강부장', '임대리'];
      return Array.from({ length: count }, (_, i) => defaultNames[i] || `참가자 ${i + 1}`);
    },
    getResults: (count) => {
      // 1명 밥값 독박, 나머지는 통과
      const res = Array(count).fill('통과');
      res[Math.floor(Math.random() * count)] = '💸 밥값 내기';
      return res;
    }
  },
  order: {
    getNames: (count) => Array.from({ length: count }, (_, i) => `참가자 ${i + 1}`),
    getResults: (count) => {
      // 1순위, 2순위, 3순위... 순으로 생성
      return Array.from({ length: count }, (_, i) => `${i + 1} 순위`);
    }
  },
  draw: {
    getNames: (count) => Array.from({ length: count }, (_, i) => `참가자 ${i + 1}`),
    getResults: (count) => {
      // 1명 당첨, 나머지 꽝
      const res = Array(count).fill('꽝');
      res[Math.floor(Math.random() * count)] = '🎉 당첨';
      return res;
    }
  },
  custom: {
    getNames: (count) => Array.from({ length: count }, (_, i) => `참가자 ${i + 1}`),
    getResults: (count) => Array.from({ length: count }, (_, i) => `결과 ${i + 1}`)
  }
};

// ==========================================
// 3. Initialization & DOM Cache
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // 캐시할 DOM 요소들
  const btnDecrease = document.getElementById('btn-decrease');
  const btnIncrease = document.getElementById('btn-increase');
  const playerCountInput = document.getElementById('player-count-input');
  const dynamicInputsContainer = document.getElementById('dynamic-inputs-container');
  const btnGenerate = document.getElementById('btn-generate');
  const setupContainer = document.getElementById('setup-container');
  const gameStageContainer = document.getElementById('game-stage-container');
  const btnBack = document.getElementById('btn-back');
  const topLabelsContainer = document.getElementById('top-labels-container');
  const bottomLabelsContainer = document.getElementById('bottom-labels-container');
  const ladderSvg = document.getElementById('ladder-svg');
  const btnPlayAll = document.getElementById('btn-play-all');
  const btnReset = document.getElementById('btn-reset');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const resultsModal = document.getElementById('results-modal');
  const resultsListContainer = document.getElementById('results-list-container');
  const btnModalClose = document.getElementById('btn-modal-close');
  const btnRestart = document.getElementById('btn-restart');
  const completedCountEl = document.getElementById('completed-count');
  const totalCountEl = document.getElementById('total-count');

  // 프리셋 버튼 이벤트 바인딩
  const presetButtons = document.querySelectorAll('.preset-btn');
  presetButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      presetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentPreset = btn.getAttribute('data-preset');
      playClickSound();
      applyPreset();
    });
  });

  // 속도 조절 세그먼트 버튼 이벤트 바인딩
  const speedButtons = document.querySelectorAll('.segment-btn');
  speedButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      speedButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.speed = btn.getAttribute('data-speed');
      playClickSound();
    });
  });

  // 인원 증감 버튼 이벤트
  btnDecrease.addEventListener('click', () => {
    if (state.playerCount > 2) {
      saveCurrentFormValues();
      state.playerCount--;
      playerCountInput.value = state.playerCount;
      playClickSound();
      applyPreset(true); // 보존 모드로 새로고침
    }
  });

  btnIncrease.addEventListener('click', () => {
    if (state.playerCount < 10) {
      saveCurrentFormValues();
      state.playerCount++;
      playerCountInput.value = state.playerCount;
      playClickSound();
      applyPreset(true); // 보존 모드로 새로고침
    }
  });

  // 사다리 생성 버튼
  btnGenerate.addEventListener('click', () => {
    playClickSound();
    readFormValues();
    initGameStage();
  });

  // 설정으로 돌아가기 버튼
  btnBack.addEventListener('click', () => {
    playClickSound();
    resetAnimations();
    gameStageContainer.classList.add('hidden');
    setupContainer.classList.remove('hidden');
  });

  // 초기화 버튼
  btnReset.addEventListener('click', () => {
    playClickSound();
    resetAnimations();
    initGameStage();
  });

  // 사운드 토글 버튼
  btnSoundToggle.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    if (state.soundEnabled) {
      btnSoundToggle.classList.remove('muted');
      btnSoundToggle.classList.add('active');
      btnSoundToggle.innerHTML = '🔊';
      // 브라우저 오디오 컨텍스트 락 해제용
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
      } catch(err) {}
      playClickSound();
    } else {
      btnSoundToggle.classList.remove('active');
      btnSoundToggle.classList.add('muted');
      btnSoundToggle.innerHTML = '🔇';
    }
  });

  // 동시 시작 버튼
  btnPlayAll.addEventListener('click', () => {
    playClickSound();
    playAllTraces();
  });

  // 결과 모달 닫기
  btnModalClose.addEventListener('click', () => {
    playClickSound();
    resultsModal.classList.add('hidden');
  });

  // 다시 하기 버튼 (설정으로 돌아가기)
  btnRestart.addEventListener('click', () => {
    playClickSound();
    resultsModal.classList.add('hidden');
    resetAnimations();
    gameStageContainer.classList.add('hidden');
    setupContainer.classList.remove('hidden');
  });

  // 초기 로드 시 폼 셋업
  applyPreset();
  initConfetti();
});

// ==========================================
// 4. Form Management & Presets
// ==========================================

// 현재 화면에 입력된 값들을 임시 저장하여 인원수 증감 시 보존되게 함
function saveCurrentFormValues() {
  const dynamicInputsContainer = document.getElementById('dynamic-inputs-container');
  const rows = dynamicInputsContainer.querySelectorAll('.input-row');
  state.names = [];
  state.results = [];
  rows.forEach((row, idx) => {
    const nameInput = row.querySelector('.player-name input');
    const resultInput = row.querySelector('.player-result input');
    state.names[idx] = nameInput ? nameInput.value : '';
    state.results[idx] = resultInput ? resultInput.value : '';
  });
}

// 폼 입력값을 읽어 최종 상태에 저장
function readFormValues() {
  saveCurrentFormValues();
  // 비어있는 값이 있으면 기본값 채우기
  for (let i = 0; i < state.playerCount; i++) {
    if (!state.names[i] || state.names[i].trim() === '') {
      state.names[i] = `참가자 ${i + 1}`;
    }
    if (!state.results[i] || state.results[i].trim() === '') {
      state.results[i] = `결과 ${i + 1}`;
    }
  }
}

// 프리셋 혹은 인원수 변화에 따른 폼 렌더링
// keepValues 가 true 이면 기존에 입력된 내용을 유지하면서 칸 수만 변경
function applyPreset(keepValues = false) {
  const count = state.playerCount;
  const presetData = PRESETS[state.currentPreset];

  let targetNames = [];
  let targetResults = [];

  if (keepValues) {
    targetNames = [...state.names];
    targetResults = [...state.results];
  } else {
    targetNames = presetData.getNames(count);
    targetResults = presetData.getResults(count);
  }

  // 인원수가 늘어난 경우 모자란 부분을 디폴트 프리셋 값으로 채움
  const defaultNames = PRESETS[state.currentPreset].getNames(count);
  const defaultResults = PRESETS[state.currentPreset].getResults(count);

  for (let i = 0; i < count; i++) {
    if (!targetNames[i]) targetNames[i] = defaultNames[i];
    if (!targetResults[i]) targetResults[i] = defaultResults[i];
  }

  state.names = targetNames.slice(0, count);
  state.results = targetResults.slice(0, count);

  renderInputs();
}

// 동적 입력 폼 HTML 렌더링
function renderInputs() {
  const container = document.getElementById('dynamic-inputs-container');
  container.innerHTML = '';

  for (let i = 0; i < state.playerCount; i++) {
    const row = document.createElement('div');
    row.className = 'input-row';

    row.innerHTML = `
      <div class="input-field-wrapper player-name">
        <span class="row-index">${i + 1}</span>
        <input type="text" value="${escapeHtml(state.names[i])}" placeholder="이름 입력" id="input-name-${i}">
      </div>
      <div class="input-field-wrapper player-result">
        <span class="row-index">${i + 1}</span>
        <input type="text" value="${escapeHtml(state.results[i])}" placeholder="결과 입력" id="input-result-${i}">
      </div>
    `;
    container.appendChild(row);
  }
}

// HTML Escape Helper
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================
// 5. Ladder Generation Algorithm
// ==========================================

// 가로선 중복 방지 및 쏠림 방지 사다리 생성
function generateLadderData(N, M) {
  let rungs = [];
  
  // 1단계: 무작위 사다리 생성 (인접한 가로선 충돌 방지 포함)
  for (let l = 0; l < M; l++) {
    const row = Array(N - 1).fill(false);
    for (let k = 0; k < N - 1; k++) {
      // 45% 확률로 가로선 생성
      if (Math.random() < 0.45) {
        row[k] = true;
        k++; // 바로 옆 칸은 건너뛰어 3개 선이 한점에 만나는 기이한 꼬임 방지
      }
    }
    rungs.push(row);
  }

  // 2단계: 고립선 검증 및 보정 (가로선이 하나도 안 닿아 그냥 일자로 내려가는 세로선 구제)
  for (let i = 0; i < N; i++) {
    let connectedRungsCount = 0;
    for (let l = 0; l < M; l++) {
      if ((i > 0 && rungs[l][i - 1]) || (i < N - 1 && rungs[l][i])) {
        connectedRungsCount++;
      }
    }

    // 만약 한 번도 꺾이지 않는 수직선이 있다면 임의의 층에 가로선을 최소 1개 강제 추가
    if (connectedRungsCount === 0) {
      const randomLevel = Math.floor(Math.random() * M);
      // 왼쪽으로 연결할지 오른쪽으로 연결할지 판단
      if (i === 0) {
        // 맨 왼쪽 라인이면 오른쪽으로 강제 연결
        rungs[randomLevel][0] = true;
      } else if (i === N - 1) {
        // 맨 오른쪽 라인이면 왼쪽으로 강제 연결
        rungs[randomLevel][i - 1] = true;
      } else {
        // 가운데 라인이면 좌우 중 랜덤 연결하되, 인접 컬럼에 가로선 겹치지 않는 방향 고려
        const leftOk = !rungs[randomLevel][i - 2];
        const rightOk = !rungs[randomLevel][i + 1];
        if (leftOk && (!rightOk || Math.random() < 0.5)) {
          rungs[randomLevel][i - 1] = true;
        } else if (rightOk) {
          rungs[randomLevel][i] = true;
        } else {
          // 둘 다 인접 가로선 충돌 위험이 있으면 그냥 단독으로 생성 처리
          rungs[randomLevel][i] = true;
        }
      }
    }
  }

  return rungs;
}

// 사다리 구조에 따른 특정 세로선에서의 최종 매칭 경로 계산
function calculatePath(startLine, N, rungs, M) {
  let path = [];
  let currLine = startLine;

  const getX = (lineIdx) => (lineIdx + 0.5) * (SVG_WIDTH / N);
  const getY = (levelIdx) => Y_START + (levelIdx + 1) * ((Y_END - Y_START) / (M + 1));

  // 1. 시작점 삽입
  path.push({ x: getX(currLine), y: Y_START, type: 'vertical' });

  // 2. 가로선 수준을 거치며 트레이싱
  for (let l = 0; l < M; l++) {
    const yLevel = getY(l);
    
    // 세로 아래 방향으로 현재 가로선 레벨 높이까지 직진
    path.push({ x: getX(currLine), y: yLevel, type: 'vertical' });

    // 가로선 이동 여부 판단
    if (currLine < N - 1 && rungs[l][currLine]) {
      // 오른쪽 가로선 존재 -> 오른쪽으로 꺾음
      currLine = currLine + 1;
      path.push({ x: getX(currLine), y: yLevel, type: 'horizontal' });
    } else if (currLine > 0 && rungs[l][currLine - 1]) {
      // 왼쪽 가로선 존재 -> 왼쪽으로 꺾음
      currLine = currLine - 1;
      path.push({ x: getX(currLine), y: yLevel, type: 'horizontal' });
    }
  }

  // 3. 마지막 바닥선 도착
  path.push({ x: getX(currLine), y: Y_END, type: 'vertical' });

  return {
    endLine: currLine,
    coords: path
  };
}

// ==========================================
// 6. Game Stage Rendering
// ==========================================

function initGameStage() {
  const setupContainer = document.getElementById('setup-container');
  const gameStageContainer = document.getElementById('game-stage-container');
  const topLabelsContainer = document.getElementById('top-labels-container');
  const bottomLabelsContainer = document.getElementById('bottom-labels-container');
  const ladderSvg = document.getElementById('ladder-svg');
  const completedCountEl = document.getElementById('completed-count');
  const totalCountEl = document.getElementById('total-count');

  // 화면 보이기 토글
  setupContainer.classList.add('hidden');
  gameStageContainer.classList.remove('hidden');

  const N = state.playerCount;
  totalCountEl.textContent = N;
  completedCountEl.textContent = 0;

  // 상태 초기화
  state.rungs = generateLadderData(N, NUM_LEVELS);
  state.paths = [];
  state.mappings = [];
  state.tracingStatus = Array(N).fill('idle');

  // 각 플레이어별 전체 경로 및 종착점 미리 계산
  for (let i = 0; i < N; i++) {
    const result = calculatePath(i, N, state.rungs, NUM_LEVELS);
    state.paths[i] = result.coords;
    state.mappings[i] = result.endLine;
  }

  // 1. 라벨들 정렬하기 (CSS Grid 기반의 동일 간격 설정)
  topLabelsContainer.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
  bottomLabelsContainer.style.gridTemplateColumns = `repeat(${N}, 1fr)`;

  topLabelsContainer.innerHTML = '';
  bottomLabelsContainer.innerHTML = '';

  // 상단 라벨 렌더링
  for (let i = 0; i < N; i++) {
    const item = document.createElement('div');
    item.className = 'label-item';
    item.textContent = state.names[i];
    item.title = state.names[i];
    item.id = `top-label-${i}`;
    item.addEventListener('click', () => {
      // 대기 중인 상태일 때 클릭하면 개별 경로 추적 시작
      if (state.tracingStatus[i] === 'idle') {
        playSingleTrace(i);
      }
    });
    topLabelsContainer.appendChild(item);
  }

  // 하단 라벨 렌더링
  for (let i = 0; i < N; i++) {
    const item = document.createElement('div');
    item.className = 'label-item';
    item.textContent = state.results[i];
    item.title = state.results[i];
    item.id = `bottom-label-${i}`;
    bottomLabelsContainer.appendChild(item);
  }

  // 2. SVG 캔버스 빌드
  ladderSvg.innerHTML = '';
  // 반응형 viewBox 속성 설정
  ladderSvg.setAttribute('viewBox', `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`);

  const getX = (lineIdx) => (lineIdx + 0.5) * (SVG_WIDTH / N);
  const getY = (levelIdx) => Y_START + (levelIdx + 1) * ((Y_END - Y_START) / (NUM_LEVELS + 1));

  // 세로선 그리기
  for (let i = 0; i < N; i++) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', getX(i));
    line.setAttribute('y1', Y_START);
    line.setAttribute('x2', getX(i));
    line.setAttribute('y2', Y_END);
    line.setAttribute('class', 'ladder-vertical-line');
    line.setAttribute('id', `v-line-${i}`);
    ladderSvg.appendChild(line);
  }

  // 가로선(다리) 그리기
  for (let l = 0; l < NUM_LEVELS; l++) {
    const yVal = getY(l);
    for (let k = 0; k < N - 1; k++) {
      if (state.rungs[l][k]) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', getX(k));
        line.setAttribute('y1', yVal);
        line.setAttribute('x2', getX(k + 1));
        line.setAttribute('y2', yVal);
        line.setAttribute('class', 'ladder-rung');
        line.setAttribute('id', `rung-${l}-${k}`);
        ladderSvg.appendChild(line);
      }
    }
  }
}

// ==========================================
// 7. Trace Animation Engine
// ==========================================

// 모든 열 동시 실행 (약간의 시간차 스태거 효과 적용)
function playAllTraces() {
  const N = state.playerCount;
  for (let i = 0; i < N; i++) {
    if (state.tracingStatus[i] === 'idle') {
      setTimeout(() => {
        // 유저가 도중에 초기화했거나 이미 시작된 게 아니라면 실행
        if (state.tracingStatus[i] === 'idle') {
          playSingleTrace(i);
        }
      }, i * 200); // 200ms 단위로 순차적 페이드인 하듯 낙하
    }
  }
}

// 개별 사다리 선 트레이싱 구동
function playSingleTrace(playerIndex) {
  state.tracingStatus[playerIndex] = 'tracing';
  
  // UI 갱신 (상단 라벨 액티브 스타일링)
  const topLabel = document.getElementById(`top-label-${playerIndex}`);
  if (topLabel) topLabel.classList.add('active');

  const coords = state.paths[playerIndex];
  const color = PALETTE[playerIndex % PALETTE.length];
  const ladderSvg = document.getElementById('ladder-svg');

  // 1. 애니메이션용 SVG 경로(Path) 요소 동적 주입
  const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  let dAttr = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    dAttr += ` L ${coords[i].x} ${coords[i].y}`;
  }
  pathEl.setAttribute('d', dAttr);
  pathEl.setAttribute('class', 'trace-path');
  pathEl.setAttribute('stroke', color);
  pathEl.style.setProperty('--path-glow-color', color);
  ladderSvg.appendChild(pathEl);

  // 2. 흘러가는 닷(dot) 요소 주입
  const dotEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dotEl.setAttribute('r', '7');
  dotEl.setAttribute('class', 'trace-dot');
  dotEl.style.setProperty('--path-glow-color', color);
  ladderSvg.appendChild(dotEl);

  const pathLength = pathEl.getTotalLength();
  pathEl.style.strokeDasharray = pathLength;
  pathEl.style.strokeDashoffset = pathLength;

  // 3. 경로 내 수평 이동(가로선) 지점과 해당 거리(Distance) 위치 계산
  // 이 정보를 바탕으로 사다리가 옆으로 꺾일 때 소리 효과를 정교하게 싱크해 줍니다.
  const horizontalSegments = [];
  let currentDist = 0;
  
  // 수동으로 전체 누적 거리 테이블 구축
  const segmentLengths = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i+1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx*dx + dy*dy);
    
    segmentLengths.push({
      start: currentDist,
      end: currentDist + len,
      type: p2.type // 'vertical' 또는 'horizontal'
    });
    currentDist += len;
  }

  // 4. 애니메이션 타이밍 속도 매핑
  let duration = 3000; // default normal
  if (state.speed === 'slow') duration = 5000;
  if (state.speed === 'fast') duration = 1300;

  const startTime = performance.now();
  let nextCheckIdx = 0;
  let lastTickTime = 0;

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const drawDist = progress * pathLength;

    // A. SVG 선 그리기 및 닷 좌표 갱신
    pathEl.style.strokeDashoffset = pathLength - drawDist;
    
    try {
      const currentPoint = pathEl.getPointAtLength(drawDist);
      dotEl.setAttribute('cx', currentPoint.x);
      dotEl.setAttribute('cy', currentPoint.y);
    } catch(e) {
      // 일부 브라우저 초기화 엣지케이스 우회
    }

    // B. 사운드 틱 재생 로직 (움직이는 동안 일정한 리듬으로 똑-똑- 소리 재생)
    if (progress < 1) {
      if (now - lastTickTime > (state.speed === 'fast' ? 70 : 120)) {
        playTickSound();
        lastTickTime = now;
      }
    }

    // C. 회전/가로선 꺾이는 순간 슝- 사운드 싱크 재생
    for (let s = 0; s < segmentLengths.length; s++) {
      const seg = segmentLengths[s];
      if (seg.type === 'horizontal') {
        // 선이 가로 구간의 시작 부분에 막 진입하는 시각 포착
        if (drawDist >= seg.start && !seg.triggered) {
          seg.triggered = true;
          playTurnSound();
        }
      }
    }

    // D. 프레임 제어
    if (progress < 1) {
      const animId = requestAnimationFrame(animate);
      state.activeAnimations.push(animId);
    } else {
      // 완주 완료
      state.tracingStatus[playerIndex] = 'completed';
      
      // UI 상단 라벨 완료 처리
      if (topLabel) {
        topLabel.classList.remove('active');
        topLabel.classList.add('completed');
      }

      // 목적지(결과) 세로선 라벨 하이라이팅
      const destIndex = state.mappings[playerIndex];
      const bottomLabel = document.getElementById(`bottom-label-${destIndex}`);
      if (bottomLabel) {
        bottomLabel.classList.add('matched');
      }

      // 완주 축하 단발성 사운드
      playSuccessSound(playerIndex);

      // 전체 완료 카운트 갱신
      updateCompletedCount();
    }
  }

  const firstAnimId = requestAnimationFrame(animate);
  state.activeAnimations.push(firstAnimId);
}

// 모든 액티브 애니메이션 일시 차단 및 프레임 킬
function resetAnimations() {
  state.activeAnimations.forEach(id => cancelAnimationFrame(id));
  state.activeAnimations = [];
}

// 완료된 플레이어 수 카운트 및 전체 완료 시 축하 및 결과창 로드
function updateCompletedCount() {
  const completed = state.tracingStatus.filter(s => s === 'completed').length;
  document.getElementById('completed-count').textContent = completed;

  if (completed === state.playerCount) {
    // 모든 플레이어 완료 -> 1초 뒤 결과 모달 오픈
    setTimeout(() => {
      showResultsModal();
    }, 1000);
  }
}

// ==========================================
// 8. Results Modal & Celebration Confetti
// ==========================================

function showResultsModal() {
  const modal = document.getElementById('results-modal');
  const listContainer = document.getElementById('results-list-container');
  listContainer.innerHTML = '';

  // 매칭 목록을 HTML로 보기 좋게 바인딩
  for (let i = 0; i < state.playerCount; i++) {
    const destIdx = state.mappings[i];
    const name = state.names[i];
    const result = state.results[destIdx];

    const card = document.createElement('div');
    card.className = 'result-card-item';
    card.style.animationDelay = `${i * 100}ms`; // 순차 등장 효과
    card.innerHTML = `
      <span class="res-name">${escapeHtml(name)}</span>
      <span class="res-arrow">➔</span>
      <span class="res-val">${escapeHtml(result)}</span>
    `;
    listContainer.appendChild(card);
  }

  // 모달 띄우기
  modal.classList.remove('hidden');
  
  // 축하 사운드 및 꽃가루 효과 시작
  playFanfareSound();
  triggerConfetti();
}

// ==========================================
// 9. Web Audio API Synthesis Engine
// ==========================================

// 음향을 합성하여 연주
function synthTone(type, freq, duration, slideToFreq = null) {
  if (!state.soundEnabled) return;

  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    // 음역대 슬라이드(비프음 벤딩) 지원
    if (slideToFreq) {
      osc.frequency.exponentialRampToValueAtTime(slideToFreq, audioCtx.currentTime + duration);
    }

    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    // 끝부분 잔향 제어 (페이드 아웃)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (err) {
    console.warn("Web Audio API 재생 불가:", err);
  }
}

// 일반 클릭
function playClickSound() {
  synthTone('sine', 800, 0.08);
}

// 사다리 하강 틱톡
function playTickSound() {
  synthTone('triangle', 260, 0.03);
}

// 가로 다리를 건널 때 (상승 스윕)
function playTurnSound() {
  synthTone('sine', 380, 0.18, 900);
}

// 한 열 완주 성공음 (화음 분산 아르페지오 느낌으로 산뜻하게)
function playSuccessSound(playerIndex) {
  const tones = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  const baseTone = tones[playerIndex % tones.length];
  
  // 빠른 세 개 연속 음
  synthTone('sine', baseTone, 0.12);
  setTimeout(() => {
    synthTone('sine', baseTone * 1.25, 0.12);
  }, 80);
  setTimeout(() => {
    synthTone('sine', baseTone * 1.5, 0.25);
  }, 160);
}

// 최종 모든 열 클리어 팡파레
function playFanfareSound() {
  // 경쾌하고 웅장한 다장조 코드 전개
  const chords = [523.25, 659.25, 783.99, 987.77, 1046.50]; // C5, E5, G5, B5, C6
  chords.forEach((freq, idx) => {
    setTimeout(() => {
      synthTone('sine', freq, 0.45);
    }, idx * 100);
  });
}

// ==========================================
// 10. Lightweight Confetti System
// ==========================================

let confettiActive = false;
let confettiParticles = [];
const confettiColors = ['#ff007f', '#00f0ff', '#ffb700', '#9d00ff', '#39ff14', '#ff5e00'];

function initConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;

  // 화면 크기에 캔버스 바인딩
  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function triggerConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;

  confettiParticles = [];
  confettiActive = true;

  // 160개 꽃가루 입자 조각 무작위 분무
  const count = 160;
  for (let i = 0; i < count; i++) {
    confettiParticles.push({
      x: Math.random() * canvas.width,
      // 화면 위에서 흘러내리도록 음수 y 좌표 혹은 탑 부근 설정
      y: Math.random() * canvas.height - canvas.height,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 4 + 4,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      size: Math.random() * 6 + 6,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8
    });
  }

  const ctx = canvas.getContext('2d');
  
  function updateConfetti() {
    if (!confettiActive) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let alive = false;
    confettiParticles.forEach(p => {
      // 중력 및 바람 저항 시뮬레이션
      p.y += p.vy;
      p.x += p.vx + Math.sin(p.y / 30) * 0.5; // 미풍 흔들림 추가
      p.rotation += p.rotationSpeed;

      // 캔버스 내부에 위치한 것 그리기
      if (p.y < canvas.height + 20) {
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.fillStyle = p.color;
        // 직사각형 또는 정사각형 꽃가루 흩날리기
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    });

    // 모달 오버레이가 닫히면 강제 중단
    const resultsModal = document.getElementById('results-modal');
    if (resultsModal && resultsModal.classList.contains('hidden')) {
      confettiActive = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    if (alive) {
      requestAnimationFrame(updateConfetti);
    } else {
      confettiActive = false;
    }
  }

  requestAnimationFrame(updateConfetti);
}
