/* Oflayn ishlash uchun oddiy service worker. Versiyani o‘zgartirsang, eski keshlar tozalanadi. */
var V = 'orbit-v2';
var CORE = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png', '/apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(V).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (u.pathname.indexOf('/_vercel/') === 0) return;

  // Sahifaning o‘zi: avval tarmoq, internet bo‘lmasa keshdan.
  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r).then(function (res) {
        var cp = res.clone();
        caches.open(V).then(function (c) { c.put('/', cp); });
        return res;
      }).catch(function () { return caches.match('/'); })
    );
    return;
  }

  // Shriftlar va o‘z fayllarimiz: keshdan darrov, orqada yangilash.
  var fontHost = u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
  if (u.origin === location.origin || fontHost) {
    e.respondWith(
      caches.match(r).then(function (hit) {
        var net = fetch(r).then(function (res) {
          if (res && (res.ok || res.type === 'opaque')) {
            var cp = res.clone();
            caches.open(V).then(function (c) { c.put(r, cp); });
          }
          return res;
        }).catch(function () { return hit; });
        return hit || net;
      })
    );
  }
});
