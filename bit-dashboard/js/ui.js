import { dom } from './dom.js';

export function updateTimestamp() {
  dom.lastUpdated.textContent = `최종 업데이트: ${new Date().toLocaleString()}`;
}

export function handleViewToggle(view) {
  if (view === 'grid') {
    dom.gridView.classList.add('active');
    dom.tableView.classList.remove('active');
    dom.gridViewBtn.classList.add('active');
    dom.tableViewBtn.classList.remove('active');
    // optional: reset scroll position for grid view
    dom.gridView.scrollTop = 0;
  } else {
    dom.gridView.classList.remove('active');
    dom.tableView.classList.add('active');
    dom.gridViewBtn.classList.remove('active');
    dom.tableViewBtn.classList.add('active');
    // ensure table view receives focus for wheel/keyboard scrolling
    if (!dom.tableView.hasAttribute('tabindex')) {
      dom.tableView.setAttribute('tabindex', '0');
    }
    dom.tableView.focus({ preventScroll: true });
  }
}

export function showDetails(device) {
  const d = typeof device === 'object' ? device : null;
  const content = d ? `
    <p><strong>시설물명:</strong> ${d.name}</p>
    <p><strong>정류장 ID:</strong> ${d.stopId}</p>
    <p><strong>단말기 타입:</strong> ${d.type}</p>
    <p><strong>상태:</strong> <span class="status-${d.status}">${d.status === 'fault' ? '장애' : '정상'}</span></p>
    <p><strong>장애 유형:</strong> ${d.faultTypes.join(', ') || '없음'}</p>
    <p><strong>최종 업데이트:</strong> ${d.timestampString || 'N/A'}</p>
    ${d.status === 'fault' ? `
    <div style="margin-top: 20px; padding: 15px; background: rgba(255,69,105,0.1); border-left: 3px solid var(--color-fault); border-radius: 4px;">
      <strong style="color: var(--color-fault);">⚠ 장애 상세</strong>
      <ul style="margin: 10px 0; padding-left: 20px;">
        ${d.faults.comm ? '<li>📡 통신 장애</li>' : ''}
        ${d.faults.power ? '<li>🔌 전원 장애</li>' : ''}
        ${d.faults.door ? '<li>🚪 도어 장애</li>' : ''}
        ${d.faults.shock ? '<li>💥 충격 감지</li>' : ''}
      </ul>
    </div>` : ''}
  ` : '';
  dom.detailsContent.innerHTML = content;
  dom.detailsPanel.classList.add('active');
}

export function hideDetails() {
  dom.detailsPanel.classList.remove('active');
}
