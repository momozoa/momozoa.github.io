
function updateBoard(withDropAnim = false) {
  const candies = document.querySelectorAll('.candy');
  if (withDropAnim) {
    // 1. 기존 위치 저장
    const oldRects = [];
    for (let i = 0; i < candies.length; i++) {
      oldRects.push(candies[i].getBoundingClientRect());
    }
    // 2. 내용 갱신 (색/아이콘)
    for (let i = 0; i < board.length; i++) {
      candies[i].style.background = board[i].color;
      candies[i].innerText = board[i].icon;
      candies[i].style.outline = '';
      // 삭제된(빈) 칸은 투명하게 표시
      if (!board[i].color) {
        candies[i].style.opacity = '0';
        candies[i].style.transform = 'scale(0.1)';
      } else {
        candies[i].style.opacity = '1';
        candies[i].style.transform = '';
      }
    }
    // 3. 새 위치 저장 (requestAnimationFrame으로 DOM 렌더링 보장)
    requestAnimationFrame(() => {
      const newRects = [];
      for (let i = 0; i < candies.length; i++) {
        newRects.push(candies[i].getBoundingClientRect());
      }
      // 4. 이동한 칸에 transform 적용
      for (let i = 0; i < candies.length; i++) {
        const dx = oldRects[i].left - newRects[i].left;
        const dy = oldRects[i].top - newRects[i].top;
        if (dx !== 0 || dy !== 0) {
          candies[i].style.transition = 'none';
          candies[i].style.transform = `translate(${dx}px, ${dy}px)`;
        } else {
          candies[i].style.transition = '';
          candies[i].style.transform = '';
        }
      }
      // 5. 트랜지션 적용하며 원래 위치로 이동
      requestAnimationFrame(() => {
        for (let i = 0; i < candies.length; i++) {
          if (candies[i].style.transform && candies[i].style.transform !== 'none' && candies[i].style.transform !== '') {
            candies[i].style.transition = 'transform 0.7s cubic-bezier(0.4,0.2,0.2,1)';
            candies[i].style.transform = '';
          }
        }
        // 6. 트랜지션 끝나면 스타일 리셋
        setTimeout(() => {
          for (let i = 0; i < candies.length; i++) {
            candies[i].style.transition = '';
          }
        }, 800);
      });
    });
  } else {
    for (let i = 0; i < board.length; i++) {
      candies[i].style.background = board[i].color;
      candies[i].innerText = board[i].icon;
      candies[i].style.outline = '';
      if (!board[i].color) {
        candies[i].style.opacity = '0';
        candies[i].style.transform = 'scale(0.1)';
      } else {
        candies[i].style.opacity = '1';
        candies[i].style.transform = '';
      }
    }
  }
}

function clearSelection() {
  selected = null;
  document.querySelectorAll('.candy').forEach(div => div.style.outline = '');
}

function clearMatches() {
  let matches = findMatchesWithGroups();
  const candies = document.querySelectorAll('.candy');
  function animateAndRemove(matchIndices, callback) {
    // 1. 매칭된 아이템 커지는 애니메이션
    for (const idx of matchIndices) {
      const div = candies[idx];
      if (div) {
        div.style.transition = 'transform 0.3s cubic-bezier(0.4,0.2,0.2,1)';
        div.style.transform = 'scale(1.4)';
        div.style.opacity = '1';
      }
    }
    // 2. 잠깐 대기 후 사라짐 효과
    setTimeout(() => {
      for (const idx of matchIndices) {
        const div = candies[idx];
        if (div) {
          div.style.transition = 'transform 0.2s, opacity 0.2s';
          div.style.transform = 'scale(0.1)';
          div.style.opacity = '0';
        }
      }
      // 3. 사라진 상태로 DOM만 갱신 (board 데이터는 그대로)
      setTimeout(() => {
        if (typeof callback === 'function') callback();
      }, 200);
    }, 300);
  }

  function doClear() {
    matches = findMatchesWithGroups();
    if (matches.groups.length === 0) {
      // 매칭이 더 이상 없으면 게임 오버 체크
      setTimeout(() => {
        if (!hasPossibleMoves()) {
          showGameOver();
        }
      }, 100);
      return;
    }
    // 점수 계산: 그룹별로 3개=30, 4개=60, 5개=100, 그 이상은 100+20*(n-5)
    for (const group of matches.groups) {
      let n = group.length;
      let add = 0;
      if (n === 3) add = 30;
      else if (n === 4) add = 60;
      else if (n === 5) add = 100;
      else if (n > 5) add = 100 + 20 * (n - 5);
      score += add;
    }
    updateScore();
    // 매칭된 아이템 애니메이션 후 제거
    animateAndRemove(matches.all, () => {
      // 실제로 보드에서 제거 (이 시점에 board 데이터 null 처리)
      for (const idx of matches.all) {
        board[idx].color = null;
        board[idx].icon = null;
      }
      // DOM을 완전히 지우고(투명/축소) -> dropCandies/fillEmpty -> updateBoard(true)로 애니메이션
      updateBoard();
      // 충분히 DOM이 갱신된 후(즉시) 드롭 처리
      setTimeout(() => {
        dropCandies();
        fillEmpty();
        updateBoard(true); // drop 애니메이션 적용
        setTimeout(() => {
          doClear(); // 연쇄 매치 처리
        }, 800); // 드롭 애니메이션 시간과 맞춤
      }, 30);
    });
  }
  doClear();
}


// 그룹별로 매치 정보를 반환 (점수 계산용)
function findMatchesWithGroups() {
  const all = [];
  const groups = [];
  const visited = Array(board.length).fill(false);

  // Horizontal
  for (let row = 0; row < boardSize; row++) {
    let col = 0;
    while (col < boardSize - 2) {
      const idx = getIndex(row, col);
      const color = board[idx].color;
      if (
        color &&
        color === board[getIndex(row, col + 1)].color &&
        color === board[getIndex(row, col + 2)].color
      ) {
        // 몇 개 연속인지 확인
        let match = [idx];
        let c = col + 1;
        while (c < boardSize && board[getIndex(row, c)].color === color) {
          match.push(getIndex(row, c));
          c++;
        }
        // 그룹 저장
        for (const i of match) visited[i] = true;
        groups.push(match);
        all.push(...match);
        col += match.length;
      } else {
        col++;
      }
    }
  }
  // Vertical
  for (let col = 0; col < boardSize; col++) {
    let row = 0;
    while (row < boardSize - 2) {
      const idx = getIndex(row, col);
      const color = board[idx].color;
      if (
        color &&
        color === board[getIndex(row + 1, col)].color &&
        color === board[getIndex(row + 2, col)].color
      ) {
        let match = [idx];
        let r = row + 1;
        while (r < boardSize && board[getIndex(r, col)].color === color) {
          match.push(getIndex(r, col));
          r++;
        }
        // 이미 그룹에 포함된 칸은 제외 (가로/세로 중복 방지)
        const filtered = match.filter(i => !visited[i]);
        if (filtered.length > 0) {
          for (const i of filtered) visited[i] = true;
          groups.push(filtered);
          all.push(...filtered);
        }
        row += match.length;
      } else {
        row++;
      }
    }
  }
  return { all: [...new Set(all)], groups };
}

function dropCandies() {
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
  // 각 컬럼별로 위에서부터 빈 칸을 채움 (상단에서 새 블럭이 생성되어 아래로 내려오는 효과)
  for (let col = 0; col < boardSize; col++) {
    let emptyCount = 0;
    // 아래에서 위로 스캔
    for (let row = boardSize - 1; row >= 0; row--) {
      const idx = getIndex(row, col);
      if (!board[idx].color) {
        emptyCount++;
      } else if (emptyCount > 0) {
        // 아래로 내림
        board[getIndex(row + emptyCount, col)].color = board[idx].color;
        board[getIndex(row + emptyCount, col)].icon = board[idx].icon;
        board[idx].color = null;
        board[idx].icon = null;
      }
    }
    // 맨 위에 새 블럭 생성
    for (let r = 0; r < emptyCount; r++) {
      const type = candyTypes[Math.floor(Math.random() * candyTypes.length)];
      board[getIndex(r, col)].color = type.color;
      board[getIndex(r, col)].icon = type.icon;
    }
  }
}


// Mini-game list and launcher (imported from js/gameList.js)
let miniGames = [];
// Dynamically load the game list from js/gameList.js (ESM import via dynamic script)
function loadGameList(callback) {
  const script = document.createElement('script');
  script.type = 'module';
  script.src = 'js/gameList.js?v=' + Date.now();
  script.onload = () => {
    // The module will set window.__miniGames
    if (window.__miniGames) {
      miniGames = window.__miniGames;
      callback && callback();
    } else {
      alert('게임 목록을 불러오지 못했습니다. 새로고침 해주세요.');
    }
  };
  script.onerror = () => alert('게임 목록을 불러오지 못했습니다. 새로고침 해주세요.');
  document.body.appendChild(script);
}

function showGameList() {
  const listDiv = document.getElementById('game-list');
  // Use square icons for each game
  listDiv.innerHTML = '<div style="display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;margin-top:1.2rem;">' +
    miniGames.map(game => {
      // Use icon from gameList.js, fallback to 🎮
      let icon = game.icon || '🎮';
      return `
        <div class="game-tile" data-game="${game.id}" style="width:90px;height:90px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff;border-radius:1.1rem;box-shadow:0 2px 10px #0001;cursor:pointer;transition:transform 0.15s;gap:0.3em;margin-bottom:1.2rem;user-select:none;">
          <span style="font-size:2.2rem;">${icon}</span>
          <span style="font-size:1.1rem;font-weight:500;color:#333;">${game.name}</span>
        </div>
      `;
    }).join('') + '</div>';
  // Add click handlers
  Array.from(listDiv.querySelectorAll('.game-tile')).forEach(tile => {
    tile.onclick = () => {
      const game = miniGames.find(g => g.id === tile.dataset.game);
      if (game) launchGame(game);
    };
    tile.onpointerdown = () => tile.style.transform = 'scale(0.96)';
    tile.onpointerup = tile.onpointerleave = () => tile.style.transform = '';
  });
  listDiv.style.display = '';
  document.getElementById('game-container').style.display = 'none';
  document.getElementById('score').style.display = 'none';
}

function launchGame(game) {
  // Clean up previous game
  if (window.tetrisState && window.tetrisState.cleanup) window.tetrisState.cleanup();
  if (window._roguelike_cleanup) window._roguelike_cleanup();
  document.getElementById('game-container').innerHTML = '';
  document.getElementById('game-list').style.display = 'none';
  document.getElementById('game-container').style.display = '';
  if (game.id === 'match3') {
    document.getElementById('score').style.display = '';
  } else {
    document.getElementById('score').style.display = 'none';
  }
  // Dynamically import the game module and start
  // Always load the latest game module (avoid caching issues and global scope problems)
  if (window[game.start]) {
    // Remove and reload script to ensure fresh module and correct export
    const oldScript = document.querySelector('script[data-game-module="' + game.id + '"]');
    if (oldScript) oldScript.remove();
    delete window[game.start];
  }
  const script = document.createElement('script');
  script.src = game.module + '?v=' + Date.now();
  script.setAttribute('data-game-module', game.id);
  script.onload = () => {
    if (typeof window[game.start] === 'function') {
      window[game.start]('game-container', showGameList);
    } else {
      alert('게임 모듈을 불러오지 못했습니다. 새로고침 해주세요.');
    }
  };
  document.body.appendChild(script);
}

window.onload = () => {
  // Load the game list, then show menu
  loadGameList(showGameList);
};
