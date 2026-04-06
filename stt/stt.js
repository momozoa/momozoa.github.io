const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const micSelect = document.getElementById('micSelect');
const canvas = document.getElementById('sttCanvas');
const ctx = canvas.getContext('2d');
const sttText = document.getElementById('sttText');
const levelBar = document.getElementById('levelBar');
const sttLog = document.getElementById('sttLog');
const statusBar = document.getElementById('statusBar');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const unsupportedEl = document.getElementById('unsupported');
const eventLog = document.getElementById('eventLog');

function logEvent(msg) {
  if (!eventLog) return;
  const now = new Date();
  const time = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  eventLog.innerHTML += `<div>[${time}] ${msg}</div>`;
  eventLog.scrollTop = eventLog.scrollHeight;
}

let recognition;
let audioContext, analyser, source;
let dataArray, bufferLength;
let animationId;
let recognizedText = '';
let mediaStream;
let recognitionActive = false;
let lastSpeechTs = 0;
let silenceMsThreshold = 8000; // 8s of silence
let voiceThreshold = 0.03; // RMS threshold (0~1)
let pendingRestart = false;

async function startAudioGraphIfNeeded() {
  if (audioContext && analyser && mediaStream) return; // already started
  const selectedDeviceId = micSelect.value;
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined } });

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  source = audioContext.createMediaStreamSource(mediaStream);
  analyser = audioContext.createAnalyser();
  source.connect(analyser);
  analyser.fftSize = 2048;
  bufferLength = analyser.fftSize;
  dataArray = new Uint8Array(bufferLength);

  resizeCanvas();
  drawWaveform();
}

function resizeCanvas() {
  if (!canvas) return;
  // Match canvas resolution to CSS size to keep waveform crisp
  const cssWidth = canvas.clientWidth || 400;
  const cssHeight = canvas.clientHeight || 120;
  if (canvas.width !== cssWidth) canvas.width = cssWidth;
  if (canvas.height !== cssHeight) canvas.height = cssHeight;
}

function appendLog(text) {
  if (!sttLog || !text || !text.trim()) return;
  const item = document.createElement('div');
  item.className = 'log-item';
  const bubble = document.createElement('div');
  bubble.className = 'log-bubble';
  bubble.textContent = text.trim();
  const time = document.createElement('div');
  time.className = 'log-time';
  const t = new Date();
  time.textContent = t.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  item.appendChild(bubble);
  item.appendChild(time);
  sttLog.appendChild(item);
  // Auto-scroll to bottom
  sttLog.scrollTop = sttLog.scrollHeight;
}

function setStatus(mode, text) {
  if (statusDot) {
    statusDot.classList.remove('idle', 'ok', 'warn', 'err');
    const map = {
      idle: 'idle', listening: 'ok', recognizing: 'ok', stopped: 'idle',
      warn: 'warn', error: 'err', unsupported: 'err', permission: 'warn'
    };
    statusDot.classList.add(map[mode] || 'idle');
  }
  if (statusText) statusText.textContent = text;
}

async function listMicrophones() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const mics = devices.filter(d => d.kind === 'audioinput');
  micSelect.innerHTML = '';
  if (mics.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.text = '마이크를 찾을 수 없습니다';
    micSelect.appendChild(option);
    micSelect.disabled = true;
    startBtn.disabled = true;
  } else {
    mics.forEach((mic, idx) => {
      const option = document.createElement('option');
      option.value = mic.deviceId;
      option.text = mic.label || `마이크 ${idx+1}`;
      micSelect.appendChild(option);
    });
    micSelect.disabled = false;
  }
}
listMicrophones();

// Permissions status (best-effort)
if (navigator.permissions && navigator.permissions.query) {
  try {
    navigator.permissions.query({ name: 'microphone' }).then(res => {
      if (res.state === 'denied') {
        setStatus('permission', '마이크 권한 거부됨');
        startBtn.disabled = true;
      } else if (res.state === 'prompt') {
        setStatus('warn', '마이크 권한 요청 대기');
      }
      res.onchange = () => {
        if (res.state === 'granted') setStatus('idle', '대기중');
        if (res.state === 'denied') setStatus('permission', '마이크 권한 거부됨');
      };
    }).catch(() => {});
  } catch {}
}

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'ko-KR';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.onstart = () => {
    recognitionActive = true;
    lastSpeechTs = Date.now();
    startAudioGraphIfNeeded().catch(err => {
      console.warn('Audio graph start failed:', err);
      logEvent('onstart: audio graph 실패: ' + err);
    });
    console.log('Speech recognition started');
    setStatus('listening', '듣는 중');
    logEvent('onstart: 인식 시작');
  };
  recognition.onspeechstart = () => {
    console.log('음성 감지됨');
    setStatus('recognizing', '인식중');
    logEvent('onspeechstart: 음성 감지');
  };
  recognition.onspeechend = () => {
    console.log('음성 종료');
    setStatus('listening', '듣는 중');
    logEvent('onspeechend: 음성 종료');
  };
  recognition.onresult = (event) => {
    logEvent('onresult: 결과 이벤트');
    let interimTranscript = '';
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }
    if (finalTranscript) {
      recognizedText += finalTranscript;
      appendLog(finalTranscript);
    }
    const displayText = recognizedText + interimTranscript;
    sttText.textContent = displayText || '듣는 중...';
    logEvent('onresult: 인식 결과: ' + displayText);
    console.log('인식 결과:', displayText);
    if (displayText && displayText.trim().length > 0) {
      lastSpeechTs = Date.now();
    }
  };
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    sttText.textContent = `오류: ${event.error}`;
    setStatus('error', `오류: ${event.error}`);
    logEvent('onerror: ' + event.error);
  };
  recognition.onend = () => {
    logEvent('onend: 인식 종료, recognitionActive=' + recognitionActive);
    console.log('Speech recognition ended');
    // recognitionActive가 true면(자동종료 등) 자동 재시작 시도
    if (recognitionActive) {
      logEvent('onend: 자동 재시작 시도');
      setTimeout(() => {
        try {
          recognition.start();
          logEvent('onend: recognition.start() 재호출');
        } catch (e) {
          logEvent('onend: recognition.start() 재호출 실패: ' + e);
        }
      }, 400);
    } else {
      recognitionActive = false;
      if (!recognizedText.trim()) {
        sttText.textContent = '인식된 내용 없음';
        appendLog('인식된 내용 없음');
      }
      setStatus('stopped', '중지됨');
    }
  };
} else {
  logEvent('Web Speech API not supported');
  console.error('Web Speech API not supported');
  sttText.textContent = '브라우저가 음성 인식을 지원하지 않습니다';
  if (unsupportedEl) unsupportedEl.style.display = 'block';
  setStatus('unsupported', '지원되지 않음');
}

startBtn.addEventListener('click', async () => {
  startBtn.disabled = true;
  stopBtn.disabled = false;
  startBtn.classList.add('active');
  stopBtn.classList.add('active');
  
  recognizedText = ''; // 녹음 시작 시 초기화
  sttText.textContent = '듣는 중...';
  
  if (recognition) {
    try {
      recognition.start();
      logEvent('recognition.start() 호출');
    } catch (e) {
      logEvent('recognition.start() 실패: ' + e);
      console.error('Recognition start error:', e);
      setStatus('error', '시작 실패');
    }
  } else {
    // 브라우저가 인식을 지원하지 않더라도 파형은 표시 가능
    try {
      await startAudioGraphIfNeeded();
    } catch (e) {
      logEvent('Waveform start failed (no recognition support): ' + e);
      console.warn('Waveform start failed (no recognition support):', e);
    }
  }
});

stopBtn.addEventListener('click', () => {
  startBtn.disabled = false;
  stopBtn.disabled = true;
  startBtn.classList.remove('active');
  stopBtn.classList.remove('active');
  if (recognition) recognition.stop();
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
  }
  cancelAnimationFrame(animationId);
  mediaStream = null;
  audioContext = null;
  analyser = null;
  setStatus('stopped', '중지됨');
});

window.addEventListener('resize', resizeCanvas);

function drawWaveform() {
  animationId = requestAnimationFrame(drawWaveform);
  if (analyser) analyser.getByteTimeDomainData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 파형
  if (analyser) {
    // RMS 계산 (0~1)
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = (dataArray[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / bufferLength);
    // 레벨 미터 업데이트
    if (levelBar) {
      const pct = Math.min(100, Math.max(0, Math.round(rms * 200))); // 보정
      levelBar.style.width = pct + '%';
    }

    const now = Date.now();
    // 고음량을 '발화'로 간주하여 타임스탬프 갱신
    if (rms > voiceThreshold) {
      lastSpeechTs = now;
      // 조용함에서 소리 감지: 필요시 자동 재시작
      if (!recognitionActive && recognition && !pendingRestart) {
        pendingRestart = true;
        // 짧은 딜레이 후 시작 (브라우저 start 호출 제한 완화)
        setTimeout(() => {
          try {
            recognition.start();
            recognitionActive = true;
          } catch (e) {
            console.warn('Auto-restart failed:', e);
          }
          pendingRestart = false;
        }, 300);
      }
    }

    // 장시간 무음이면 자동 중지 및 안내
    if (recognitionActive && now - lastSpeechTs > silenceMsThreshold) {
      try {
        recognition.stop();
      } catch (e) {
        console.warn('Auto-stop failed:', e);
      }
      recognitionActive = false;
      if (!recognizedText.trim()) {
        sttText.textContent = '말씀해 주세요';
      }
    }

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3182ce';
    ctx.beginPath();
    let sliceWidth = canvas.width * 1.0 / bufferLength;
    let x = 0;
    for(let i = 0; i < bufferLength; i++) {
      let v = dataArray[i] / 128.0;
      let y = v * canvas.height / 2;
      if(i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }
}

// 초기 상태
resizeCanvas();
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.font = '16px sans-serif';
ctx.fillStyle = '#3182ce';
ctx.fillText('대기중', 10, 20);
