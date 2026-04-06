import { DEVICE_TYPES } from './constants.js';
import { dom } from './dom.js';

let summaryCharts = [];

// Chart.js 도넛 중앙에 텍스트 표시 플러그인
const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    if (chart.config.type !== 'doughnut') return;
    const { ctx, chartArea } = chart;
    const dataset = chart.data.datasets[0];
    if (!dataset) return;
    const total = dataset.data.reduce((a, b) => a + b, 0);
    const fault = dataset.data[1] || 0;
    const rate = total ? Math.round((fault / total) * 100) : 0;

    // Get colors from dataset which are updated from CSS
    const colorNormal = dataset.backgroundColor[0];
    const colorFault = dataset.backgroundColor[1];

    ctx.save();
    ctx.font = 'bold 1.1em Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rate >= 10 ? colorFault : colorNormal; // Use dynamic color
    const { left, right, top, bottom } = chartArea;
    const x = (left + right) / 2;
    const y = (top + bottom) / 2;
    ctx.fillText(`${rate}%`, x, y);
    ctx.restore();
  }
};

export function renderSummary(devices) {
  const rootStyles = getComputedStyle(document.documentElement);
  const colorNormal = rootStyles.getPropertyValue('--success-color').trim();
  const colorFault = rootStyles.getPropertyValue('--danger-color').trim();
  const borderColor = rootStyles.getPropertyValue('--card-border').trim();

  if (summaryCharts.length !== DEVICE_TYPES.length) {
    summaryCharts.forEach(c => c.destroy());
    summaryCharts = [];
    dom.summarySection.innerHTML = '';

    DEVICE_TYPES.forEach((type, index) => {
      const typeDevices = devices.filter(d => d.type === type);
      const total = typeDevices.length;
      const faultCount = typeDevices.filter(d => d.status === 'fault').length;
      const normalCount = total - faultCount;
      const faultCounts = {
        comm: typeDevices.filter(d => d.faults.comm).length,
        power: typeDevices.filter(d => d.faults.power).length,
        door: typeDevices.filter(d => d.faults.door).length,
        shock: typeDevices.filter(d => d.faults.shock).length,
      };
      const faultRate = total ? faultCount / total : 0;

      const summaryCard = document.createElement('div');
      // Warning if > 10%, Danger if >= 20%
      summaryCard.className = `summary-card${faultRate > 0.1 ? ' blinking' : ''}${faultRate >= 0.2 ? ' has-fault' : ''}`;
      summaryCard.dataset.type = type;
      const canvasId = `summary-chart-${index}`;
      summaryCard.innerHTML = `
        <div class="summary-top">
            <div class="summary-info">
                <h3>${type} 타입 단말기</h3>
                <div class="counts-row">
                    <p class="total-count">총 <span class="total-num">${total}</span>대</p>
                    <p class="fault-count">장애 <span class="fault-num">${faultCount}</span>대</p>
                </div>
            </div>
            <div class="summary-chart-container">
                <canvas id="${canvasId}"></canvas>
            </div>
        </div>
        <div class="summary-bottom">
            <div class="fault-details">
              <span><span class="icon">📡</span> 통신 <span class="comm-num">${faultCounts.comm}</span></span>
              <span><span class="icon">🔌</span> 전원 <span class="power-num">${faultCounts.power}</span></span>
              <span><span class="icon">🚪</span> 도어 <span class="door-num">${faultCounts.door}</span></span>
              <span><span class="icon">💥</span> 충격 <span class="shock-num">${faultCounts.shock}</span></span>
            </div>
        </div>
      `;
      dom.summarySection.appendChild(summaryCard);

      const ctx = document.getElementById(canvasId).getContext('2d');
      const chart = new Chart(ctx, { // Chart is global from CDN
        type: 'doughnut',
        data: {
          labels: ['정상', '장애'],
          datasets: [{
            data: [normalCount, faultCount],
            backgroundColor: [colorNormal, colorFault],
            borderColor: borderColor,
            borderWidth: 2,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { display: false },
            tooltip: { enabled: true }
          }
        },
        plugins: [centerTextPlugin]
      });
      summaryCharts.push(chart);
    });
  } else {
    // Update existing charts
    DEVICE_TYPES.forEach((type, index) => {
      const typeDevices = devices.filter(d => d.type === type);
      const total = typeDevices.length;
      const faultCount = typeDevices.filter(d => d.status === 'fault').length;
      const normalCount = total - faultCount;
      const faultCounts = {
        comm: typeDevices.filter(d => d.faults.comm).length,
        power: typeDevices.filter(d => d.faults.power).length,
        door: typeDevices.filter(d => d.faults.door).length,
        shock: typeDevices.filter(d => d.faults.shock).length,
      };
      const faultRate = total ? faultCount / total : 0;

      const chart = summaryCharts[index];
      chart.data.datasets[0].data = [normalCount, faultCount];
      // Update colors in case theme changed
      chart.data.datasets[0].backgroundColor = [colorNormal, colorFault];
      chart.data.datasets[0].borderColor = borderColor;
      chart.update();

      const card = dom.summarySection.querySelector(`[data-type="${type}"]`);
      if (card) {
        card.className = `summary-card${faultRate > 0.1 ? ' blinking' : ''}${faultRate >= 0.2 ? ' has-fault' : ''}`;
        card.querySelector('.total-num').textContent = total;
        card.querySelector('.fault-num').textContent = faultCount;
        card.querySelector('.comm-num').textContent = faultCounts.comm;
        card.querySelector('.power-num').textContent = faultCounts.power;
        card.querySelector('.door-num').textContent = faultCounts.door;
        card.querySelector('.shock-num').textContent = faultCounts.shock;
      }
    });
  }
}