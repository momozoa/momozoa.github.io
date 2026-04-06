// Tetris Mini Game (modular, for mini-game collection)
// Exported as startTetrisGame for dynamic loading

// Tetris Mini Game (browser, for mini-game collection)
// Exports window.startTetrisGame for dynamic loading
window.startTetrisGame = function(containerId = 'game-container', homeCallback) {
  const config = {
    rows: 20,
    cols: 10,
    blockSize: 30,
    colors: [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#222'
    ],
    bg: '#222', // 추가: 테트리스 보드 배경색
    shapes: [
      [[1, 1, 1, 1]],
      [[1, 1], [1, 1]],
      [[0, 1, 0], [1, 1, 1]],
      [[0, 1, 1], [1, 1, 0]],
      [[1, 1, 0], [0, 1, 1]],
      [[1, 0, 0], [1, 1, 1]],
      [[0, 0, 1], [1, 1, 1]]
    ]
  };
  let state = {
    board: Array.from({ length: config.rows }, () => Array(config.cols).fill(0)),
    current: null,
    currentX: 0,
    currentY: 0,
    currentColor: 0,
    score: 0,
    gameOver: false,
    timer: null
  };
  // Remove previous content
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  // Header with title and Home button
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'center';
  header.style.marginBottom = '1rem';
  header.style.gap = '1.5rem';
  header.innerHTML = `
    <span style="font-size:2rem;font-weight:bold;">Tetris</span>
    <button id="home-btn" style="font-size:1rem;padding:0.4rem 1.2rem;border-radius:0.5rem;border:none;background:#36A2EB;color:#fff;cursor:pointer;">Home</button>
  `;
  container.appendChild(header);
  if (typeof homeCallback === 'function') {
    header.querySelector('#home-btn').onclick = () => {
      if (state && state.cleanup) state.cleanup();
      container.innerHTML = '';
      homeCallback();
    };
  }
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = config.cols * config.blockSize;
  canvas.height = config.rows * config.blockSize;
  canvas.style.background = config.bg;
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';
  container.appendChild(canvas);
  // Score
  const scoreDiv = document.createElement('div');
  scoreDiv.id = 'tetris-score';
  scoreDiv.style.textAlign = 'center';
  scoreDiv.style.fontSize = '1.2rem';
  scoreDiv.style.color = '#fff';
  scoreDiv.style.margin = '0.5rem 0 1rem 0';
  container.insertBefore(scoreDiv, canvas);

  function randomShape() {
    const idx = Math.floor(Math.random() * config.shapes.length);
    return {
      shape: config.shapes[idx].map(row => [...row]),
      color: idx + 1
    };
  }
  function spawn() {
    const { shape, color } = randomShape();
    state.current = shape;
    state.currentColor = color;
    state.currentX = Math.floor((config.cols - shape[0].length) / 2);
    state.currentY = 0;
    if (!valid(state.currentX, state.currentY, shape)) {
      state.gameOver = true;
      draw();
      showGameOver();
      return false;
    }
    return true;
  }
  function valid(x, y, shape) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const nx = x + c;
          const ny = y + r;
          if (nx < 0 || nx >= config.cols || ny < 0 || ny >= config.rows) return false;
          if (state.board[ny][nx]) return false;
        }
      }
    }
    return true;
  }
  function merge() {
    const { current, currentColor, currentX, currentY } = state;
    for (let r = 0; r < current.length; r++) {
      for (let c = 0; c < current[r].length; c++) {
        if (current[r][c]) {
          state.board[currentY + r][currentX + c] = currentColor;
        }
      }
    }
  }
  function clearLines() {
    let lines = 0;
    for (let r = config.rows - 1; r >= 0; r--) {
      if (state.board[r].every(x => x)) {
        state.board.splice(r, 1);
        state.board.unshift(Array(config.cols).fill(0));
        lines++;
        r++;
      }
    }
    if (lines > 0) state.score += [0, 100, 300, 500, 800][lines] || lines * 200;
  }
  function draw() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 배경색 채우기
    ctx.save();
    ctx.fillStyle = config.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        if (state.board[r][c]) {
          ctx.fillStyle = config.colors[state.board[r][c] - 1];
          ctx.fillRect(c * config.blockSize, r * config.blockSize, config.blockSize, config.blockSize);
          ctx.strokeStyle = '#222';
          ctx.strokeRect(c * config.blockSize, r * config.blockSize, config.blockSize, config.blockSize);
        }
      }
    }
    if (state.current && !state.gameOver) {
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = config.colors[state.currentColor - 1];
      for (let r = 0; r < state.current.length; r++) {
        for (let c = 0; c < state.current[r].length; c++) {
          if (state.current[r][c]) {
            ctx.fillRect((state.currentX + c) * config.blockSize, (state.currentY + r) * config.blockSize, config.blockSize, config.blockSize);
            ctx.strokeStyle = '#222';
            ctx.strokeRect((state.currentX + c) * config.blockSize, (state.currentY + r) * config.blockSize, config.blockSize, config.blockSize);
          }
        }
      }
      ctx.restore();
    }
    scoreDiv.textContent = 'Score: ' + state.score;
  }
  function drop() {
    if (state.gameOver) return;
    if (valid(state.currentX, state.currentY + 1, state.current)) {
      state.currentY++;
    } else {
      merge();
      clearLines();
      if (!spawn()) return;
    }
    draw();
  }
  function move(dx) {
    if (state.gameOver) return;
    if (valid(state.currentX + dx, state.currentY, state.current)) {
      state.currentX += dx;
      draw();
    }
  }
  function rotate() {
    if (state.gameOver) return;
    const shape = state.current;
    const rotated = shape[0].map((_, i) => shape.map(row => row[i]).reverse());
    if (valid(state.currentX, state.currentY, rotated)) {
      state.current = rotated;
      draw();
    }
  }
  function hardDrop() {
    if (state.gameOver) return;
    while (valid(state.currentX, state.currentY + 1, state.current)) {
      state.currentY++;
    }
    drop();
  }
  function keyHandler(e) {
    if (state.gameOver) return;
    if (e.key === 'ArrowLeft') move(-1);
    else if (e.key === 'ArrowRight') move(1);
    else if (e.key === 'ArrowDown') drop();
    else if (e.key === 'ArrowUp' || e.key === 'x') rotate();
    else if (e.key === ' ' || e.key === 'z') hardDrop();
  }
  function showGameOver() {
    let overDiv = document.getElementById('tetris-game-over');
    if (!overDiv) {
      overDiv = document.createElement('div');
      overDiv.id = 'tetris-game-over';
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
        '<button id="tetris-restart-btn" style="margin-top:1.1rem;font-size:1.05rem;padding:0.4rem 1.3rem;border-radius:0.5rem;border:none;background:#36A2EB;color:#fff;cursor:pointer;">Restart</button>';
      document.body.appendChild(overDiv);

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
    document.getElementById('tetris-restart-btn').onclick = () => {
      overDiv.remove();
      window.startTetrisGame(containerId, homeCallback);
    };
  }
  // Start game
  spawn();
  draw();
  state.timer = setInterval(drop, 500);
  window.addEventListener('keydown', keyHandler);
  // Clean up on exit (if needed)
  state.cleanup = () => {
    clearInterval(state.timer);
    window.removeEventListener('keydown', keyHandler);
  };
  // Expose cleanup for main menu switching
  window.tetrisState = state;
};
