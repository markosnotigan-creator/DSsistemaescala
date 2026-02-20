const CACHE_NAME = 'escalas-ds-v2-hybrid';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './index.tsx',
  './App.tsx',
  // Adicione aqui outros arquivos locais cruciais se houver
];

// Instalação: Cache dos arquivos estáticos locais essenciais
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Ativação: Limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Interceptação de Requisições
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Estratégia para arquivos externos (CDNs: esm.sh, tailwind, etc) e arquivos locais
  // Estratégia: Stale-While-Revalidate
  // Tenta servir do cache imediatamente, mas busca na rede em segundo plano para atualizar o cache p/ próxima vez.
  
  if (
    event.request.method === 'GET' && 
    (requestUrl.origin === location.origin || 
     requestUrl.hostname.includes('esm.sh') || 
     requestUrl.hostname.includes('cdn.tailwindcss.com') ||
     requestUrl.hostname.includes('googleapis.com') ||
     requestUrl.hostname.includes('gstatic.com') ||
     requestUrl.hostname.includes('cdnjs.cloudflare.com'))
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              // Se a resposta for válida, atualiza o cache
              if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic' || networkResponse.type === 'cors') {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => {
              // Se falhar a rede (offline), não faz nada (o cachedResponse será retornado)
              // Se não houver cachedResponse, cairá no return abaixo
            });

          // Retorna o cache se existir, senão espera a rede
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Para outras requisições (ex: chamadas de API do Firebase Firestore que não são estáticas),
  // deixamos o navegador/SDK lidar (o Firebase tem seu próprio cache interno via IndexedDB)
  // Mas se for uma imagem ou algo que queremos tentar cachear:
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});