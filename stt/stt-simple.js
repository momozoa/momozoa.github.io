// stt-simple.js: 최소 음성인식 예제
const startBtn = document.getElementById('startBtn');
const resultDiv = document.getElementById('result');
const statusDiv = document.getElementById('status');

let recognition;

function setStatus(msg) {
  statusDiv.textContent = msg;
}

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'ko-KR';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => setStatus('음성 인식 대기중...');
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    resultDiv.textContent = transcript;
    setStatus('인식 완료');
  };
  recognition.onerror = (e) => {
    setStatus('오류: ' + e.error);
  };
  recognition.onend = () => setStatus('음성 인식 종료');

  startBtn.onclick = () => {
    resultDiv.textContent = '';
    setStatus('마이크 권한을 허용해 주세요');
    try {
      recognition.start();
    } catch (e) {
      setStatus('시작 실패: ' + e);
    }
  };
} else {
  setStatus('이 브라우저는 음성 인식을 지원하지 않습니다.');
  startBtn.disabled = true;
}
