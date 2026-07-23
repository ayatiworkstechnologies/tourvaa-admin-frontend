self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  const notifyOpenClients = self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then(windowClients => {
      windowClients.forEach(client => {
        client.postMessage({ type: 'tourvaa:notification-received' });
      });
    });

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || 'Tourvaa', {
        body: data.body || '',
        icon: data.icon || '/icon.png',
        badge: '/icon.png',
        data: { url: data.url || '/', action: data.action, phone: data.phone, waMsg: data.waMsg },
      }),
      notifyOpenClients,
    ])
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const { action, phone, waMsg, url } = event.notification.data || {};

  if (action === 'whatsapp' && phone) {
    const msg = encodeURIComponent(waMsg || 'Hello!');
    event.waitUntil(clients.openWindow(`https://wa.me/${phone}?text=${msg}`));
  } else {
    event.waitUntil(clients.openWindow(url || '/'));
  }
});
