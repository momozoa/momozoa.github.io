import { generateMockData } from './data.js';

export function fetchData() {
  return new Promise(resolve => {
    setTimeout(() => resolve(generateMockData()), 500);
  });
}