// Naikkan VERSI setiap kali index.html berubah agar pengguna mendapat versi terbaru.
const VERSI = 'catatan-v1';
const INTI = ['./', 'index.html', 'manifest.json', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSI).then((c) => c.addAll(INTI)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSI).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !font) return;

  // Halaman: coba jaringan dulu, jatuh ke cache saat offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const salin = res.clone();
        caches.open(VERSI).then((c) => c.put('index.html', salin));
        return res;
      }).catch(() => caches.match('index.html'))
    );
    return;
  }

  // Aset dan font: tampilkan cache, perbarui di belakang
  e.respondWith(
    caches.open(VERSI).then((c) =>
      c.match(req).then((hit) => {
        const jaringan = fetch(req).then((res) => {
          if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
          return res;
        }).catch(() => hit);
        return hit || jaringan;
      })
    )
  );
});
