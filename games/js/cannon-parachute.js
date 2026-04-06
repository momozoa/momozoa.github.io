// Cannon Parachute Game (fixed cannon, 180deg barrel, falling enemies)
// Exports window.startCannonParachuteGame for dynamic loading
window.startCannonParachuteGame = function(containerId = 'game-container', homeCallback) {
  const config = {
    width: 480,
    height: 600,
    cannonY: 560,
    cannonRadius: 32,
    barrelLength: 70,
    minAngle: -90,
    maxAngle: 90,
    bulletSpeed: 8,
    enemySpeed: 2,
    enemyInterval: 1200,
    colors: {
      bg: '#222',
      cannon: '#888',
      barrel: '#36A2EB',
      bullet: '#FFCE56',
      enemy: '#FF6384'
    }
  };
  let state = {
    angle: 0,
    bullets: [],
    enemies: [],
    score: 0,
    timer: null,
    enemyTimer: null,
    gameOver: false
  };
  const container = document.getElementById(containerId);
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;margin-bottom:1rem;gap:1.5rem;">
      <span style="font-size:2rem;font-weight:bold;">Cannon Parachute</span>
      <button id="home-btn" style="font-size:1rem;padding:0.4rem 1.2rem;border-radius:0.5rem;border:none;background:#36A2EB;color:#fff;cursor:pointer;">Home</button>
      <span id="cannon-score" style="font-size:1.2rem;color:#fff;background:#333;padding:0.2em 1em;border-radius:0.5em;">Score: 0</span>
    </div>
  `;
  if (typeof homeCallback === 'function') {
    container.querySelector('#home-btn').onclick = () => {
      if (state && state.cleanup) state.cleanup();
      container.innerHTML = '';
      homeCallback();
    };
  }
  const canvas = document.createElement('canvas');
  canvas.width = config.width;
  canvas.height = config.height;
  // Set gameplay area background color only on the canvas, not the container
  canvas.style.background = config.colors.bg;
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';
  canvas.style.borderRadius = '1rem';
  container.appendChild(canvas);
  const scoreDiv = container.querySelector('#cannon-score');
  const ctx = canvas.getContext('2d');
  function draw() {
    ctx.clearRect(0, 0, config.width, config.height);
    ctx.save();
    ctx.translate(config.width / 2, config.cannonY);
    ctx.fillStyle = config.colors.cannon;
    ctx.beginPath();
    ctx.arc(0, 0, config.cannonRadius, Math.PI, 2 * Math.PI);
    ctx.fill();
    ctx.rotate(state.angle * Math.PI / 180);
    ctx.strokeStyle = config.colors.barrel;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -config.barrelLength);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = config.colors.bullet;
    for (const b of state.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const e of state.enemies) {
      ctx.fillStyle = config.colors.enemy;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 18, 0, Math.PI, true);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y - 18, 18, Math.PI, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(e.x - 12, e.y - 9);
      ctx.lineTo(e.x - 6, e.y);
      ctx.moveTo(e.x + 12, e.y - 9);
      ctx.lineTo(e.x + 6, e.y);
      ctx.stroke();
    }
    scoreDiv.textContent = 'Score: ' + state.score;
  }
  function spawnEnemy() {
    const x = 60 + Math.random() * (config.width - 120);
    state.enemies.push({ x, y: 0 });
  }
  function update() {
    for (const b of state.bullets) {
      b.x += config.bulletSpeed * Math.sin(b.angle * Math.PI / 180);
      b.y -= config.bulletSpeed * Math.cos(b.angle * Math.PI / 180);
    }
    state.bullets = state.bullets.filter(b => b.x > 0 && b.x < config.width && b.y > 0);
    for (const e of state.enemies) {
      e.y += config.enemySpeed;
    }
    for (const e of state.enemies) {
      if (e.y > config.height - 10) {
        state.gameOver = true;
        showGameOver();
        return;
      }
    }
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const e = state.enemies[i];
      for (let j = state.bullets.length - 1; j >= 0; j--) {
        const b = state.bullets[j];
        const dx = e.x - b.x, dy = e.y - b.y;
        if (dx * dx + dy * dy < 22 * 22) {
          state.enemies.splice(i, 1);
          state.bullets.splice(j, 1);
          state.score += 10;
          break;
        }
      }
    }
    draw();
  }
  function showGameOver() {
    clearInterval(state.timer);
    clearInterval(state.enemyTimer);
    let overDiv = document.getElementById('cannon-game-over');
    if (!overDiv) {
      overDiv = document.createElement('div');
      overDiv.id = 'cannon-game-over';
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
        '<button id="cannon-restart-btn" style="margin-top:1.1rem;font-size:1.05rem;padding:0.4rem 1.3rem;border-radius:0.5rem;border:none;background:#36A2EB;color:#fff;cursor:pointer;">Restart</button>';
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
    document.getElementById('cannon-restart-btn').onclick = () => {
      overDiv.remove();
      window.startCannonParachuteGame(containerId, homeCallback);
    };
  }
  function keyHandler(e) {
    if (state.gameOver) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      state.angle = Math.max(config.minAngle, state.angle - 4);
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
      state.angle = Math.min(config.maxAngle, state.angle + 4);
    } else if (e.key === ' ' || e.key === 'Enter') {
      state.bullets.push({
        x: config.width / 2 + Math.sin(state.angle * Math.PI / 180) * config.barrelLength,
        y: config.cannonY - Math.cos(state.angle * Math.PI / 180) * config.barrelLength,
        angle: state.angle
      });
    }
  }
  state.timer = setInterval(update, 1000 / 60);
  state.enemyTimer = setInterval(spawnEnemy, config.enemyInterval);
  window.addEventListener('keydown', keyHandler);
  state.cleanup = () => {
    clearInterval(state.timer);
    clearInterval(state.enemyTimer);
    window.removeEventListener('keydown', keyHandler);
  };
  window.cannonParachuteState = state;
  draw();
};
