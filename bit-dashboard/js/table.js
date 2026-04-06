import { dom } from './dom.js';

export function renderTable(devices) {
  const tbody = dom.tableView.querySelector('tbody');
  const rootStyles = getComputedStyle(document.documentElement);
  const colorNormal = rootStyles.getPropertyValue('--color-normal').trim();
  const colorFault = rootStyles.getPropertyValue('--color-fault').trim();
  const colorCommFault = rootStyles.getPropertyValue('--color-comm-fault').trim();

  // Sort logic preserved...
  const sorted = [...devices].sort((a, b) => {
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    return b.timestamp - a.timestamp;
  });

  let html = '';
  for (const device of sorted) {
    // Determine status type for CSS
    let statusType = 'normal';
    if (device.status === 'fault') {
      statusType = device.faults.comm ? 'comm-fault' : 'fault';
    }

    html += `
      <tr data-device-id="${device.id}" data-status="${statusType}">
        <td><span class="status-dot"></span></td>
        <td>${device.type}</td>
        <td>${device.name}</td>
        <td>${device.stopId}</td>
        <td>${device.faultTypes.join(', ') || '-'}</td>
        <td>${device.timestampString || '-'}</td>
      </tr>
    `;
  }
  tbody.innerHTML = html;

  // Remove pagination if exists (cleanup)
  const pager = dom.tableView.querySelector('.pagination');
  if (pager) pager.remove();
}