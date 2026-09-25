const CACHE_NAME = 'mossy-garden-v5';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './cloud.js',
  './supabase-config.js',
  './manifest.json',
  './icons/iconbranco.svg',
  './icons/iconverde.svg'
];

// instala o service worker e guarda os arquivos no cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ativa o service worker e limpa caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// busca os arquivos pela rede primeiro e cai no cache se falhar
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).then((res) => {
      // clona a resposta para salvar no cache dinamicamente
      const resClone = res.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(e.request, resClone);
      });
      return res;
    }).catch(() => {
      // se a rede falhar pega a resposta do cache
      return caches.match(e.request);
    })
  );
});
