// survivor.js - 탕탕 특공대(=Survivor.io) 스타일 미니게임
// Exports: window.startSurvivorGame(containerId, onHome)
(function() {
  function startSurvivorGame(containerId, onHome) {
    const W = 400, H = 600;
    let player = { x: W/2, y: H-60, r: 18, hp: 5, xp: 0, level: 1, speed: 3 };
    let bullets = [], enemies = [], particles = [], items = [], lastShot = 0, lastEnemy = 0, lastItem = 0, gameOver = false, frame = 0;
    let keys = {}, score = 0;
    let weaponLevel = 1;
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
    title.textContent = '탕탕 특공대 (Survivor.io)';
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
    homeBtn.onclick = () => { cleanup(); onHome && onHome(); };
    topBar.appendChild(title);
    topBar.appendChild(homeBtn);
    container.appendChild(topBar);

    // Score/HP UI
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
      - 방향키(←↑↓→) 또는 WASD로 이동<br>
      - 캐릭터가 자동으로 총알을 발사합니다<br>
      - 적을 피하고 처치해 점수를 올리세요<br>
      - HP가 0이 되면 게임 오버<br>
      - <b>Home</b>으로 메인 메뉴로 돌아갑니다.
    `;
    container.appendChild(howToDiv);

    // Canvas
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    canvas.style.background = '#222'; // 기본 배경색 직접 지정
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto 1.2rem auto';
    canvas.style.borderRadius = '1.1em';
    canvas.style.boxShadow = '0 2px 16px #0008';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // Game Over UI
    const overDiv = document.createElement('div');
    overDiv.style.position = 'absolute';
    overDiv.style.left = '50%';
    overDiv.style.top = '50%';
    overDiv.style.transform = 'translate(-50%,-50%)';
    overDiv.style.background = 'rgba(0,0,0,0.85)';
    overDiv.style.color = '#fff';
    overDiv.style.fontSize = '2rem';
    overDiv.style.padding = '2rem 3rem';
    overDiv.style.borderRadius = '1rem';
    overDiv.style.textAlign = 'center';
    overDiv.style.zIndex = '1000';
    overDiv.style.display = 'none';
    overDiv.id = 'survivor-game-over';
    overDiv.innerHTML =
      '<div style="font-size:1.45rem;letter-spacing:0.04em;white-space:nowrap;display:inline-block;">' +
        '<span style="font-size:1.2em;vertical-align:-0.1em;">💥</span> ' +
        'Game Over! <span style="font-size:1.2em;vertical-align:-0.1em;">💥</span>' +
      '</div>' +
      '<br>' +
      '<button id="restart-survivor-btn" style="margin-top:1.1rem;font-size:1.05rem;padding:0.4rem 1.3rem;border-radius:0.5rem;border:none;background:#f7b731;color:#fff;cursor:pointer;">Restart</button>';
    container.appendChild(overDiv);
    overDiv.querySelector('#restart-survivor-btn').onclick = restart;

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

    // Controls
    function onKey(e) {
      if (e.type === 'keydown') keys[e.key.toLowerCase()] = true;
      else keys[e.key.toLowerCase()] = false;
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);

    function restart() {
      player = { x: W/2, y: H-60, r: 18, hp: 5, xp: 0, level: 1, speed: 3 };
      bullets = [];
      enemies = [];
      particles = [];
      items = [];
      lastShot = 0;
      lastEnemy = 0;
      lastItem = 0;
      gameOver = false;
      score = 0;
      frame = 0;
      weaponLevel = 1;
      overDiv.style.display = 'none';
      loop();
    }

    // 총알이 빙빙 돌면서 가장 가까운 몬스터 방향으로 발사 (업그레이드 시 여러 방향)
    let bulletAngle = 0;
    function shoot() {
      // 가장 가까운 몬스터 찾기
      let target = null, minDist = 99999;
      for (const e of enemies) {
        const dist = Math.hypot(e.x - player.x, e.y - player.y);
        if (dist < minDist) {
          minDist = dist;
          target = e;
        }
      }
      let angles = [];
      if (target) {
        // 타겟 방향
        let base = Math.atan2(target.y - player.y, target.x - player.x);
        angles.push(base);
        if (weaponLevel >= 2) angles.push(base + Math.PI/10, base - Math.PI/10);
        if (weaponLevel >= 3) angles.push(base + Math.PI/5, base - Math.PI/5);
        if (weaponLevel >= 4) angles.push(base + Math.PI/2, base - Math.PI/2);
      } else {
        // 몬스터 없으면 빙빙 돌기
        angles.push(bulletAngle);
        if (weaponLevel >= 2) angles.push(bulletAngle + Math.PI/10, bulletAngle - Math.PI/10);
        if (weaponLevel >= 3) angles.push(bulletAngle + Math.PI/5, bulletAngle - Math.PI/5);
        if (weaponLevel >= 4) angles.push(bulletAngle + Math.PI/2, bulletAngle - Math.PI/2);
        bulletAngle += Math.PI/8;
      }
      const speed = 7;
      for (let angle of angles) {
        bullets.push({
          x: player.x + Math.cos(angle)*20,
          y: player.y + Math.sin(angle)*20,
          r: 5,
          dx: Math.cos(angle)*speed,
          dy: Math.sin(angle)*speed
        });
      }
    }
    // 무기 업그레이드 아이템 생성
    function spawnItem() {
      // 화면 내 랜덤 위치, 플레이어와 너무 가까우면 다시
      let ix, iy;
      do {
        ix = Math.random() * (W-60) + 30;
        iy = Math.random() * (H-120) + 60;
      } while (Math.hypot(ix-player.x, iy-player.y) < 60);
      items.push({ x: ix, y: iy, r: 14, type: 'weapon', color: '#27ae60', icon: '🔫', life: 900 }); // 15초간 유지
    }

    function spawnEnemy() {
      // 사방 랜덤 스폰: 위, 아래, 왼쪽, 오른쪽 중 하나에서 등장
      const side = Math.floor(Math.random() * 4); // 0:위 1:아래 2:왼 3:오
      let ex, ey;
      if (side === 0) { // 위
        ex = Math.random() * (W-40) + 20;
        ey = -20;
      } else if (side === 1) { // 아래
        ex = Math.random() * (W-40) + 20;
        ey = H + 20;
      } else if (side === 2) { // 왼쪽
        ex = -20;
        ey = Math.random() * (H-40) + 20;
      } else { // 오른쪽
        ex = W + 20;
        ey = Math.random() * (H-40) + 20;
      }
      // 플레이어 방향으로 단위벡터
      const px = player.x, py = player.y;
      let vx = px - ex, vy = py - ey;
      let len = Math.hypot(vx, vy);
      if (len === 0) { vx = 0; vy = 1; len = 1; }
      vx /= len; vy /= len;
      // 시간에 따라 몬스터 종류와 HP 결정
      let t = frame / 60; // 초 단위
      let type = 0;
      let hp = 1 + Math.floor(frame/900);
      let r = 18;
      let color = '#e74c3c', icon = '👾';
      let speed = 1.2 + Math.min(frame/600, 2.5) + Math.random()*0.5;
      if (t > 30 && Math.random() < 0.3) { // 30초 이후 30% 확률로 강한 몬스터
        type = 1;
        hp = 5 + Math.floor(frame/600); // 더 높은 HP
        r = 22;
        color = '#8e44ad';
        icon = '💀';
        speed *= 0.8 + Math.random()*0.3; // 느리지만 강함
      }
      if (t > 60 && Math.random() < 0.15) { // 60초 이후 15% 확률로 보스급
        type = 2;
        hp = 15 + Math.floor(frame/300);
        r = 30;
        color = '#f1c40f';
        icon = '👹';
        speed *= 0.6 + Math.random()*0.2;
      }
      enemies.push({ x: ex, y: ey, r, hp, maxHp: hp, speed, vx, vy, color, icon, type });
    }

    function update() {
      // Player move
      let dx = 0, dy = 0;
      if (keys['arrowleft'] || keys['a']) dx -= 1;
      if (keys['arrowright'] || keys['d']) dx += 1;
      if (keys['arrowup'] || keys['w']) dy -= 1;
      if (keys['arrowdown'] || keys['s']) dy += 1;
      let len = Math.hypot(dx, dy);
      if (len > 0) {
        dx /= len; dy /= len;
        player.x += dx * player.speed;
        player.y += dy * player.speed;
        player.x = Math.max(player.r, Math.min(W-player.r, player.x));
        player.y = Math.max(player.r, Math.min(H-player.r, player.y));
      }
      // Auto shoot
      if (frame - lastShot > 18) {
        shoot();
        lastShot = frame;
      }
      // Bullets
      bullets.forEach(b => {
        b.x += b.dx;
        b.y += b.dy;
      });
      bullets = bullets.filter(b => b.x > -20 && b.x < W+20 && b.y > -20 && b.y < H+20);

      // 아이템
      items.forEach(item => { item.life--; });
      // 플레이어가 아이템 먹으면 효과 적용
      items = items.filter(item => {
        if (Math.hypot(player.x-item.x, player.y-item.y) < player.r+item.r) {
          if (item.type === 'weapon') {
            weaponLevel = Math.min(weaponLevel+1, 5);
          }
          for (let i=0;i<10;i++) particles.push({x:item.x,y:item.y,dx:Math.cos(i*Math.PI/5)*2,dy:Math.sin(i*Math.PI/5)*2,life:16,color:item.color});
          return false;
        }
        return item.life > 0;
      });
      // 일정 시간마다 무기 업그레이드 아이템 등장
      if (frame - lastItem > 900) { // 15초마다
        spawnItem();
        lastItem = frame;
      }
      // Enemies: 플레이어를 계속 추적
      enemies.forEach(e => {
        // 매 프레임마다 플레이어 방향으로 벡터 갱신
        let vx = player.x - e.x, vy = player.y - e.y;
        let len = Math.hypot(vx, vy);
        if (len === 0) { vx = 0; vy = 1; len = 1; }
        vx /= len; vy /= len;
        e.vx = vx; e.vy = vy;
        e.x += e.vx * e.speed;
        e.y += e.vy * e.speed;
      });
      enemies = enemies.filter(e =>
        e.x > -50 && e.x < W+50 && e.y > -50 && e.y < H+50 && e.hp > 0
      );
      // Collisions
      bullets.forEach(b => {
        enemies.forEach(e => {
          if (Math.hypot(b.x-e.x, b.y-e.y) < b.r+e.r) {
            e.hp--;
            b.y = -1000;
            // 점수/경험치: 몬스터 종류별로 다르게
            let addScore = 10, addXp = 1;
            if (e.type === 1) { addScore = 40; addXp = 4; }
            if (e.type === 2) { addScore = 200; addXp = 15; }
            score += addScore;
            player.xp += addXp;
            for (let i=0;i<6;i++) particles.push({x:e.x,y:e.y,dx:Math.cos(i*Math.PI/3)*2,dy:Math.sin(i*Math.PI/3)*2,life:16,color:e.color});
          }
        });
      });
      // Enemy hits player
      enemies.forEach(e => {
        if (Math.hypot(player.x-e.x, player.y-e.y) < player.r+e.r) {
          player.hp--;
          e.hp = 0;
          for (let i=0;i<10;i++) particles.push({x:player.x,y:player.y,dx:Math.cos(i*Math.PI/5)*3,dy:Math.sin(i*Math.PI/5)*3,life:18,color:e.color});
        }
      });
      // Particles
      particles.forEach(p => { p.x+=p.dx; p.y+=p.dy; p.life--; });
      particles = particles.filter(p => p.life > 0);
      // Level up
      if (player.xp >= 20) {
        player.xp -= 20;
        player.level++;
        player.hp++;
        player.speed += 0.3;
      }
      // Spawn enemy
      if (frame - lastEnemy > Math.max(24, 60 - player.level*2)) {
        spawnEnemy();
        lastEnemy = frame;
      }
      // Game over
      if (player.hp <= 0) {
        gameOver = true;
        overDiv.style.display = '';
      }
    }

    function draw() {
      ctx.clearRect(0,0,W,H);
      // Player
      ctx.save();
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
      ctx.fillStyle = '#6c7ae0';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.font = '1.2rem sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.fillText('🧑‍🎤', player.x, player.y+8);
      ctx.restore();
      // Bullets
      ctx.fillStyle = '#f7b731';
      bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
        ctx.fill();
      });
      // Items
      items.forEach(item => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.r, 0, Math.PI*2);
        ctx.fillStyle = item.color;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.font = '1.3rem sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(item.icon, item.x, item.y+8);
        ctx.restore();
      });
      // Enemies
      enemies.forEach(e => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI*2);
        ctx.fillStyle = e.color || '#e74c3c';
        ctx.fill();
        // HP bar
        if (e.maxHp > 1) {
          ctx.fillStyle = '#222';
          ctx.fillRect(e.x-e.r, e.y-e.r-10, e.r*2, 7);
          ctx.fillStyle = '#e74c3c';
          ctx.fillRect(e.x-e.r, e.y-e.r-10, e.r*2 * (e.hp/e.maxHp), 7);
          ctx.strokeStyle = '#fff';
          ctx.strokeRect(e.x-e.r, e.y-e.r-10, e.r*2, 7);
        }
        ctx.font = '1.3rem sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(e.icon || '👾', e.x, e.y+10);
        ctx.restore();
      });
      // Particles
      particles.forEach(p => {
        ctx.fillStyle = p.color || '#fff8';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI*2);
        ctx.fill();
      });
    }

    function loop() {
      if (gameOver) return;
      frame++;
      update();
      draw();
      infoDiv.innerHTML = `HP: <b style='color:#e74c3c'>${player.hp}</b> | Score: <b>${score}</b> | Lv.${player.level} <span style='color:#6c7ae0'>(XP: ${player.xp}/20)</span> | <span style='color:#27ae60'>무기 Lv.${weaponLevel}</span>`;
      requestAnimationFrame(loop);
    }

    function cleanup() {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    }
    window._survivor_cleanup = cleanup;

    restart();
  }
  window.startSurvivorGame = startSurvivorGame;
})();
