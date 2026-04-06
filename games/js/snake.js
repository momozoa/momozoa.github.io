// Snake Game (browser, for mini-game collection)
// Exports window.startSnakeGame for dynamic loading
window.startSnakeGame = function(containerId = 'game-container', homeCallback) {
  const config = {
    rows: 20,
    cols: 20,
    cellSize: 24,
    speed: 120, // ms per move
    colors: {
      bg: '#222',
      snake: '#36A2EB',
      head: '#FFCE56',
      food: '#FF6384',
      grid: '#333'
    }
  };
  let state = {
    snake: [{x: 10, y: 10}],
    dir: {x: 1, y: 0},
    nextDir: {x: 1, y: 0},
    food: {x: 15, y: 10},
    score: 0,
    timer: null,
    gameOver: false
  };
  // Remove previous content
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  // Header with title, Home button, and Score
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'center';
  header.style.marginBottom = '1rem';
  header.style.gap = '1.5rem';
  header.innerHTML = `
    <span style="font-size:2rem;font-weight:bold;">Snake</span>
    <button id="home-btn" style="font-size:1rem;padding:0.4rem 1.2rem;border-radius:0.5rem;border:none;background:#36A2EB;color:#fff;cursor:pointer;">Home</button>
    <span id="snake-score" style="font-size:1.2rem;color:#fff;background:#333;padding:0.2em 1em;border-radius:0.5em;">Score: 0</span>
  `;
  container.appendChild(header);
  if (typeof homeCallback === 'function') {
    header.querySelector('#home-btn').onclick = () => {
      // Remove game over popup if present
      const overDiv = document.getElementById('snake-restart-btn')?.parentElement;
      if (overDiv && overDiv.parentElement) overDiv.remove();
      if (state && state.cleanup) state.cleanup();
      container.innerHTML = '';
      homeCallback();
    };
  }
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = config.cols * config.cellSize;
  canvas.height = config.rows * config.cellSize;
  canvas.style.background = config.colors.bg;
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';
  canvas.style.borderRadius = '1rem';
  container.appendChild(canvas);
  const scoreDiv = header.querySelector('#snake-score');

  function draw() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw grid
    ctx.strokeStyle = config.colors.grid;
    ctx.lineWidth = 1;
    for (let r = 0; r <= config.rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * config.cellSize);
      ctx.lineTo(canvas.width, r * config.cellSize);
      ctx.stroke();
    }
    for (let c = 0; c <= config.cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * config.cellSize, 0);
      ctx.lineTo(c * config.cellSize, canvas.height);
      ctx.stroke();
    }
    // Draw food
    ctx.fillStyle = config.colors.food;
    ctx.beginPath();
    ctx.arc(
      (state.food.x + 0.5) * config.cellSize,
      (state.food.y + 0.5) * config.cellSize,
      config.cellSize * 0.35, 0, Math.PI * 2
    );
    ctx.fill();
    // Draw snake body (except head)
    for (let i = 1; i < state.snake.length; i++) {
      ctx.fillStyle = config.colors.snake;
      ctx.fillRect(
        state.snake[i].x * config.cellSize + 2,
        state.snake[i].y * config.cellSize + 2,
        config.cellSize - 4,
        config.cellSize - 4
      );
    }
    // Draw snake head as emoji (on top)
    if (state.snake.length > 0) {
      ctx.font = `${Math.floor(config.cellSize * 0.95)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐍',
        (state.snake[0].x + 0.5) * config.cellSize,
        (state.snake[0].y + 0.5) * config.cellSize
      );
    }
    // Draw score
    scoreDiv.textContent = 'Score: ' + state.score;
  }
  function placeFood() {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * config.cols),
        y: Math.floor(Math.random() * config.rows)
      };
    } while (state.snake.some(s => s.x === pos.x && s.y === pos.y));
    state.food = pos;
  }
  function move() {
    if (state.gameOver) return;
    // Update direction
    state.dir = state.nextDir;
    // Next head position
    const head = {
      x: state.snake[0].x + state.dir.x,
      y: state.snake[0].y + state.dir.y
    };
    // Check collision
    if (
      head.x < 0 || head.x >= config.cols ||
      head.y < 0 || head.y >= config.rows ||
      state.snake.some(s => s.x === head.x && s.y === head.y)
    ) {
      state.gameOver = true;
      draw();
      showGameOver();
      return;
    }
    // Move snake
    state.snake.unshift(head);
    // Eat food
    if (head.x === state.food.x && head.y === state.food.y) {
      state.score += 10;
      placeFood();
    } else {
      state.snake.pop();
    }
    draw();
  }
  function keyHandler(e) {
    if (state.gameOver) return;
    if (e.key === 'ArrowUp' && state.dir.y !== 1) state.nextDir = {x: 0, y: -1};
    else if (e.key === 'ArrowDown' && state.dir.y !== -1) state.nextDir = {x: 0, y: 1};
    else if (e.key === 'ArrowLeft' && state.dir.x !== 1) state.nextDir = {x: -1, y: 0};
    else if (e.key === 'ArrowRight' && state.dir.x !== -1) state.nextDir = {x: 1, y: 0};
  }
  function showGameOver() {
    let overDiv = document.getElementById('snake-game-over');
    if (!overDiv) {
      overDiv = document.createElement('div');
      overDiv.id = 'snake-game-over';
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
        '<button id="snake-restart-btn" style="margin-top:1.1rem;font-size:1.05rem;padding:0.4rem 1.3rem;border-radius:0.5rem;border:none;background:#36A2EB;color:#fff;cursor:pointer;">Restart</button>';
      document.body.appendChild(overDiv);

      // Bomb explosion animation
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
    } else {
      overDiv.style.display = '';
    }
    document.getElementById('snake-restart-btn').onclick = () => {
      overDiv.remove();
      window.startSnakeGame(containerId, homeCallback);
    };
  }
  // Start game
  placeFood();
  draw();
  state.timer = setInterval(move, config.speed);
  window.addEventListener('keydown', keyHandler);
  // Clean up on exit (if needed)
  state.cleanup = () => {
    clearInterval(state.timer);
    window.removeEventListener('keydown', keyHandler);
  };
  // Expose cleanup for main menu switching
  window.snakeState = state;
};
