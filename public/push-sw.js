// Push notification handler — loaded alongside the workbox service worker.
// This file handles incoming push events and shows notifications.

self.addEventListener('push', function(event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Isometrix', body: event.data.text() };
  }

  const title = data.title || 'Rest Complete';
  const options = {
    body: data.body || 'Time to start your next set!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'rest-timer',
    renotify: true,
    vibrate: [200, 100, 200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// When user taps the notification, open/focus the app
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow('/workout/active');
    })
  );
});
