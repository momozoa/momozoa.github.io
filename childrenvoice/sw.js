self.addEventListener('install', function(e) {
  self.skipWaiting();
});
self.addEventListener('activate', function(e) {
  self.clients.claim();
});
self.addEventListener('fetch', function(event) {
  // 기본적으로 네트워크에서 가져옴
  event.respondWith(fetch(event.request));
});
