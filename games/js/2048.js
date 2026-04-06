// 2048 Mini-game (Vanilla JS)
// Exports: window.start2048Game(containerId, onHome)

(function() {
  function start2048Game(containerId, onHome) {
    const size = 4;
    let board = [];
    let score = 0;
    let gameOver = false;
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    container.style.position = 'relative';

    // Title & Home button
    const topBar = document.createElement('div');
    topBar.style.display = 'flex';
    topBar.style.justifyContent = 'space-between';
    topBar.style.alignItems = 'center';
    topBar.style.marginBottom = '1.2rem';
    const title = document.createElement('div');
    title.textContent = '2048';
    title.style.fontSize = '2.1rem';
    title.style.fontWeight = 'bold';
    title.style.letterSpacing = '0.1em';
    const homeBtn = document.createElement('button');
    homeBtn.textContent = 'Home';
    homeBtn.style.fontSize = '1.1rem';
    homeBtn.style.padding = '0.4em 1.2em';
    homeBtn.style.borderRadius = '0.6em';
    homeBtn.style.border = 'none';
    homeBtn.style.background = '#f7b731';
    homeBtn.style.color = '#fff';
    homeBtn.style.cursor = 'pointer';
    homeBtn.onclick = () => onHome && onHome();
    topBar.appendChild(title);
    topBar.appendChild(homeBtn);
    container.appendChild(topBar);

    // Score
    const scoreDiv = document.createElement('div');
    scoreDiv.style.fontSize = '1.1rem';
    scoreDiv.style.marginBottom = '0.7rem';
    scoreDiv.style.fontWeight = '500';
    container.appendChild(scoreDiv);

    // 플레이 방법 안내
    const howToDiv = document.createElement('div');
    howToDiv.style.fontSize = '0.98rem';
    howToDiv.style.marginBottom = '0.7rem';
    howToDiv.style.color = '#555';
    howToDiv.innerHTML = `
      <b>플레이 방법</b><br>
      - 방향키(←↑↓→) 또는 스와이프(모바일)로 타일을 이동하세요.<br>
      - 같은 숫자 타일이 만나면 합쳐집니다.<br>
      - <b>AI 플레이</b> 버튼을 누르면 자동으로 진행됩니다.<br>
      - <b>Restart</b>로 게임을 다시 시작할 수 있습니다.<br>
      - <b>Home</b>으로 메인 메뉴로 돌아갑니다.
    `;
    // 판(보드) 바로 아래에 설명을 추가 (boardWrapper가 생성된 후에만)
    // boardWrapper가 아직 선언되기 전에 howToDiv를 추가하려 해서 ReferenceError가 발생함
    // -> boardWrapper 생성 후에 설명을 추가해야 함


    // Board Wrapper (for centering)
    const boardWrapper = document.createElement('div');
    boardWrapper.style.display = 'flex';
    boardWrapper.style.justifyContent = 'center';
    boardWrapper.style.alignItems = 'center';
    boardWrapper.style.width = '100%';
    boardWrapper.style.height = 'calc(70vw < 340px ? 340px : 70vw)';
    boardWrapper.style.minHeight = '340px';
    boardWrapper.style.margin = '0 auto 1.2rem auto';

    const boardDiv = document.createElement('div');
    boardDiv.style.display = 'grid';
    boardDiv.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    boardDiv.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    boardDiv.style.gap = '0.6em';
    boardDiv.style.background = '#bbada0'; // 2048 보드판 배경색
    boardDiv.style.padding = '1.2em'; // 보드판 여백을 더 넓게
    boardDiv.style.borderRadius = '1.1em';
    boardDiv.style.width = 'min(90vw, 340px)';
    boardDiv.style.height = 'min(90vw, 340px)';
    boardDiv.style.boxSizing = 'border-box';
    boardDiv.style.position = 'relative';
    boardWrapper.appendChild(boardDiv);
    container.appendChild(boardWrapper);

    // Game Over
    const overDiv = document.createElement('div');
    overDiv.id = 'game-2048-over';
    overDiv.style.position = 'absolute';
    overDiv.style.top = '50%';
    overDiv.style.left = '50%';
    overDiv.style.transform = 'translate(-50%, -50%) scale(0.2)';
    overDiv.style.background = 'rgba(0,0,0,0.85)';
    overDiv.style.color = '#fff';
    overDiv.style.fontSize = '1.25rem';
    overDiv.style.padding = '1.1rem 1.7rem';
    overDiv.style.borderRadius = '0.7rem';
    overDiv.style.textAlign = 'center';
    overDiv.style.zIndex = '1000';
    overDiv.style.display = 'none';
    overDiv.style.boxShadow = '0 0 40px 12px #ff2d2d88, 0 0 0 5px #fff70055';
    overDiv.style.opacity = '0';
    overDiv.innerHTML =
      '<div style="font-size:1.45rem;letter-spacing:0.04em;white-space:nowrap;display:inline-block;">' +
        '<span style="font-size:1.2em;vertical-align:-0.1em;">💥</span> ' +
        'Game Over! <span style="font-size:1.2em;vertical-align:-0.1em;">💥</span>' +
      '</div>' +
      '<br>' +
      '<button id="restart-2048-btn" style="margin-top:1.1rem;font-size:1.05rem;padding:0.4rem 1.3rem;border-radius:0.5rem;border:none;background:#f7b731;color:#fff;cursor:pointer;">Restart</button>';
    container.appendChild(overDiv);
    overDiv.querySelector('#restart-2048-btn').onclick = restart;

    // Bomb explosion animation
    overDiv.showEffect = function() {
      overDiv.style.display = '';
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

      // Particle effect
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
    };

    function initBoard() {
      board = Array(size * size).fill(0);
      score = 0;
      gameOver = false;
      addRandomTile();
      addRandomTile();
      update();
    }

    function addRandomTile() {
      const empty = [];
      for (let i = 0; i < board.length; i++) if (board[i] === 0) empty.push(i);
      if (empty.length === 0) return;
      const idx = empty[Math.floor(Math.random() * empty.length)];
      board[idx] = Math.random() < 0.9 ? 2 : 4;
    }

    // --- 타일 객체 기반으로 관리 및 애니메이션 ---
    let tiles = [];
    let animating = false;
    let tileId = 1;
    function createTile(val, row, col) {
      return { id: tileId++, value: val, row, col, lastRow: row, lastCol: col, merged: false, toRemove: false, new: false };
    }

    function findTile(row, col) {
      return tiles.find(t => t.row === row && t.col === col && !t.toRemove);
    }

    function updateTilesFromBoard() {
      // Remove merged tiles
      tiles = tiles.filter(t => !t.toRemove);
      // Mark all as not merged/new
      tiles.forEach(t => { t.merged = false; t.new = false; });
      // Add new tiles from board
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (board[r * size + c] !== 0 && !findTile(r, c)) {
            tiles.push(createTile(board[r * size + c], r, c));
            tiles[tiles.length - 1].new = true;
          }
        }
      }
    }

    function update() {
      scoreDiv.textContent = `Score: ${score}`;
      // 기존 타일 DOM 재사용을 위해 boardDiv의 자식이 있으면 모두 제거하지 않고, 배경 격자만 새로 그림
      // 배경 격자 (z-index: 0)
      let bgLayer = boardDiv.querySelector('.bg-layer');
      if (!bgLayer) {
        bgLayer = document.createElement('div');
        bgLayer.className = 'bg-layer';
        bgLayer.style.position = 'absolute';
        bgLayer.style.left = '0';
        bgLayer.style.top = '0';
        bgLayer.style.width = '100%';
        bgLayer.style.height = '100%';
        bgLayer.style.zIndex = '0';
        boardDiv.appendChild(bgLayer);
      }
      bgLayer.innerHTML = '';
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const bg = document.createElement('div');
          bg.style.position = 'absolute';
          bg.style.left = (c * 25 + 0.6 * c) + '%';
          bg.style.top = (r * 25 + 0.6 * r) + '%';
          bg.style.width = '23.5%';
          bg.style.height = '23.5%';
          bg.style.background = getTileColor(0);
          bg.style.borderRadius = '0.7em';
          bgLayer.appendChild(bg);
        }
      }

      // 타일 렌더링 (z-index: 1)
      // 기존 타일 DOM 재사용
      let tileMap = {};
      Array.from(boardDiv.querySelectorAll('.tile')).forEach(cell => {
        tileMap[cell.getAttribute('data-id')] = cell;
      });
      tiles.forEach(tile => {
        let cell = tileMap[tile.id];
        if (!cell) {
          cell = document.createElement('div');
          cell.className = 'tile';
          cell.style.position = 'absolute';
          cell.style.width = '23.5%';
          cell.style.height = '23.5%';
          cell.style.display = 'flex';
          cell.style.alignItems = 'center';
          cell.style.justifyContent = 'center';
          cell.style.fontSize = tile.value >= 1024 ? '1.5rem' : '1.3rem';
          cell.style.fontWeight = 'bold';
          cell.style.borderRadius = '0.7em';
          cell.style.zIndex = '1';
          cell.setAttribute('data-id', tile.id);
          boardDiv.appendChild(cell);
        }
        cell.style.background = getTileColor(tile.value);
        cell.style.color = tile.value <= 4 ? '#776e65' : '#fff';
        cell.textContent = tile.value > 0 ? tile.value : '';
        // 이동 트랜지션
        cell.style.transition = 'left 0.18s, top 0.18s, background 0.18s, transform 0.18s';
        cell.style.left = (tile.lastCol * 25 + 0.6 * tile.lastCol) + '%';
        cell.style.top = (tile.lastRow * 25 + 0.6 * tile.lastRow) + '%';
        // 다음 프레임에 실제 위치로 이동 (트랜지션 적용)
        requestAnimationFrame(() => {
          cell.style.left = (tile.col * 25 + 0.6 * tile.col) + '%';
          cell.style.top = (tile.row * 25 + 0.6 * tile.row) + '%';
        });
        // 병합/신규 애니메이션
        if (tile.merged) {
          cell.animate([
            { transform: 'scale(1.1)' },
            { transform: 'scale(1.25)' },
            { transform: 'scale(1)' }
          ], { duration: 180 });
        }
        if (tile.new) {
          cell.animate([
            { transform: 'scale(0.1)' },
            { transform: 'scale(1.1)' },
            { transform: 'scale(1)' }
          ], { duration: 180 });
        }
      });
      // 사라진 타일 DOM 제거
      Object.keys(tileMap).forEach(id => {
        if (!tiles.find(t => t.id == id)) {
          let cell = tileMap[id];
          if (cell && cell.parentNode) cell.parentNode.removeChild(cell);
        }
      });

      // 게임오버 상태면 팝업 효과도 실행
      if (gameOver) {
        if (typeof overDiv.showEffect === 'function') overDiv.showEffect();
      } else {
        overDiv.style.display = 'none';
      }
    }

    function getTileColor(val) {
      switch(val) {
        case 0: return '#cdc1b4';
        case 2: return '#eee4da';
        case 4: return '#ede0c8';
        case 8: return '#f2b179';
        case 16: return '#f59563';
        case 32: return '#f67c5f';
        case 64: return '#f65e3b';
        case 128: return '#edcf72';
        case 256: return '#edcc61';
        case 512: return '#edc850';
        case 1024: return '#edc53f';
        case 2048: return '#edc22e';
        default: return '#3c3a32';
      }
    }

    function restart() {
      overDiv.style.display = 'none';
      // 모든 타일 DOM 제거
      Array.from(boardDiv.querySelectorAll('.tile')).forEach(cell => cell.remove());
      // 배경 격자도 새로 그리도록 bg-layer도 제거
      let bgLayer = boardDiv.querySelector('.bg-layer');
      if (bgLayer) bgLayer.remove();
      // 타일 배열도 초기화
      tiles = [];
      initBoard();
    }

    function move(dir) {
      if (gameOver || animating) return;
      let moved = false;
      let merged = Array(size * size).fill(false);
      // 타일 이동 전 위치 저장
      tiles.forEach(t => { t.lastRow = t.row; t.lastCol = t.col; t.merged = false; });
      function get(r, c) { return board[r * size + c]; }
      function set(r, c, v) { board[r * size + c] = v; }
      if (dir === 'left') {
        for (let r = 0; r < size; r++) {
          for (let c = 1; c < size; c++) {
            if (get(r, c) === 0) continue;
            let nc = c;
            while (nc > 0 && get(r, nc - 1) === 0) {
              set(r, nc - 1, get(r, nc));
              set(r, nc, 0);
              let tile = tiles.find(t => t.row === r && t.col === nc && !t.toRemove);
              if (tile) tile.col = nc - 1;
              nc--;
              moved = true;
            }
            if (nc > 0 && get(r, nc - 1) === get(r, nc) && !merged[r * size + nc - 1] && !merged[r * size + nc]) {
              set(r, nc - 1, get(r, nc) * 2);
              set(r, nc, 0);
              score += get(r, nc - 1);
              merged[r * size + nc - 1] = true;
              let tile = tiles.find(t => t.row === r && t.col === nc && !t.toRemove);
              let target = tiles.find(t => t.row === r && t.col === nc - 1 && !t.toRemove);
              if (tile) { tile.col = nc - 1; tile.toRemove = true; }
              if (target) { target.merged = true; target.value *= 2; }
              moved = true;
            }
          }
        }
      } else if (dir === 'right') {
        for (let r = 0; r < size; r++) {
          for (let c = size - 2; c >= 0; c--) {
            if (get(r, c) === 0) continue;
            let nc = c;
            while (nc < size - 1 && get(r, nc + 1) === 0) {
              set(r, nc + 1, get(r, nc));
              set(r, nc, 0);
              let tile = tiles.find(t => t.row === r && t.col === nc && !t.toRemove);
              if (tile) tile.col = nc + 1;
              nc++;
              moved = true;
            }
            if (nc < size - 1 && get(r, nc + 1) === get(r, nc) && !merged[r * size + nc + 1] && !merged[r * size + nc]) {
              set(r, nc + 1, get(r, nc) * 2);
              set(r, nc, 0);
              score += get(r, nc + 1);
              merged[r * size + nc + 1] = true;
              let tile = tiles.find(t => t.row === r && t.col === nc && !t.toRemove);
              let target = tiles.find(t => t.row === r && t.col === nc + 1 && !t.toRemove);
              if (tile) { tile.col = nc + 1; tile.toRemove = true; }
              if (target) { target.merged = true; target.value *= 2; }
              moved = true;
            }
          }
        }
      } else if (dir === 'up') {
        for (let c = 0; c < size; c++) {
          for (let r = 1; r < size; r++) {
            if (get(r, c) === 0) continue;
            let nr = r;
            while (nr > 0 && get(nr - 1, c) === 0) {
              set(nr - 1, c, get(nr, c));
              set(nr, c, 0);
              let tile = tiles.find(t => t.row === nr && t.col === c && !t.toRemove);
              if (tile) tile.row = nr - 1;
              nr--;
              moved = true;
            }
            if (nr > 0 && get(nr - 1, c) === get(nr, c) && !merged[(nr - 1) * size + c] && !merged[nr * size + c]) {
              set(nr - 1, c, get(nr, c) * 2);
              set(nr, c, 0);
              score += get(nr - 1, c);
              merged[(nr - 1) * size + c] = true;
              let tile = tiles.find(t => t.row === nr && t.col === c && !t.toRemove);
              let target = tiles.find(t => t.row === nr - 1 && t.col === c && !t.toRemove);
              if (tile) { tile.row = nr - 1; tile.toRemove = true; }
              if (target) { target.merged = true; target.value *= 2; }
              moved = true;
            }
          }
        }
      } else if (dir === 'down') {
        for (let c = 0; c < size; c++) {
          for (let r = size - 2; r >= 0; r--) {
            if (get(r, c) === 0) continue;
            let nr = r;
            while (nr < size - 1 && get(nr + 1, c) === 0) {
              set(nr + 1, c, get(nr, c));
              set(nr, c, 0);
              let tile = tiles.find(t => t.row === nr && t.col === c && !t.toRemove);
              if (tile) tile.row = nr + 1;
              nr++;
              moved = true;
            }
            if (nr < size - 1 && get(nr + 1, c) === get(nr, c) && !merged[(nr + 1) * size + c] && !merged[nr * size + c]) {
              set(nr + 1, c, get(nr, c) * 2);
              set(nr, c, 0);
              score += get(nr + 1, c);
              merged[(nr + 1) * size + c] = true;
              let tile = tiles.find(t => t.row === nr && t.col === c && !t.toRemove);
              let target = tiles.find(t => t.row === nr + 1 && t.col === c && !t.toRemove);
              if (tile) { tile.row = nr + 1; tile.toRemove = true; }
              if (target) { target.merged = true; target.value *= 2; }
              moved = true;
            }
          }
        }
      }
      if (moved) {
        addRandomTile();
        updateTilesFromBoard();
        update();
        setTimeout(() => {
          tiles = tiles.filter(t => !t.toRemove);
          update();
        }, 180);
        if (isGameOver()) {
          gameOver = true;
          update();
        }
      }
    }

    function isGameOver() {
      for (let i = 0; i < board.length; i++) if (board[i] === 0) return false;
      // Check for possible merges
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const v = board[r * size + c];
          if (c < size - 1 && v === board[r * size + c + 1]) return false;
          if (r < size - 1 && v === board[(r + 1) * size + c]) return false;
        }
      }
      return true;
    }


    // AI 자동 플레이 기능
    let aiInterval = null;
    function aiBestMove() {
      // 단순 우선순위: 오른쪽 > 아래 > 왼쪽 > 위 (움직임이 있으면 그 방향)
      const dirs = ['right', 'down', 'left', 'up'];
      for (let dir of dirs) {
        // 현재 상태 백업
        const boardBackup = board.slice();
        let moved = false;
        let merged = Array(size * size).fill(false);
        let tempBoard = boardBackup.slice();
        // 임시 get/set (실제 board가 아닌 tempBoard만 참조)
        function get(r, c) { return tempBoard[r * size + c]; }
        function set(r, c, v) { tempBoard[r * size + c] = v; }
        if (dir === 'left') {
          for (let r = 0; r < size; r++) {
            for (let c = 1; c < size; c++) {
              if (get(r, c) === 0) continue;
              let nc = c;
              while (nc > 0 && get(r, nc - 1) === 0) {
                set(r, nc - 1, get(r, nc));
                set(r, nc, 0);
                nc--;
                moved = true;
              }
              if (nc > 0 && get(r, nc - 1) === get(r, nc) && !merged[r * size + nc - 1] && !merged[r * size + nc]) {
                set(r, nc - 1, get(r, nc) * 2);
                set(r, nc, 0);
                merged[r * size + nc - 1] = true;
                moved = true;
              }
            }
          }
        } else if (dir === 'right') {
          for (let r = 0; r < size; r++) {
            for (let c = size - 2; c >= 0; c--) {
              if (get(r, c) === 0) continue;
              let nc = c;
              while (nc < size - 1 && get(r, nc + 1) === 0) {
                set(r, nc + 1, get(r, nc));
                set(r, nc, 0);
                nc++;
                moved = true;
              }
              if (nc < size - 1 && get(r, nc + 1) === get(r, nc) && !merged[r * size + nc + 1] && !merged[r * size + nc]) {
                set(r, nc + 1, get(r, nc) * 2);
                set(r, nc, 0);
                merged[r * size + nc + 1] = true;
                moved = true;
              }
            }
          }
        } else if (dir === 'up') {
          for (let c = 0; c < size; c++) {
            for (let r = 1; r < size; r++) {
              if (get(r, c) === 0) continue;
              let nr = r;
              while (nr > 0 && get(nr - 1, c) === 0) {
                set(nr - 1, c, get(nr, c));
                set(nr, c, 0);
                nr--;
                moved = true;
              }
              if (nr > 0 && get(nr - 1, c) === get(nr, c) && !merged[(nr - 1) * size + c] && !merged[nr * size + c]) {
                set(nr - 1, c, get(nr, c) * 2);
                set(nr, c, 0);
                merged[(nr - 1) * size + c] = true;
                moved = true;
              }
            }
          }
        } else if (dir === 'down') {
          for (let c = 0; c < size; c++) {
            for (let r = size - 2; r >= 0; r--) {
              if (get(r, c) === 0) continue;
              let nr = r;
              while (nr < size - 1 && get(nr + 1, c) === 0) {
                set(nr + 1, c, get(nr, c));
                set(nr, c, 0);
                nr++;
                moved = true;
              }
              if (nr < size - 1 && get(nr + 1, c) === get(nr, c) && !merged[(nr + 1) * size + c] && !merged[nr * size + c]) {
                set(nr + 1, c, get(nr, c) * 2);
                set(nr, c, 0);
                merged[(nr + 1) * size + c] = true;
                moved = true;
              }
            }
          }
        }
        // 변화가 있으면 그 방향 반환
        if (moved) return dir;
      }
      return null;
    }

    function aiStart() {
      if (aiInterval) return;
      aiInterval = setInterval(() => {
        if (gameOver) { aiStop(); return; }
        const dir = aiBestMove();
        if (dir) move(dir);
        else aiStop();
      }, 220);
    }
    function aiStop() {
      if (aiInterval) clearInterval(aiInterval);
      aiInterval = null;
    }

    // AI 버튼 UI 추가
    const aiBtn = document.createElement('button');
    aiBtn.textContent = 'AI 플레이';
    aiBtn.style.fontSize = '1rem';
    aiBtn.style.marginLeft = '1.2em';
    aiBtn.style.padding = '0.3em 1.1em';
    aiBtn.style.borderRadius = '0.5em';
    aiBtn.style.border = 'none';
    aiBtn.style.background = '#6c7ae0';
    aiBtn.style.color = '#fff';
    aiBtn.style.cursor = 'pointer';
    aiBtn.onclick = function() {
      if (aiInterval) {
        aiStop();
        aiBtn.textContent = 'AI 플레이';
      } else {
        aiStart();
        aiBtn.textContent = 'AI 정지';
      }
    };
    topBar.appendChild(aiBtn);

    // Keyboard controls
    function onKey(e) {
      if (gameOver) return;
      if (e.key === 'ArrowLeft') move('left');
      else if (e.key === 'ArrowRight') move('right');
      else if (e.key === 'ArrowUp') move('up');
      else if (e.key === 'ArrowDown') move('down');
    }
    window.addEventListener('keydown', onKey);

    // Touch controls (swipe)
    let touchStartX = 0, touchStartY = 0;
    boardDiv.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    });
    boardDiv.addEventListener('touchend', e => {
      if (e.changedTouches.length === 1) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
          move(dx > 0 ? 'right' : 'left');
        } else if (Math.abs(dy) > 20) {
          move(dy > 0 ? 'down' : 'up');
        }
      }
    });

    // Clean up event listeners on exit
    function cleanup() {
      window.removeEventListener('keydown', onKey);
    }
    // Expose cleanup for launcher
    window._2048_cleanup = cleanup;

    initBoard();
  }
  window.start2048Game = start2048Game;
})();
