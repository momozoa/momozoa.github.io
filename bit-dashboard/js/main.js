import { DEVICE_TYPES, REFRESH_INTERVAL_MS } from './constants.js';
import { initTheme } from './theme.js';
import { dom } from './dom.js';
import { fetchData } from './api.js';
import { renderSummary } from './charts.js';
import { renderHeatmap } from './heatmap.js';
import { renderTable } from './table.js';
import { updateTimestamp, handleViewToggle, showDetails, hideDetails } from './ui.js';

const state = {
  devices: [],
  currentStatusFilter: 'all',
  currentSearchTerm: '',
};

function getFilteredDevices() {
  let filtered = state.devices;
  if (state.currentStatusFilter !== 'all') {
    filtered = filtered.filter(d => d.status === state.currentStatusFilter);
  }
  if (state.currentSearchTerm) {
    const q = state.currentSearchTerm.toLowerCase();
    filtered = filtered.filter(d => d.name.toLowerCase().includes(q) || d.stopId.toLowerCase().includes(q));
  }
  return filtered;
}

function renderAll() {
  renderSummary(state.devices);
  const filtered = getFilteredDevices();
  // 히트맵 렌더
  renderHeatmap(filtered, (device) => showDetails(device));
  // 테이블 전체 렌더 (페이지네이션 제거)
  renderTable(filtered);
  updateTimestamp();
}

async function refresh() {
  const data = await fetchData();
  state.devices = data;
  renderAll();
}

function initEvents() {
  dom.filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.currentTarget.dataset.filter;
      if (!filter) return;
      state.currentStatusFilter = filter;
      dom.filterButtons.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      renderAll();
    });
  });

  dom.searchInput.addEventListener('input', (e) => {
    state.currentSearchTerm = e.target.value;
    renderAll();
  });

  dom.gridViewBtn.addEventListener('click', () => handleViewToggle('grid'));
  dom.tableViewBtn.addEventListener('click', () => handleViewToggle('table'));
  dom.closePanelBtn.addEventListener('click', hideDetails);

  dom.tableView.addEventListener('click', (e) => {
    const row = e.target.closest('tr[data-device-id]');
    if (!row) return;
    const id = Number(row.dataset.deviceId);
    const device = state.devices.find(d => d.id === id);
    if (device) showDetails(device);
  });

  window.addEventListener('resize', () => {
    // 리사이즈 시 히트맵 재렌더 (canvas 크기 재계산)
    const filtered = getFilteredDevices();
    renderHeatmap(filtered, (device) => showDetails(device));
  });

  window.addEventListener('themeChanged', () => {
    renderAll();
  });
}

async function main() {
  initTheme();
  initEvents();
  // Make main views focusable to improve wheel/keyboard scrolling behavior
  if (!dom.tableView.hasAttribute('tabindex')) dom.tableView.setAttribute('tabindex', '0');
  if (!dom.gridView.hasAttribute('tabindex')) dom.gridView.setAttribute('tabindex', '0');
  await refresh();
  setInterval(refresh, REFRESH_INTERVAL_MS);
}

main();
