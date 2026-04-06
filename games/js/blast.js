// blast.js - 블라스트 퍼즐(연결형 퍼즐) 미니게임
// Exports: window.startBlastGame(containerId, onHome)
function startBlastGame(containerId, onHome) {
    const boardSize = 8;
    const blockTypes = [
      { color: '#FF6384', icon: '🍉' }, // 수박
      { color: '#36A2EB', icon: '🫐' }, // 블루베리
      { color: '#FFCE56', icon: '🍋' }, // 레몬
      { color: '#4BC0C0', icon: '🥝' }, // 키위
      { color: '#9966FF', icon: '🍇' }, // 포도
      { color: '#FF9F40', icon: '🍊' }  // 오렌지
    ];
    let board = [];
    let score = 0;
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    container.style.position = 'relative';

    // Title & Home
    const topBar = document.createElement('div');
    topBar.style.display = 'flex';
    topBar.style.justifyContent = 'space-between';
    topBar.style.alignItems = 'center';
    topBar.style.marginBottom = '0.7rem';
    const title = document.createElement('div');
    title.textContent = '블라스트 퍼즐 (Blast Puzzle)';
    title.style.fontSize = '1.3rem';
    title.style.fontWeight = 'bold';
    const homeBtn = document.createElement('button');
    homeBtn.textContent = 'Home';
    homeBtn.style.fontSize = '1rem';
    homeBtn.style.padding = '0.3em 1em';
    homeBtn.style.borderRadius = '0.5em';
    homeBtn.style.border = 'none';
    homeBtn.style.background = '#f7b731';
    homeBtn.style.color = '#fff';
    homeBtn.style.cursor = 'pointer';
    homeBtn.onclick = () => { onHome && onHome(); };
    topBar.appendChild(title);
    topBar.appendChild(homeBtn);
    container.appendChild(topBar);

    // Score UI
    const infoDiv = document.createElement('div');
    infoDiv.style.fontSize = '1.05rem';
    infoDiv.style.marginBottom = '0.5rem';
    container.appendChild(infoDiv);

    // How to play
    const howToDiv = document.createElement('div');
    howToDiv.style.fontSize = '0.98rem';
    howToDiv.style.marginBottom = '0.7rem';
    howToDiv.style.color = '#555';
    howToDiv.innerHTML = `
      <b>플레이 방법</b><br>
      - 같은 색 블록이 3개 이상 연결된 곳을 클릭하면 블록이 사라집니다.<br>
      - 위에서 새로운 블록이 내려와 빈 칸을 채웁니다.<br>
      - 더 이상 없앨 수 있는 블록이 없으면 게임 오버!<br>
      - <b>Home</b>으로 메인 메뉴로 돌아갑니다.
    `;
    container.appendChild(howToDiv);

    // Board UI
    const boardDiv = document.createElement('div');
    boardDiv.style.display = 'grid';
    boardDiv.style.gridTemplateColumns = `repeat(${boardSize}, 38px)`;
    boardDiv.style.gridTemplateRows = `repeat(${boardSize}, 38px)`;
    boardDiv.style.gap = '4px';
    boardDiv.style.background = 'transparent';
    boardDiv.style.padding = '10px';
    boardDiv.style.borderRadius = '1em';
    boardDiv.style.margin = '0 auto 1.2rem auto';
    boardDiv.style.width = `${boardSize*38+4*(boardSize-1)+20}px`;
    boardDiv.style.boxShadow = '0 2px 16px #0002';
    boardDiv.style.overflow = 'hidden'; // 블록이 네모칸(보드) 밖으로 안보이게
    boardDiv.style.position = 'relative'; // 자식 absolute 대비 기준
    container.appendChild(boardDiv);

    function getIndex(row, col) { return row * boardSize + col; }

    function updateScore() {
      infoDiv.innerHTML = `Score: <b>${score}</b>`;
    }

    function createBoard() {
      board = [];
      for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
          const type = blockTypes[Math.floor(Math.random() * blockTypes.length)];
          board.push({ row, col, color: type.color, icon: type.icon });
        }
      }
      updateScore();
      renderBoard();
    }

    function renderBoard() {
      boardDiv.innerHTML = '';
      // 각 블록의 실제 y 위치(행)와 렌더링 위치(애니메이션 시작점)를 계산
      // 1. 각 칸별로 위에 빈칸이 몇개 있었는지 기록 (기존 블록 드롭용)
      const dropOffsetMap = Array(board.length).fill(0);
      // 2. 새로 생성된 블록(맨 위에서 내려오는 블록)인지 체크
      const isNewBlockMap = Array(board.length).fill(false);
      for (let col = 0; col < boardSize; col++) {
        let emptyAbove = 0;
        for (let row = boardSize - 1; row >= 0; row--) {
          const idx = row * boardSize + col;
          if (!board[idx].color) {
            emptyAbove++;
          } else {
            dropOffsetMap[idx] = emptyAbove;
            // 새로 생성된 블록은 아이콘이 있고, 그 위에 빈칸이 있었던 경우(맨 위에서 내려온 블록)
            if (row < emptyAbove) {
              isNewBlockMap[idx] = true;
            }
          }
        }
      }

      // boardDiv의 위치와 크기 정보
      const boardRect = boardDiv.getBoundingClientRect();

      for (let i = 0; i < board.length; i++) {
        const cell = board[i];
        const div = document.createElement('div');
        div.className = 'blast-block';
        div.style.background = cell.color;
        div.style.borderRadius = '50%'; // 완전 동그랗게
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.fontSize = '1.6rem';
        div.style.cursor = 'pointer';
        div.style.transition = 'transform 0.32s cubic-bezier(.3,1.6,.5,1), opacity 0.2s';
        div.innerText = cell.icon;
        div.dataset.row = cell.row;
        div.dataset.col = cell.col;
        div.onclick = onBlockClick;

        const dropOffset = dropOffsetMap[i];

        // 새로 생성된 블록(맨 위에서 내려온 블록)인지 체크
        if (isNewBlockMap[i]) {
          div.style.willChange = 'transform';
          div.style.transform = `translateY(${-42 * (boardSize)}px) scaleY(1.3) scaleX(0.8)`;
          div.style.opacity = '0.7';
          requestAnimationFrame(() => {
            setTimeout(() => {
              div.style.transition = 'transform 1.1s cubic-bezier(.3,1.6,.5,1), opacity 0.5s';
              div.style.transform = 'translateY(0) scaleY(0.85) scaleX(1.15)';
              div.style.opacity = '1';
              setTimeout(() => {
                div.style.transition = 'transform 0.7s cubic-bezier(.3,1.6,.5,1)';
                div.style.transform = 'translateY(0) scaleY(1.12) scaleX(0.92)';
                setTimeout(() => {
                  div.style.transition = 'transform 0.45s cubic-bezier(.3,1.6,.5,1)';
                  div.style.transform = 'translateY(0) scaleY(0.97) scaleX(1.03)';
                  setTimeout(() => {
                    div.style.transition = 'transform 0.32s cubic-bezier(.3,1.6,.5,1)';
                    div.style.transform = 'translateY(0) scaleY(1) scaleX(1)';
                  }, 320);
                }, 450);
              }, 700);
            }, 30);
          });
        } else {
          // 기존 블록은 애니메이션 없이 바로 위치에 고정
          div.style.transform = 'translateY(0) scaleY(1) scaleX(1)';
          div.style.opacity = '1';
        }

        boardDiv.appendChild(div);
      }
      clearHint();
    }

    // 과즙 스플래시 효과
    function createJuiceSplash(x, y, color) {
      const splash = document.createElement('div');
      splash.className = 'juice-splash';
      splash.style.position = 'absolute';
      splash.style.left = x + 'px';
      splash.style.top = y + 'px';
      splash.style.pointerEvents = 'none';
      splash.style.width = '0px';
      splash.style.height = '0px';
      splash.style.zIndex = 30;

      // 메인 과즙 스플래시(방울+스플래시)
      // 1. 중앙 터지는 스플래시(꽃잎/물방울 모양)
      for (let i = 0; i < 7; i++) {
        const petal = document.createElement('div');
        petal.style.position = 'absolute';
        petal.style.left = '0px';
        petal.style.top = '0px';
        petal.style.width = '0px';
        petal.style.height = '0px';
        petal.style.borderRadius = '50% 80% 50% 80%/80% 50% 80% 50%';
        petal.style.background = color;
        petal.style.opacity = '0.7';
        petal.style.transform = `rotate(${i*360/7}deg) scale(0.7)`;
        petal.style.transition = 'transform 0.5s cubic-bezier(.7,1.7,.5,1), opacity 0.5s';
        setTimeout(() => {
          petal.style.transform = `rotate(${i*360/7}deg) scale(2.2)`;
          petal.style.opacity = '0';
        }, 10);
        splash.appendChild(petal);
      }

      // 2. 방울(물방울/과즙방울)
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.15;
        const r = 38 + Math.random() * 18;
        const drop = document.createElement('div');
        drop.style.position = 'absolute';
        drop.style.left = '0px';
        drop.style.top = '0px';
        drop.style.width = 7 + Math.random() * 5 + 'px'; // 더 작게
        drop.style.height = 7 + Math.random() * 5 + 'px';
        drop.style.borderRadius = '60% 100% 60% 100%/100% 60% 100% 60%';
        drop.style.background = color;
        drop.style.opacity = '0.85';
        drop.style.boxShadow = `0 0 6px 1px ${color}55`;
        drop.style.transform = `translate(-50%, -50%) scale(0.7)`;
        drop.style.transition = 'transform 0.6s cubic-bezier(.7,1.7,.5,1), opacity 0.6s';
        setTimeout(() => {
          drop.style.transform = `translate(${Math.cos(angle)*r}px, ${Math.sin(angle)*r}px) scale(${0.9 + Math.random()*0.3})`;
          drop.style.opacity = '0';
        }, 10);
        splash.appendChild(drop);
      }

      // 3. 중앙 하이라이트(빛 반사 느낌)
      const highlight = document.createElement('div');
      highlight.style.position = 'absolute';
      highlight.style.left = '-10px';
      highlight.style.top = '-10px';
      highlight.style.width = '20px';
      highlight.style.height = '20px';
      highlight.style.borderRadius = '50%';
      highlight.style.background = 'rgba(255,255,255,0.7)';
      highlight.style.opacity = '0.7';
      highlight.style.filter = 'blur(2px)';
      highlight.style.transition = 'opacity 0.5s, transform 0.5s';
      setTimeout(() => {
        highlight.style.opacity = '0';
        highlight.style.transform = 'scale(2.5)';
      }, 30);
      splash.appendChild(highlight);

      container.appendChild(splash);
      setTimeout(() => splash.remove(), 700);
    }

    function getBlockPositionInBoardDiv(row, col) {
      // boardDiv의 실제 위치를 기준으로 절대좌표(px) 반환
      const cellSize = 38 + 4;
      // boardDiv 내부 좌표 (padding 10px, gap 4px)
      const xInBoard = col * cellSize + 38/2 + 2; // 2: gap/2
      const yInBoard = row * cellSize + 38/2 + 2;
      // boardDiv의 offset 기준 (container는 relative)
      const x = boardDiv.offsetLeft + xInBoard;
      const y = boardDiv.offsetTop + yInBoard;
      return { x, y };
    }

    function onBlockClick(e) {
      resetHintTimer();
      const row = parseInt(e.target.dataset.row);
      const col = parseInt(e.target.dataset.col);
      const idx = getIndex(row, col);
      const color = board[idx].color;
      if (!color) return;
      const visited = Array(board.length).fill(false);
      const queue = [[row, col]];
      const group = [];
      while (queue.length) {
        const [r, c] = queue.pop();
        const i = getIndex(r, c);
        if (visited[i]) continue;
        if (board[i].color !== color) continue;
        visited[i] = true;
        group.push(i);
        if (r > 0) queue.push([r-1, c]);
        if (r < boardSize-1) queue.push([r+1, c]);
        if (c > 0) queue.push([r, c-1]);
        if (c < boardSize-1) queue.push([r, c+1]);
      }
      if (group.length >= 3) {
        const blocks = boardDiv.querySelectorAll('.blast-block');
        for (const i of group) {
          const div = blocks[i];
          if (div) {
            const row = parseInt(div.dataset.row);
            const col = parseInt(div.dataset.col);
            const { x, y } = getBlockPositionInBoardDiv(row, col);
            createJuiceSplash(x, y, board[i].color);
            div.style.transform = 'scale(1.3)';
            div.style.opacity = '1';
          }
        }
        setTimeout(() => {
          for (const i of group) {
            const div = blocks[i];
            if (div) {
              div.style.transform = 'scale(0.1)';
              div.style.opacity = '0';
            }
          }
          setTimeout(() => {
            for (const i of group) {
              board[i].color = null;
              board[i].icon = null;
            }
            score += group.length * 20;
            updateScore();
            // 블록 드롭 후 바로 새 블록 생성 (텀 최소화)
            dropBlocks();
            renderBoard();
            setTimeout(() => {
              fillEmpty();
              renderBoard();
              setTimeout(() => {
                if (!hasPossibleMoves()) showGameOver();
              }, 100);
            }, 60); // 텀 더 짧게 (0.06초)
          }, 180);
        }, 180);
      }
    }

    function dropBlocks() {
      for (let col = 0; col < boardSize; col++) {
        for (let row = boardSize - 1; row > 0; row--) {
          const idx = getIndex(row, col);
          if (!board[idx].color) {
            for (let r = row - 1; r >= 0; r--) {
              const aboveIdx = getIndex(r, col);
              if (board[aboveIdx].color) {
                board[idx].color = board[aboveIdx].color;
                board[idx].icon = board[aboveIdx].icon;
                board[aboveIdx].color = null;
                board[aboveIdx].icon = null;
                break;
              }
            }
          }
        }
      }
    }

    function fillEmpty() {
      for (let col = 0; col < boardSize; col++) {
        let emptyCount = 0;
        for (let row = boardSize - 1; row >= 0; row--) {
          const idx = getIndex(row, col);
          if (!board[idx].color) {
            emptyCount++;
          } else if (emptyCount > 0) {
            board[getIndex(row + emptyCount, col)].color = board[idx].color;
            board[getIndex(row + emptyCount, col)].icon = board[idx].icon;
            board[idx].color = null;
            board[idx].icon = null;
          }
        }
        for (let r = 0; r < emptyCount; r++) {
          const type = blockTypes[Math.floor(Math.random() * blockTypes.length)];
          board[getIndex(r, col)].color = type.color;
          board[getIndex(r, col)].icon = type.icon;
        }
      }
    }

    // --- 힌트 시스템 변수 및 함수들 ---
    let hintTimeout = null;
    let hintBlocks = [];


    // 힌트 하이라이트 제거
    function clearHint() {
      const blocks = boardDiv.querySelectorAll('.blast-block');
      blocks.forEach(b => b.classList.remove('blast-hint'));
      hintBlocks = [];
    }

    // 힌트 표시: 3개 이상 연결된 그룹 중 하나를 하이라이트
    function showHint() {
      clearHint();
      for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
          const idx = getIndex(row, col);
          const color = board[idx].color;
          if (!color) continue;
          const visited = Array(board.length).fill(false);
          const queue = [[row, col]];
          const group = [];
          while (queue.length) {
            const [r, c] = queue.pop();
            const i = getIndex(r, c);
            if (visited[i]) continue;
            if (board[i].color !== color) continue;
            visited[i] = true;
            group.push(i);
            if (r > 0) queue.push([r-1, c]);
            if (r < boardSize-1) queue.push([r+1, c]);
            if (c > 0) queue.push([r, c-1]);
            if (c < boardSize-1) queue.push([r, c+1]);
          }
          if (group.length >= 3) {
            const blocks = boardDiv.querySelectorAll('.blast-block');
            group.forEach(i => {
              if (blocks[i]) blocks[i].classList.add('blast-hint');
            });
            hintBlocks = group;
            return;
          }
        }
      }
    }

    // 힌트 타이머 리셋 (유저 액션마다 호출)
    function resetHintTimer() {
      if (hintTimeout) clearTimeout(hintTimeout);
      hintTimeout = setTimeout(() => {
        // 5초 후에 실제로 힌트 표시
        showHint();
      }, 5000);
    }

    // 유저 액션(클릭/터치/키보드 등)마다 힌트 타이머 리셋
    function userActionHandler() {
      clearHint();
      resetHintTimer();
    }

    // 게임 내 주요 상호작용에 이벤트 리스너 추가
    container.addEventListener('mousedown', userActionHandler);
    container.addEventListener('touchstart', userActionHandler);
    window.addEventListener('keydown', userActionHandler);

    function hasPossibleMoves() {
      for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
          const idx = getIndex(row, col);
          const color = board[idx].color;
          if (!color) continue;
          // BFS로 3개 이상 연결된 그룹이 있는지 확인
          const visited = Array(board.length).fill(false);
          const queue = [[row, col]];
          let count = 0;
          while (queue.length) {
            const [r, c] = queue.pop();
            const i = getIndex(r, c);
            if (visited[i]) continue;
            if (board[i].color !== color) continue;
            visited[i] = true;
            count++;
            if (r > 0) queue.push([r-1, c]);
            if (r < boardSize-1) queue.push([r+1, c]);
            if (c > 0) queue.push([r, c-1]);
            if (c < boardSize-1) queue.push([r, c+1]);
          }
          if (count >= 3) return true;
        }
      }
      return false;
    }

    function showGameOver() {
      let overDiv = document.getElementById('blast-game-over');
      if (!overDiv) {
        overDiv = document.createElement('div');
        overDiv.id = 'blast-game-over';
        overDiv.style.position = 'absolute';
        overDiv.style.top = '50%';
        overDiv.style.left = '50%';
        overDiv.style.transform = 'translate(-50%, -50%) scale(0.2)';
        overDiv.style.background = 'rgba(0,0,0,0.8)';
        overDiv.style.color = '#fff';
        overDiv.style.fontSize = '1.25rem';
        overDiv.style.padding = '1.1rem 1.7rem';
        overDiv.style.borderRadius = '0.7rem';
        overDiv.style.textAlign = 'center';
        overDiv.style.zIndex = '1000';
        overDiv.style.boxShadow = '0 0 40px 12px #ff2d2d88, 0 0 0 5px #fff70055';
        overDiv.style.opacity = '0';
        overDiv.innerHTML =
          '<div style="font-size:1.45rem;letter-spacing:0.04em;white-space:nowrap;display:inline-block;">' +
            '<span style="font-size:1.2em;vertical-align:-0.1em;">💥</span> ' +
            'Game Over! <span style="font-size:1.2em;vertical-align:-0.1em;">💥</span>' +
          '</div>' +
          '<br>' +
          '<button id="blast-restart-btn" style="margin-top:1.1rem;font-size:1.05rem;padding:0.4rem 1.3rem;border-radius:0.5rem;border:none;background:#36A2EB;color:#fff;cursor:pointer;">Restart</button>';
        container.appendChild(overDiv);

        // 폭탄 터지는 애니메이션 효과
        setTimeout(() => {
          overDiv.style.transition = 'transform 0.18s cubic-bezier(.7,2.2,.2,1), opacity 0.18s';
          overDiv.style.transform = 'translate(-50%, -50%) scale(1.18)';
          overDiv.style.opacity = '1';
          setTimeout(() => {
            overDiv.style.transition = 'transform 0.13s cubic-bezier(.7,1.7,.2,1)';
            overDiv.style.transform = 'translate(-50%, -50%) scale(0.93)';
            setTimeout(() => {
              overDiv.style.transition = 'transform 0.11s cubic-bezier(.7,1.7,.2,1)';
              overDiv.style.transform = 'translate(-50%, -50%) scale(1.04)';
              setTimeout(() => {
                overDiv.style.transition = 'transform 0.09s cubic-bezier(.7,1.7,.2,1)';
                overDiv.style.transform = 'translate(-50%, -50%) scale(1)';
              }, 90);
            }, 110);
          }, 130);
        }, 10);

        // 폭발 파티클 효과 추가 (간단한 원 여러개)
        for (let i = 0; i < 18; i++) {
          const particle = document.createElement('div');
          particle.style.position = 'absolute';
          particle.style.left = '50%';
          particle.style.top = '50%';
          particle.style.width = '18px';
          particle.style.height = '18px';
          particle.style.borderRadius = '50%';
          particle.style.background = i % 2 === 0 ? '#fff700' : '#ff2d2d';
          particle.style.opacity = '0.85';
          particle.style.pointerEvents = 'none';
          particle.style.zIndex = '1001';
          particle.style.transform = 'translate(-50%, -50%) scale(0.7)';
          overDiv.appendChild(particle);
          setTimeout(() => {
            const angle = (Math.PI * 2 / 18) * i + Math.random() * 0.2;
            const r = 120 + Math.random() * 40;
            particle.style.transition = 'transform 0.5s cubic-bezier(.7,1.7,.2,1), opacity 0.5s';
            particle.style.transform = `translate(-50%, -50%) translate(${Math.cos(angle)*r}px, ${Math.sin(angle)*r}px) scale(${0.7 + Math.random()*0.5})`;
            particle.style.opacity = '0';
          }, 30);
          setTimeout(() => particle.remove(), 700);
        }
      } else {
        overDiv.style.display = '';
      }
      document.getElementById('blast-restart-btn').onclick = () => {
        overDiv.style.display = 'none';
        createBoard();
      };
    }

    // Start game
    createBoard();
    resetHintTimer();
    // 힌트 효과 CSS 추가
    if (!document.getElementById('blast-hint-style')) {
      const style = document.createElement('style');
      style.id = 'blast-hint-style';
      style.innerHTML = `.blast-hint { box-shadow: 0 0 0 4px #fff700cc, 0 0 16px 8px #fff70055 !important; z-index: 2; animation: blast-hint-ani 0.7s infinite alternate; }
      @keyframes blast-hint-ani { 0% { filter: brightness(1.2); } 100% { filter: brightness(1.7); } }`;
      document.head.appendChild(style);
    }
}
window.startBlastGame = startBlastGame;
