self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Tourvaa', {
      body: data.body || '',
      icon: data.icon || '/icon.png',
      badge: '/icon.png',
      data: { url: data.url || '/', action: data.action, phone: data.phone, waMsg: data.waMsg },
    })
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
