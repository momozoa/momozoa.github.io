
// DOM 요소 선언을 최상단으로 이동

const playBtn = document.getElementById('play');
const pauseBtn = document.getElementById('pause');
const stopBtn = document.getElementById('stop');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const progress = document.getElementById('progress');
const volume = document.getElementById('volume');
const muteBtn = document.getElementById('mute');
const playlistEl = document.getElementById('playlist');
const songTitle = document.getElementById('song-title');
const songArtist = document.getElementById('song-artist');
let repeat = false;


// Web Audio API 실시간 이퀄라이저(막대그래프) 비주얼라이저
let audio = document.getElementById('audio');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
let audioCtx = null, analyser = null, srcNode = null, dataArray = null, animationId = null;
let prevBarHeights = [];

function setupVisualizer() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (!analyser) {
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128; // 막대 개수 줄임 (64개)
    dataArray = new Uint8Array(analyser.frequencyBinCount);
  }
  if (!srcNode) {
    srcNode = audioCtx.createMediaElementSource(audio);
    srcNode.connect(analyser);
    analyser.connect(audioCtx.destination);
  }
}

function drawVisualizer() {
  if (!analyser) return;
  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const barWidth = (canvas.width / dataArray.length) * 0.7;
  const gap = (canvas.width / dataArray.length) * 0.3;
  const maxBarHeight = canvas.height * 0.8;
  if (!prevBarHeights.length) prevBarHeights = Array(dataArray.length).fill(0);
  // 고음(오른쪽) 3개 막대는 그리지 않음
  for (let i = 0; i < dataArray.length; i++) {
    let val = dataArray[i];
    // 평탄화: 저음~고음 감마+스케일 보정
    const gamma = 1.4 - Math.sqrt(i / dataArray.length) * 0.7; // 저음 1.4, 고음 0.7 (제곱근 곡선)
    const scale = 0.7 + Math.sqrt(i / dataArray.length) * 1.1; // 저음 0.7, 고음 1.8 (제곱근 곡선)
    val = Math.pow(val / 255, gamma) * 255;
    let barHeight = (val / 255) * maxBarHeight * scale;
    // 보간 없이 바로 반영
    if (barHeight < 2) barHeight = 2;
    // barHeight가 canvas의 높이를 넘지 않도록 제한
    if (barHeight > canvas.height - 2) barHeight = canvas.height - 2;
    // 무지개 그라데이션 색상
    const hue = Math.round((i / dataArray.length) * 270 + 180); // 180~450도(HSL)
    const grad = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
    grad.addColorStop(0, `hsl(${hue}, 100%, 60%)`);
    grad.addColorStop(1, `hsl(${hue + 40}, 100%, 70%)`);
    const x = i * (barWidth + gap);
    ctx.save();
    ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
    ctx.shadowBlur = 16;
    ctx.fillStyle = grad;
    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
    // 막대 상단 glow
    ctx.beginPath();
    ctx.arc(x + barWidth / 2, canvas.height - barHeight, barWidth * 0.45, 0, 2 * Math.PI);
    ctx.fillStyle = `hsla(${hue}, 100%, 80%, 0.7)`;
    ctx.shadowColor = `hsl(${hue}, 100%, 80%)`;
    ctx.shadowBlur = 24;
    ctx.fill();
    ctx.restore();
  }
  animationId = requestAnimationFrame(drawVisualizer);
}

const playlist = [
  { title: 'SoundHelix Song 1', artist: 'SoundHelix', src: 'SoundHelix-Song-1.mp3' },
  { title: 'Hype', artist: 'AudioDollar', src: 'hype-325695.mp3' },
  { title: 'Dubstep Rock', artist: 'Audioknap', src: 'dubstep-rock-424554.mp3' }
];
let current = 0;

function loadSong(idx) {
  const song = playlist[idx];
  // 기존 audio 태그 제거 및 새로 생성
  if (audio) {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    audio.parentNode && audio.parentNode.removeChild(audio);
  }
  audio = document.createElement('audio');
  audio.id = 'audio';
  audio.style.display = 'none';
  document.body.appendChild(audio);
  audio.src = song.src;
  songTitle.textContent = song.title;
  songArtist.textContent = song.artist;
  highlightPlaylist(idx);
  // 기존 연결 해제 및 초기화
  if (srcNode) {
    try { srcNode.disconnect(); } catch(e){}
    srcNode = null;
  }
  if (analyser) {
    try { analyser.disconnect(); } catch(e){}
    analyser = null;
  }
  if (audioCtx) {
    try { audioCtx.close(); } catch(e){}
    audioCtx = null;
  }
  setupVisualizer();
  // 이벤트 재연결
  audio.addEventListener('play', () => {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    drawVisualizer();
  });
  audio.addEventListener('pause', () => {
    if (animationId) cancelAnimationFrame(animationId);
  });
  audio.addEventListener('ended', () => {
    if (animationId) cancelAnimationFrame(animationId);
    if (repeat) {
      audio.currentTime = 0;
      audio.play();
    } else {
      nextSong();
    }
  });
  audio.ontimeupdate = () => {
    progress.value = (audio.currentTime / audio.duration) * 100 || 0;
  };
  audio.onvolumechange = updateMuteIcon;
}


function playSong() { audio.play(); }
function pauseSong() { audio.pause(); }
function stopSong() { audio.pause(); audio.currentTime = 0; }
function prevSong() { current = (current - 1 + playlist.length) % playlist.length; loadSong(current); setTimeout(playSong, 200); }
function nextSong() { current = (current + 1) % playlist.length; loadSong(current); setTimeout(playSong, 200); }


playBtn.onclick = playSong;
pauseBtn.onclick = pauseSong;
stopBtn.onclick = stopSong;
prevBtn.onclick = prevSong;
nextBtn.onclick = nextSong;

audio.addEventListener('play', () => {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  drawVisualizer();
});
audio.addEventListener('pause', () => {
  if (animationId) cancelAnimationFrame(animationId);
});
audio.addEventListener('ended', () => {
  if (animationId) cancelAnimationFrame(animationId);
  if (repeat) {
    audio.currentTime = 0;
    audio.play();
  } else {
    nextSong();
  }
});

// 반복 기능 (Shift+R로 토글)
document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r' && e.shiftKey) {
    repeat = !repeat;
    alert('반복: ' + (repeat ? 'ON' : 'OFF'));
  }
});



// 진행 바
audio.ontimeupdate = () => {
  progress.value = (audio.currentTime / audio.duration) * 100 || 0;
};
progress.oninput = () => {
  audio.currentTime = (progress.value / 100) * audio.duration;
};

// 볼륨
volume.oninput = () => {
  audio.volume = volume.value;
  if (audio.muted && audio.volume > 0) {
    audio.muted = false;
    updateMuteIcon();
  }
};
muteBtn.onclick = () => {
  audio.muted = !audio.muted;
  updateMuteIcon();
};
function updateMuteIcon() {
  const iconVolume = document.getElementById('icon-volume');
  const iconMute = document.getElementById('icon-mute');
  if (audio.muted || audio.volume === 0) {
    iconVolume.style.display = 'none';
    iconMute.style.display = 'inline';
  } else {
    iconVolume.style.display = 'inline';
    iconMute.style.display = 'none';
  }
}

// 재생목록 UI
function renderPlaylist() {
  playlistEl.innerHTML = '';
  playlist.forEach((song, idx) => {
    const li = document.createElement('li');
    li.textContent = `${song.title} - ${song.artist}`;
    li.onclick = () => { current = idx; loadSong(current); playSong(); };
    playlistEl.appendChild(li);
  });
}
function highlightPlaylist(idx) {
  Array.from(playlistEl.children).forEach((li, i) => {
    if (i === idx) {
      li.classList.add('selected');
    } else {
      li.classList.remove('selected');
    }
  });
}

// 초기화
renderPlaylist();
loadSong(current);
