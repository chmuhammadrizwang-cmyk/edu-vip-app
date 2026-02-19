// Alarm Service Worker for background notifications
self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SET_ALARM") {
    const { delay, duration } = e.data;
    setTimeout(() => {
      self.registration.showNotification("📚 Study Time!", {
        body: "It's time to study! Open the app to start.",
        icon: "/favicon.ico",
        requireInteraction: true,
        tag: "study-alarm",
      });
    }, delay);
  }
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow("/");
      }
    })
  );
});
