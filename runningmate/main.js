let map, polyline, marker;
let path = [];
let watchId = null;
let wakeLock = null;

const startBtn = document.getElementById('startBtn');
const statusDiv = document.getElementById('status');
const coordsDiv = document.getElementById('coords');

function updateCoordsDisplay(lat, lng, accuracy) {
  coordsDiv.textContent = `위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)} (정확도: ${accuracy}m)`;
}

function onLocationSuccess(pos) {
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;
  const accuracy = pos.coords.accuracy;

  updateCoordsDisplay(lat, lng, accuracy);

  path.push([lat, lng]);

  if (!map) {
    map = L.map('map').setView([lat, lng], 18); // 줌 레벨 확대
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    polyline = L.polyline(path, { color: 'red', weight: 5 }).addTo(map);
    marker = L.marker([lat, lng]).addTo(map);
  } else {
    polyline.setLatLngs(path);
    marker.setLatLng([lat, lng]);
    map.panTo([lat, lng]);
  }
}

function onLocationError(err) {
  coordsDiv.textContent = '위치 오류: ' + err.message;
}

// Wake Lock 요청 함수
async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    statusDiv.textContent = '화면 켜짐 유지 중';
    startBtn.textContent = '⏹ 중지';
    startBtn.style.background = '#ff3b30'; // Red for stop
  } catch (err) {
    statusDiv.textContent = '화면 유지 실패: ' + err.name;
  }
}

async function toggleTracking() {
  if (watchId) {
    // 중지 로직
    navigator.geolocation.clearWatch(watchId);
    watchId = null;

    if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }

    startBtn.textContent = '🏃 런닝 시작 (화면 켜짐 유지)';
    startBtn.style.background = '#007aff';
    statusDiv.textContent = '중지됨';
    return;
  }

  // 시작 로직
  if (!navigator.geolocation) {
    alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
    return;
  }

  // 화면 꺼짐 방지 요청 (사용자 액션 내부여야 함)
  await requestWakeLock();

  // 위치 추적 시작 (watchPosition 사용)
  const options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  };

  watchId = navigator.geolocation.watchPosition(onLocationSuccess, onLocationError, options);
}

// 버튼 이벤트 리스너
startBtn.addEventListener('click', toggleTracking);

// 화면 가시성 변경 시 Wake Lock 재요청 (페이지로 돌아왔을 때)
document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    await requestWakeLock();
  }
});

// 초기 1회 위치 로드 (지도 표시용)
navigator.geolocation.getCurrentPosition((pos) => {
  onLocationSuccess(pos);
  statusDiv.textContent = '준비 완료';
}, onLocationError);

// 도움말 모달 로직
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const closeSpan = document.getElementsByClassName('close-btn')[0];

helpBtn.onclick = function () {
  helpModal.style.display = 'flex';
}

closeSpan.onclick = function () {
  helpModal.style.display = 'none';
}

window.onclick = function (event) {
  if (event.target == helpModal) {
    helpModal.style.display = 'none';
  }
}
