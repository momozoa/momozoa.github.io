
import { dom } from './dom.js';

// 툴팁 DOM을 전역에서 관리
let heatmapTooltip = null;
function showTooltip(x, y, html) {
  if (!heatmapTooltip) {
    heatmapTooltip = document.createElement('div');
    heatmapTooltip.className = 'heatmap-tooltip';
    document.body.appendChild(heatmapTooltip);
  }
  heatmapTooltip.innerHTML = html;
  heatmapTooltip.style.display = 'block';
  heatmapTooltip.style.left = x + 12 + 'px';
  heatmapTooltip.style.top = y + 12 + 'px';
}
function hideTooltip() {
  if (heatmapTooltip) heatmapTooltip.style.display = 'none';
}

export function renderHeatmap(filteredDevices, onCellClick) {
  dom.gridView.innerHTML = '';
  const rootStyles = getComputedStyle(document.documentElement);
  const colorNormal = rootStyles.getPropertyValue('--success-color').trim();
  const colorFault = rootStyles.getPropertyValue('--danger-color').trim();
  const colorCommFault = rootStyles.getPropertyValue('--warning-color').trim();

  const byType = filteredDevices.reduce((acc, d) => {
    (acc[d.type] ||= []).push(d);
    return acc;
  }, {});

  Object.keys(byType).sort().forEach(type => {
    const group = byType[type];
    const title = document.createElement('div');
    title.textContent = `${type} 타입 (${group.length}대)`;
    title.style.margin = '16px 0 4px 0';
    title.style.fontWeight = 'bold';
    title.style.color = 'var(--accent-color)';
    dom.gridView.appendChild(title);

    const canvas = document.createElement('canvas');
    const gridSize = 8;
    const gap = 2;
    // robust container width measurement (avoid 0 on first paint)
    const gridEl = dom.gridView;
    const gridStyles = getComputedStyle(gridEl);
    const paddingX = parseFloat(gridStyles.paddingLeft || '0') + parseFloat(gridStyles.paddingRight || '0');
    let availWidth = gridEl.clientWidth;
    if (!availWidth) availWidth = gridEl.getBoundingClientRect().width;
    if (!availWidth && gridEl.parentElement) availWidth = gridEl.parentElement.clientWidth;
    if (!availWidth && gridEl.parentElement) availWidth = gridEl.parentElement.getBoundingClientRect().width;
    if (!availWidth) availWidth = window.innerWidth;
    const usable = Math.max(0, Math.floor(availWidth - paddingX));
    const cols = Math.max(1, Math.min(group.length, Math.floor(usable / (gridSize + gap))));
    const rows = Math.ceil(group.length / cols);
    // compute canvas pixel size without trailing gap to avoid horizontal overflow
    const canvasWidth = cols * gridSize + (cols - 1) * gap;
    const canvasHeight = rows * gridSize + (rows - 1) * gap;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    // match CSS size to pixel size to avoid scaling and X-scroll
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    canvas.style.display = 'block';
    canvas.style.marginBottom = '12px';
    dom.gridView.appendChild(canvas);


    const ctx = canvas.getContext('2d');
    // 하이라이트 인덱스 추적
    let hoverIdx = -1;
    function draw(highlightIdx = -1) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      group.forEach((device, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        let color = colorNormal;
        if (device.status === 'fault') color = device.faults.comm ? colorCommFault : colorFault;
        ctx.fillStyle = color;
        const x = col * (gridSize + gap);
        const y = row * (gridSize + gap);
        ctx.fillRect(x, y, gridSize, gridSize);
        if (i === highlightIdx) {
          ctx.save();
          ctx.strokeStyle = 'var(--accent-color)';
          ctx.lineWidth = 2;
          ctx.shadowColor = 'var(--accent-color)';
          ctx.shadowBlur = 8;
          ctx.strokeRect(x - 1, y - 1, gridSize + 2, gridSize + 2);
          ctx.restore();
        }
      });
    }
    draw();

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor(x / (gridSize + gap));
      const row = Math.floor(y / (gridSize + gap));
      const idx = row * cols + col;
      if (idx >= 0 && idx < group.length) {
        if (hoverIdx !== idx) {
          hoverIdx = idx;
          draw(hoverIdx);
        }
        const d = group[idx];
        showTooltip(e.clientX, e.clientY, `
          <div style="font-weight:bold;color:var(--accent-color)">${d.name}</div>
          <div style="font-size:0.95em;color:var(--text-muted)">ID: ${d.stopId}</div>
          <div style="font-size:0.95em;">상태: <span style="color:${d.status === 'fault' ? (d.faults.comm ? colorCommFault : colorFault) : colorNormal}">${d.status === 'fault' ? '장애' : '정상'}</span></div>
          <div style="font-size:0.95em;">타입: ${d.type}</div>
        `);
      } else {
        if (hoverIdx !== -1) {
          hoverIdx = -1;
          draw(-1);
        }
        hideTooltip();
      }
    });
    canvas.addEventListener('mouseleave', () => {
      hoverIdx = -1;
      draw(-1);
      hideTooltip();
    });
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor(x / (gridSize + gap));
      const row = Math.floor(y / (gridSize + gap));
      const idx = row * cols + col;
      if (idx >= 0 && idx < group.length) onCellClick(group[idx]);
    });
  });
}