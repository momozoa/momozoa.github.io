// Match-3 Game logic (modular, for mini-game collection)
// Exported as startMatch3Game for dynamic loading


// Add: Accept a homeCallback for Home button
window.startMatch3Game = function(containerId = 'game-container', homeCallback) {
  const scoreDiv = document.getElementById('score');
  if (scoreDiv) scoreDiv.style.display = '';
  const container = document.getElementById(containerId);
  // Header with title and Home button
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;margin-bottom:1rem;gap:1.5rem;">
      <span style="font-size:2rem;font-weight:bold;">Match-3</span>
      <button id="home-btn" style="font-size:1rem;padding:0.4rem 1.2rem;border-radius:0.5rem;border:none;background:#FF6384;color:#fff;cursor:pointer;">Home</button>
    </div>
    <div id="game-board"></div>
  `;
  if (typeof homeCallback === 'function') {
    container.querySelector('#home-btn').onclick = () => {
      // Hide game, show menu
      container.innerHTML = '';
      if (scoreDiv) scoreDiv.style.display = 'none';
      homeCallback();
    };
  }

  // --- Match-3 logic below (from index.js) ---
  const boardSize = 8;
  const candyTypes = [
    { color: '#FF6384', icon: '💎' }, // red gem
    { color: '#36A2EB', icon: '🔷' }, // blue diamond
    { color: '#FFCE56', icon: '🔶' }, // yellow diamond
    { color: '#4BC0C0', icon: '🔹' }, // cyan gem
    { color: '#9966FF', icon: '🔮' }, // purple orb
    { color: '#FF9F40', icon: '🟠' }  // orange gem
  ];

  let board = [];
  let selected = null;
  let score = 0;

  function updateScore() {
    if (scoreDiv) scoreDiv.textContent = `Score: ${score}`;
  }

  function getIndex(row, col) {
    return row * boardSize + col;
  }

  function createBoard() {
    board = [];
    score = 0;
    updateScore();
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const type = candyTypes[Math.floor(Math.random() * candyTypes.length)];
        const cell = { row, col, color: type.color, icon: type.icon };
        board.push(cell);
        const div = document.createElement('div');
        div.className = 'candy';
        div.style.background = type.color;
        div.dataset.row = row;
        div.dataset.col = col;
        div.innerText = type.icon;
        div.addEventListener('click', onCandyClick);
        gameBoard.appendChild(div);
      }
    }
  }

  function onCandyClick(e) {
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    if (!selected) {
      selected = { row, col };
      e.target.style.outline = '2px solid #222';
    } else {
      if (isAdjacent(selected, { row, col })) {
        swapCandies(selected, { row, col }, clearSelection);
      } else {
        clearSelection();
      }
    }
  }

  function isAdjacent(a, b) {
    return (
      (a.row === b.row && Math.abs(a.col - b.col) === 1) ||
      (a.col === b.col && Math.abs(a.row - b.row) === 1)
    );
  }

  function swapCandies(a, b, done) {
    const idxA = getIndex(a.row, a.col);
    const idxB = getIndex(b.row, b.col);
    const candies = document.querySelectorAll('.candy');
    const divA = candies[idxA];
    const divB = candies[idxB];

    // Get positions before swap
    const rectA1 = divA.getBoundingClientRect();
    const rectB1 = divB.getBoundingClientRect();
    const dx = rectB1.left - rectA1.left;
    const dy = rectB1.top - rectA1.top;

    // Animate swap
    divA.style.zIndex = 1;
    divB.style.zIndex = 1;
    divA.style.transition = 'transform 0.25s cubic-bezier(0.4,0.2,0.2,1)';
    divB.style.transition = 'transform 0.25s cubic-bezier(0.4,0.2,0.2,1)';
    divA.style.transform = `translate(${dx}px, ${dy}px)`;
    divB.style.transform = `translate(${-dx}px, ${-dy}px)`;

    // Wait for swap animation to finish
    setTimeout(() => {
      // Swap data in board only (not updateBoard yet)
      const tempColor = board[idxA].color;
      const tempIcon = board[idxA].icon;
      board[idxA].color = board[idxB].color;
      board[idxA].icon = board[idxB].icon;
      board[idxB].color = tempColor;
      board[idxB].icon = tempIcon;

      // Check for match without updating DOM
      const matches = findMatchesWithGroups();
      if (matches.groups.length === 0) {
        // No match: revert animation
        // Animate back to original positions
        divA.style.transition = 'transform 0.25s cubic-bezier(0.4,0.2,0.2,1)';
        divB.style.transition = 'transform 0.25s cubic-bezier(0.4,0.2,0.2,1)';
        divA.style.transform = '';
        divB.style.transform = '';
        // After revert animation, revert data and update DOM
        setTimeout(() => {
          // Revert data
          const tempColor2 = board[idxA].color;
          const tempIcon2 = board[idxA].icon;
          board[idxA].color = board[idxB].color;
          board[idxA].icon = board[idxB].icon;
          board[idxB].color = tempColor2;
          board[idxB].icon = tempIcon2;
          updateBoard();
          divA.style.transition = '';
          divB.style.transition = '';
          divA.style.zIndex = '';
          divB.style.zIndex = '';
          if (typeof done === 'function') done();
        }, 250);
      } else {
        // There is a match: update DOM to reflect swap
        updateBoard();
        setTimeout(() => {
          clearMatches();
          updateBoard();
          divA.style.transition = '';
          divB.style.transition = '';
          divA.style.zIndex = '';
          divB.style.zIndex = '';
          if (typeof done === 'function') done();
        }, 50);
      }
    }, 250);
  }

  function updateBoard(withDropAnim = false) {
    const candies = document.querySelectorAll('.candy');
    if (withDropAnim) {
      const oldRects = [];
      for (let i = 0; i < candies.length; i++) {
        oldRects.push(candies[i].getBoundingClientRect());
      }
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
      requestAnimationFrame(() => {
        const newRects = [];
        for (let i = 0; i < candies.length; i++) {
          newRects.push(candies[i].getBoundingClientRect());
        }
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
        requestAnimationFrame(() => {
          for (let i = 0; i < candies.length; i++) {
            if (candies[i].style.transform && candies[i].style.transform !== 'none' && candies[i].style.transform !== '') {
              candies[i].style.transition = 'transform 0.7s cubic-bezier(0.4,0.2,0.2,1)';
              candies[i].style.transform = '';
            }
          }
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
      for (const idx of matchIndices) {
        const div = candies[idx];
        if (div) {
          div.style.transition = 'transform 0.3s cubic-bezier(0.4,0.2,0.2,1)';
          div.style.transform = 'scale(1.4)';
          div.style.opacity = '1';
        }
      }
      setTimeout(() => {
        for (const idx of matchIndices) {
          const div = candies[idx];
          if (div) {
            div.style.transition = 'transform 0.2s, opacity 0.2s';
            div.style.transform = 'scale(0.1)';
            div.style.opacity = '0';
          }
        }
        setTimeout(() => {
          if (typeof callback === 'function') callback();
        }, 200);
      }, 300);
    }

    function doClear() {
      matches = findMatchesWithGroups();
      if (matches.groups.length === 0) {
        setTimeout(() => {
          if (!hasPossibleMoves()) {
            showGameOver();
          }
        }, 100);
        return;
      }
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
      animateAndRemove(matches.all, () => {
        for (const idx of matches.all) {
          board[idx].color = null;
          board[idx].icon = null;
        }
        updateBoard();
        setTimeout(() => {
          dropCandies();
          fillEmpty();
          updateBoard(true);
          setTimeout(() => {
            doClear();
          }, 800);
        }, 30);
      });
    }
    doClear();
  }

  function findMatchesWithGroups() {
    const all = [];
    const groups = [];
    const visited = Array(board.length).fill(false);
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
          let match = [idx];
          let c = col + 1;
          while (c < boardSize && board[getIndex(row, c)].color === color) {
            match.push(getIndex(row, c));
            c++;
          }
          for (const i of match) visited[i] = true;
          groups.push(match);
          all.push(...match);
          col += match.length;
        } else {
          col++;
        }
      }
    }
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
        const type = candyTypes[Math.floor(Math.random() * candyTypes.length)];
        board[getIndex(r, col)].color = type.color;
        board[getIndex(r, col)].icon = type.icon;
      }
    }
  }

  function hasPossibleMoves() {
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const idx = getIndex(row, col);
        if (col < boardSize - 1) {
          swapBoard(idx, getIndex(row, col + 1));
          if (findMatchesWithGroups().groups.length > 0) {
            swapBoard(idx, getIndex(row, col + 1));
            return true;
          }
          swapBoard(idx, getIndex(row, col + 1));
        }
        if (row < boardSize - 1) {
          swapBoard(idx, getIndex(row + 1, col));
          if (findMatchesWithGroups().groups.length > 0) {
            swapBoard(idx, getIndex(row + 1, col));
            return true;
          }
          swapBoard(idx, getIndex(row + 1, col));
        }
      }
    }
    return false;
  }

  function swapBoard(idxA, idxB) {
    const tempColor = board[idxA].color;
    const tempIcon = board[idxA].icon;
    board[idxA].color = board[idxB].color;
    board[idxA].icon = board[idxB].icon;
    board[idxB].color = tempColor;
    board[idxB].icon = tempIcon;
  }

  function showGameOver() {
    let overDiv = document.getElementById('match3-game-over');
    if (!overDiv) {
      overDiv = document.createElement('div');
      overDiv.id = 'match3-game-over';
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
        '<button id="match3-restart-btn" style="margin-top:1.1rem;font-size:1.05rem;padding:0.4rem 1.3rem;border-radius:0.5rem;border:none;background:#36A2EB;color:#fff;cursor:pointer;">Restart</button>';
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
    document.getElementById('match3-restart-btn').onclick = () => {
      overDiv.style.display = 'none';
      createBoard();
      updateBoard();
    };
  }

  // Start the game
  createBoard();
  updateBoard();
}
