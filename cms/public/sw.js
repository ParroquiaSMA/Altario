self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Notificación de Altario', body: event.data.text() };
    }
  }

  const title = data.title || 'Altario Parroquia';
  const options = {
    body: data.body || 'Tenés una nueva notificación en el sistema.',
    icon: data.icon || '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: data.vibrate || [200, 100, 200, 100, 300],
    renotify: true,
    data: { url: data.url || '/' },
    tag: data.tag || `altario-${Date.now()}`
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(targetUrl)) {
            return client.focus();
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
