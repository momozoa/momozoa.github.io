// Galaga Mini Game (very simple version, for mini-game collection)
// Exports window.startGalagaGame for dynamic loading
window.startGalagaGame = function(containerId = 'game-container', homeCallback) {
  const config = {
    width: 320,
    height: 480,
    playerSpeed: 4,
    bulletSpeed: 7,
    enemySpeed: 1.2,
    enemyRows: 3,
    enemyCols: 7,
    enemySpacingX: 36,
    enemySpacingY: 36,
    enemyStartY: 60,
    playerY: 420,
    colors: {
      bg: '#222'
    }
  };
  let state = {
    playerX: config.width / 2,
    bullets: [],
    enemies: [],
    enemyDir: 1,
    score: 0,
    gameOver: false,
    timer: null
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
    <span style="font-size:2rem;font-weight:bold;">Galaga</span>
    <button id="home-btn" style="font-size:1rem;padding:0.4rem 1.2rem;border-radius:0.5rem;border:none;background:#36A2EB;color:#fff;cursor:pointer;">Home</button>
    <span id="galaga-score" style="font-size:1.2rem;color:#fff;background:#333;padding:0.2em 1em;border-radius:0.5em;">Score: 0</span>
  `;
  container.appendChild(header);
  if (typeof homeCallback === 'function') {
    header.querySelector('#home-btn').onclick = () => {
      // Remove game over popup if present
      const overDiv = document.getElementById('galaga-restart-btn')?.parentElement;
      if (overDiv && overDiv.parentElement) overDiv.remove();
      if (state && state.cleanup) state.cleanup();
      container.innerHTML = '';
      homeCallback();
    };
  }
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = config.width;
  canvas.height = config.height;
  canvas.style.background = config.colors.bg;
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';
  canvas.style.borderRadius = '1rem';
  container.appendChild(canvas);
  const scoreDiv = header.querySelector('#galaga-score');

  function initEnemies() {
    state.enemies = [];
    for (let row = 0; row < config.enemyRows; row++) {
      for (let col = 0; col < config.enemyCols; col++) {
        state.enemies.push({
          x: 30 + col * config.enemySpacingX,
          y: config.enemyStartY + row * config.enemySpacingY,
          alive: true
        });
      }
    }
  }

  function draw() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw player (spaceship)
    ctx.save();
    ctx.translate(state.playerX, config.playerY);
    ctx.fillStyle = '#36A2EB';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(12, 12);
    ctx.lineTo(-12, 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Draw bullets
    ctx.fillStyle = '#FFCE56';
    for (const b of state.bullets) {
      ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
    }
    // Draw enemies
    for (const e of state.enemies) {
      if (e.alive) {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.font = '22px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👾', 0, 0);
        ctx.restore();
      }
    }
    // Draw score
    scoreDiv.textContent = 'Score: ' + state.score;
  }

  function update() {
    if (state.gameOver) return;
    // Move bullets
    for (const b of state.bullets) b.y -= config.bulletSpeed;
    // Remove offscreen bullets
    state.bullets = state.bullets.filter(b => b.y > -10);
    // Move enemies
    let minX = Infinity, maxX = -Infinity;
    for (const e of state.enemies) {
      if (!e.alive) continue;
      e.x += config.enemySpeed * state.enemyDir;
      if (e.x < minX) minX = e.x;
      if (e.x > maxX) maxX = e.x;
    }
    // Change direction if at edge
    if (minX < 20 || maxX > config.width - 20) {
      state.enemyDir *= -1;
      for (const e of state.enemies) if (e.alive) e.y += 18;
    }
    // Bullet-enemy collision
    for (const b of state.bullets) {
      for (const e of state.enemies) {
        if (e.alive && Math.abs(b.x - e.x) < 16 && Math.abs(b.y - e.y) < 18) {
          e.alive = false;
          b.y = -1000; // remove bullet
          state.score += 100;
        }
      }
    }
    // Check win
    if (state.enemies.every(e => !e.alive)) {
      state.gameOver = true;
      draw();
      showGameOver('You Win!');
      return;
    }
    // Check lose (enemy reached player)
    if (state.enemies.some(e => e.alive && e.y > config.playerY - 18)) {
      state.gameOver = true;
      draw();
      showGameOver('Game Over!');
      return;
    }
    draw();
  }

  function keyHandler(e) {
    if (state.gameOver) return;
    if (e.key === 'ArrowLeft') state.playerX -= config.playerSpeed;
    else if (e.key === 'ArrowRight') state.playerX += config.playerSpeed;
    else if (e.key === ' ' || e.key === 'z') {
      // Shoot
      if (state.bullets.length < 3) {
        state.bullets.push({ x: state.playerX, y: config.playerY - 16 });
      }
    }
    // Clamp player
    if (state.playerX < 18) state.playerX = 18;
    if (state.playerX > config.width - 18) state.playerX = config.width - 18;
  }

  function showGameOver(msg) {
    let overDiv = document.getElementById('galaga-game-over');
    if (!overDiv) {
      overDiv = document.createElement('div');
      overDiv.id = 'galaga-game-over';
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
        '<button id="galaga-restart-btn" style="margin-top:1.1rem;font-size:1.05rem;padding:0.4rem 1.3rem;border-radius:0.5rem;border:none;background:#36A2EB;color:#fff;cursor:pointer;">Restart</button>';
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
    document.getElementById('galaga-restart-btn').onclick = () => {
      overDiv.remove();
      window.startGalagaGame(containerId, homeCallback);
    };
  }

  // Start game
  initEnemies();
  draw();
  state.timer = setInterval(update, 1000/60);
  window.addEventListener('keydown', keyHandler);
  // Clean up on exit (if needed)
  state.cleanup = () => {
    clearInterval(state.timer);
    window.removeEventListener('keydown', keyHandler);
  };
  // Expose cleanup for main menu switching
  window.galagaState = state;
};
