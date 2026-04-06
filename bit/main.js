const colsPerChar = 16;
const rowsPerChar = 16;
const maxCols = 6;
const maxRows = 2;
const totalCols = colsPerChar * maxCols;
const totalRows = rowsPerChar * maxRows;


const panel = document.getElementById('panel');
const dots = [];
for (let i = 0; i < totalCols * totalRows; i++) {
  const d = document.createElement('div');
  d.className = 'dot';
  panel.appendChild(d);
  dots.push(d);
}

// LED 전체 on/off 토글 기능
let ledAllOn = false;
const allOnToggle = document.getElementById('allOnToggle');
allOnToggle.addEventListener('change', function() {
  ledAllOn = allOnToggle.checked;
  dots.forEach(dot => dot.classList.toggle('on', ledAllOn));
});

// LED dot 오버레이(점) 전체를 숨기거나 보이게 하는 토글 기능
const overlayToggle = document.getElementById('overlayToggle');
overlayToggle.addEventListener('change', function() {
  panel.style.opacity = overlayToggle.checked ? '1' : '0';
});

const inputBox1 = document.getElementById('text1');
const inputBox2 = document.getElementById('text2');
const fontSizeSlider = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const fontSelect = document.getElementById('fontSelect');

[inputBox1, inputBox2, fontSizeSlider, fontSelect].forEach(el => el.addEventListener('input', drawText));

// 스크롤 상태 관리
let scrollState = [0, 0]; // [윗줄, 아랫줄]의 현재 스크롤 위치
let scrollDir = [1, 1];   // [윗줄, 아랫줄]의 방향(1:오른쪽, -1:왼쪽)
let scrollTimer = null;

function drawText() {
  const ledFontSize = parseInt(fontSizeSlider.value, 10);
  fontSizeValue.textContent = ledFontSize;
  const fontFamily = fontSelect.value;

  const canvas = document.createElement('canvas');
  canvas.width = totalCols;
  canvas.height = totalRows;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, totalCols, totalRows);

  // 두 줄 입력값
  const texts = [inputBox1.value, inputBox2.value];
  const rowYs = [0, rowsPerChar];
  const maxWidth = totalCols;

  for (let row = 0; row < 2; row++) {
    let text = texts[row];
    if (!text) continue;
    // 한 글자당 픽셀 폭(대략)
    const charWidth = colsPerChar;
    // 전체 텍스트 픽셀 폭
    const textPixelLen = text.length * charWidth;
    // 스크롤 위치(px)
    let scrollPx = 0;
    if (textPixelLen > maxWidth) {
      scrollPx = scrollState[row];
    }
    for (let i = 0; i < text.length; i++) {
      const x = i * charWidth - scrollPx;
      if (x + charWidth < 0 || x > maxWidth) continue; // 패널 밖은 그리지 않음
      const charCanvas = document.createElement('canvas');
      charCanvas.width = 32;
      charCanvas.height = 32;
      const charCtx = charCanvas.getContext('2d');
      charCtx.fillStyle = 'black';
      charCtx.fillRect(0, 0, 32, 32);
      charCtx.fillStyle = 'white';
      // 폰트 이름에 공백이 있으면 따옴표로 감싸기
      let fam = fontFamily;
      if (fam.includes(' ')) fam = '"' + fam + '"';
      // 선택 폰트 우선, 그 외 fallback
      charCtx.font = `${ledFontSize}px ${fam}, 'Jua', 'Nanum Gothic', sans-serif`;
      charCtx.textBaseline = 'top';
      charCtx.fillText(text[i], 0, 0);
      ctx.drawImage(charCanvas, 0, 0, 16, 16, x, rowYs[row], charWidth, rowsPerChar);
    }
  }

  const img = ctx.getImageData(0, 0, totalCols, totalRows).data;
  for (let r = 0; r < totalRows; r++) {
    for (let c = 0; c < totalCols; c++) {
      const idx = (r * totalCols + c) * 4;
      const bright = img[idx];
      dots[r * totalCols + c].classList.toggle('on', bright > 128);
    }
  }
}

function startScroll() {
  if (scrollTimer) clearInterval(scrollTimer);
  scrollTimer = setInterval(() => {
    let changed = false;
    const texts = [inputBox1.value, inputBox2.value];
    const charWidth = colsPerChar;
    const maxWidth = totalCols;
    for (let row = 0; row < 2; row++) {
      const text = texts[row];
      const textPixelLen = text.length * charWidth;
      if (textPixelLen > maxWidth) {
        // 왕복 스크롤(px 단위)
        if (scrollDir[row] > 0) {
          if (scrollState[row] < textPixelLen - maxWidth) {
            scrollState[row] += 1;
          } else {
            scrollDir[row] = -1;
            scrollState[row] -= 1;
          }
        } else {
          if (scrollState[row] > 0) {
            scrollState[row] -= 1;
          } else {
            scrollDir[row] = 1;
            scrollState[row] += 1;
          }
        }
        changed = true;
      } else {
        scrollState[row] = 0;
        scrollDir[row] = 1;
      }
    }
    if (changed) drawText();
  }, 30);
}

inputBox1.addEventListener('input', () => { scrollState[0]=0; scrollDir[0]=1; drawText(); });
inputBox2.addEventListener('input', () => { scrollState[1]=0; scrollDir[1]=1; drawText(); });

startScroll();
