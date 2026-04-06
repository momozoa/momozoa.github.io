// js/roguelike.js
// 심플 로그라이크 미니게임 (Vanilla JS)
// Exports: window.startRoguelikeGame(containerId, onHome)

(function() {
  function startRoguelikeGame(containerId, onHome) {
    const width = 15, height = 11;
    const tileSize = 32;
    const map = [];
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.background = 'transparent'; // 배경색 제거
    container.style.overflow = 'hidden';

    // Title & Home button
    const topBar = document.createElement('div');
    topBar.style.display = 'flex';
    topBar.style.justifyContent = 'space-between';
    topBar.style.alignItems = 'center';
    topBar.style.marginBottom = '1.2rem';
    const title = document.createElement('div');
    title.textContent = 'Roguelike';
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

    // Game area
    const gameDiv = document.createElement('div');
    gameDiv.style.width = width * tileSize + 'px';
    gameDiv.style.height = height * tileSize + 'px';
    gameDiv.style.background = 'transparent';
    gameDiv.style.position = 'relative';
    gameDiv.style.margin = '0 auto';
    gameDiv.style.border = '2px solid #444';
    //gameDiv.style.borderRadius = '1em'; // 보더 라디우스 제거
    container.appendChild(gameDiv);

    // 설명(플레이 방법)
    const howToDiv = document.createElement('div');
    howToDiv.style.fontSize = '0.98rem';
    howToDiv.style.margin = '1.1em auto 0.7em auto';
    howToDiv.style.color = '#bbb';
    howToDiv.style.maxWidth = (width * tileSize) + 'px';
    howToDiv.innerHTML = `
      <b>플레이 방법</b><br>
      - 방향키(←↑↓→)로 플레이어(@)를 이동하세요.<br>
      - 몬스터(M)와 부딪히면 전투가 발생합니다.<br>
      - 포션(!)을 먹으면 HP가 회복됩니다.<br>
      - 몬스터에게 HP가 0이 되면 게임 오버입니다.<br>
      - Home 버튼으로 메인 메뉴로 돌아갑니다.
    `;
    container.appendChild(howToDiv);

    // Player, monsters, items
    let player = {x: 1, y: 1, hp: 10, maxHp: 10, atk: 2, symbol: '🧑‍🎤'}; // 플레이어 아이콘
    let monsters = [];
    let items = [];
    let message = '';
    let gameOver = false;

    function randomFloor() {
      let x, y;
      do {
        x = Math.floor(Math.random() * width);
        y = Math.floor(Math.random() * height);
      } while (map[y][x] !== '.');
      return {x, y};
    }

    function generateMap() {
      for (let y = 0; y < height; y++) {
        map[y] = [];
        for (let x = 0; x < width; x++) {
          if (y === 0 || y === height-1 || x === 0 || x === width-1 || Math.random() < 0.12) {
            map[y][x] = '#'; // wall
          } else {
            map[y][x] = '.'; // floor
          }
        }
      }
      // 보장: 플레이어 시작 위치는 바닥
      map[1][1] = '.';
    }

    function spawnMonsters(n) {
      monsters = [];
      for (let i = 0; i < n; i++) {
        let pos = randomFloor();
        monsters.push({x: pos.x, y: pos.y, hp: 3, symbol: '👾'}); // 몬스터 아이콘
      }
    }
    function spawnItems(n) {
      items = [];
      for (let i = 0; i < n; i++) {
        let pos = randomFloor();
        items.push({x: pos.x, y: pos.y, type: 'potion', symbol: '🧪'}); // 포션 아이콘
      }
    }

    function draw() {
      gameDiv.innerHTML = '';
      // Draw map
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const tile = document.createElement('div');
          tile.style.position = 'absolute';
          tile.style.left = x * tileSize + 'px';
          tile.style.top = y * tileSize + 'px';
          tile.style.width = tileSize + 'px';
          tile.style.height = tileSize + 'px';
          tile.style.background = map[y][x] === '#' ? '#444' : '#222';
          tile.style.border = '1px solid #333';
          gameDiv.appendChild(tile);
        }
      }
      // Draw items
      items.forEach(item => {
        const el = document.createElement('div');
        el.textContent = item.symbol;
        el.style.position = 'absolute';
        el.style.left = item.x * tileSize + 'px';
        el.style.top = item.y * tileSize + 'px';
        el.style.width = tileSize + 'px';
        el.style.height = tileSize + 'px';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontWeight = 'bold';
        el.style.fontSize = '1.3em';
        el.style.color = '#6cf';
        gameDiv.appendChild(el);
      });
      // Draw monsters
      monsters.forEach(m => {
        const el = document.createElement('div');
        el.textContent = m.symbol;
        el.style.position = 'absolute';
        el.style.left = m.x * tileSize + 'px';
        el.style.top = m.y * tileSize + 'px';
        el.style.width = tileSize + 'px';
        el.style.height = tileSize + 'px';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontWeight = 'bold';
        el.style.fontSize = '1.3em';
        el.style.color = '#f66';
        gameDiv.appendChild(el);
      });
      // Draw player
      const pel = document.createElement('div');
      pel.textContent = player.symbol;
      pel.style.position = 'absolute';
      pel.style.left = player.x * tileSize + 'px';
      pel.style.top = player.y * tileSize + 'px';
      pel.style.width = tileSize + 'px';
      pel.style.height = tileSize + 'px';
      pel.style.display = 'flex';
      pel.style.alignItems = 'center';
      pel.style.justifyContent = 'center';
      pel.style.fontWeight = 'bold';
      pel.style.fontSize = '1.3em';
      pel.style.color = '#ff0';
      gameDiv.appendChild(pel);
      // Draw UI (HP만 표시, 메시지는 별도 영역에 스크롤)
      // 기존 HP UI가 여러 번 쌓이지 않도록 먼저 제거
      let prevUi = document.getElementById('rogue-hp-ui');
      if (prevUi) prevUi.remove();
      let ui = document.createElement('div');
      ui.id = 'rogue-hp-ui';
      ui.style.marginTop = '1em';
      ui.style.color = '#fff';
      ui.style.fontSize = '1.1em';
      ui.innerHTML = `HP: ${player.hp} / ${player.maxHp}`;
      container.appendChild(ui);

      // 메시지(히스토리) 영역 (스크롤)
      let msgDiv = document.getElementById('rogue-msg-div');
      if (!msgDiv) {
        msgDiv = document.createElement('div');
        msgDiv.id = 'rogue-msg-div';
        msgDiv.style.background = 'rgba(0,0,0,0.18)';
        msgDiv.style.color = '#fff';
        msgDiv.style.fontSize = '0.98em';
        msgDiv.style.margin = '0.5em auto 0.5em auto';
        msgDiv.style.maxWidth = (width * tileSize) + 'px';
        msgDiv.style.height = '2.2em';
        msgDiv.style.overflowY = 'auto';
        msgDiv.style.borderRadius = '0.5em';
        msgDiv.style.padding = '0.3em 0.7em';
        container.appendChild(msgDiv);
      }
      msgDiv.innerHTML = message ? message : '';
      if (gameOver) {
        let overDiv = document.getElementById('roguelike-game-over');
        if (!overDiv) {
          overDiv = document.createElement('div');
          overDiv.id = 'roguelike-game-over';
          overDiv.style.position = 'absolute';
          overDiv.style.left = '50%';
          overDiv.style.top = '50%';
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
            '<button id="roguelike-restart-btn" style="margin-top:1.1rem;font-size:1.05rem;padding:0.4rem 1.3rem;border-radius:0.5rem;border:none;background:#36A2EB;color:#fff;cursor:pointer;">Restart</button>';
          gameDiv.appendChild(overDiv);

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
        document.getElementById('roguelike-restart-btn').onclick = () => {
          overDiv.remove();
          window.startRoguelikeGame(containerId, onHome);
        };
      }
    }

    function tryMove(dx, dy) {
      if (gameOver) return;
      const nx = player.x + dx, ny = player.y + dy;
      if (map[ny][nx] === '#') {
        message = '벽입니다!';
        draw();
        return;
      }
      // 몬스터가 있으면 공격
      let m = monsters.find(mon => mon.x === nx && mon.y === ny);
      if (m) {
        m.hp -= player.atk;
        message = '몬스터를 공격!';
        if (m.hp <= 0) {
          monsters = monsters.filter(mon => mon !== m);
          message = '몬스터를 처치!';
        }
        draw();
        return;
      }
      // 아이템이 있으면 획득
      let item = items.find(it => it.x === nx && it.y === ny);
      if (item) {
        if (item.type === 'potion') {
          player.hp = Math.min(player.maxHp, player.hp + 5);
          message = '포션을 마셨다!';
        }
        items = items.filter(it => it !== item);
      }
      player.x = nx; player.y = ny;
      draw();
    }

    // 몬스터가 계속 움직이도록 애니메이션 타이머 사용
    let monsterMoveTimer = null;
    function monsterTurn() {
      if (gameOver) return;
      monsters.forEach(m => {
        // 단순 AI: 플레이어가 인접하면 공격, 아니면 랜덤 이동
        let dx = player.x - m.x, dy = player.y - m.y;
        if (Math.abs(dx) + Math.abs(dy) === 1) {
          player.hp -= 2;
          message = '몬스터에게 공격당했다!';
          if (player.hp <= 0) gameOver = true;
        } else {
          let dirs = [ [1,0], [-1,0], [0,1], [0,-1] ];
          let d = dirs[Math.floor(Math.random()*dirs.length)];
          let nx = m.x + d[0], ny = m.y + d[1];
          if (map[ny][nx] === '.' && !monsters.find(mon => mon.x === nx && mon.y === ny) && (player.x !== nx || player.y !== ny)) {
            m.x = nx; m.y = ny;
          }
        }
      });
      draw();
    }

    function startMonsterMoveLoop() {
      if (monsterMoveTimer) clearInterval(monsterMoveTimer);
      monsterMoveTimer = setInterval(() => {
        if (!gameOver) monsterTurn();
      }, 400); // 0.4초마다 몬스터 이동
    }

    function stopMonsterMoveLoop() {
      if (monsterMoveTimer) clearInterval(monsterMoveTimer);
      monsterMoveTimer = null;
    }

    function onKey(e) {
      if (gameOver) return;
      if (e.key === 'ArrowLeft') tryMove(-1,0);
      else if (e.key === 'ArrowRight') tryMove(1,0);
      else if (e.key === 'ArrowUp') tryMove(0,-1);
      else if (e.key === 'ArrowDown') tryMove(0,1);
    }
    window.addEventListener('keydown', onKey);

    // Clean up
    function cleanup() {
      window.removeEventListener('keydown', onKey);
      stopMonsterMoveLoop();
      // 로그/HP UI 영역 제거
      const hpUi = document.getElementById('rogue-hp-ui');
      if (hpUi) hpUi.remove();
      const msgDiv = document.getElementById('rogue-msg-div');
      if (msgDiv) msgDiv.remove();
    }
    window._roguelike_cleanup = cleanup;

    // Init
    generateMap();
    spawnMonsters(4);
    spawnItems(3);
    draw();
    startMonsterMoveLoop();
  }
  window.startRoguelikeGame = startRoguelikeGame;
})();
