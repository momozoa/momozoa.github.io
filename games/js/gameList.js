// List of mini-games for the platform. Add new games here to register them in the main menu.
// Each game: { name, id, module, start, icon }

// For compatibility with non-module main (index.js), set on window
window.__miniGames = [
  { name: 'Match-3', id: 'match3', module: 'js/match3.js', start: 'startMatch3Game', icon: '💎' },
  { name: 'Tetris', id: 'tetris', module: 'js/tetris.js', start: 'startTetrisGame', icon: '🟦' },
  { name: 'Snake', id: 'snake', module: 'js/snake.js', start: 'startSnakeGame', icon: '🐍' },
  { name: 'Galaga', id: 'galaga', module: 'js/galaga.js', start: 'startGalagaGame', icon: '👾' },
  { name: 'Cannon Parachute', id: 'cannon', module: 'js/cannon-parachute.js', start: 'startCannonParachuteGame', icon: '🎯' },
  { name: '2048', id: '2048', module: 'js/2048.js', start: 'start2048Game', icon: '🔢' },
  { name: 'Roguelike', id: 'roguelike', module: 'js/roguelike.js', start: 'startRoguelikeGame', icon: '🗡️' },
  { name: 'Survivor.io', id: 'survivor', module: 'js/survivor.js', start: 'startSurvivorGame', icon: '🔫' },
  { name: 'Blast Puzzle', id: 'blast', module: 'js/blast.js', start: 'startBlastGame', icon: '🧨' }
];
