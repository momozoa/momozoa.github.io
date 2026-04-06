import { DEVICE_TYPES, DEVICE_TYPE_COUNTS } from './constants.js';

// 타입별 장애율을 0~20% 랜덤으로 생성
export function generateMockData() {
  const devices = [];
  let deviceIdCounter = 1;
  DEVICE_TYPES.forEach(type => {
    const total = DEVICE_TYPE_COUNTS[type];
    // 0~20% 사이 랜덤 장애율
    const faultRate = Math.random() * 0.2;
    const faultCount = Math.round(total * faultRate);
    const normalCount = total - faultCount;
    // 장애 먼저 생성
    for (let i = 0; i < faultCount; i++) {
      const deviceId = deviceIdCounter++;
      let faults = { comm: false, power: false, door: false, shock: false };
      let faultTypes = [];
      const r = Math.random();
      if (r < 0.3) { faults.comm = true; faultTypes.push('통신'); }
      else if (r < 0.6) { faults.power = true; faultTypes.push('전원'); }
      else if (r < 0.8) { faults.door = true; faultTypes.push('도어'); }
      else { faults.shock = true; faultTypes.push('충격'); }
      const faultTimestamp = new Date(Date.now() - Math.floor(Math.random() * 1000 * 3600 * 24));
      devices.push({
        id: deviceId,
        name: `시설물-${type}-${String(i + 1).padStart(3, '0')}`,
        stopId: `ST-${String(deviceId).padStart(4, '0')}`,
        type,
        status: 'fault',
        faults,
        faultTypes,
        timestamp: faultTimestamp,
        timestampString: faultTimestamp ? faultTimestamp.toLocaleString() : '',
      });
    }
    // 정상 생성
    for (let i = 0; i < normalCount; i++) {
      const deviceId = deviceIdCounter++;
      devices.push({
        id: deviceId,
        name: `시설물-${type}-${String(faultCount + i + 1).padStart(3, '0')}`,
        stopId: `ST-${String(deviceId).padStart(4, '0')}`,
        type,
        status: 'normal',
        faults: { comm: false, power: false, door: false, shock: false },
        faultTypes: [],
        timestamp: null,
        timestampString: '',
      });
    }
  });
  return devices;
}