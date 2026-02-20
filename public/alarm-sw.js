// Study Guard Service Worker — persistent alarm & monitoring
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
      self.registration.showNotification("🔒 Study Guard", {
        body: "It's time to study! Open the app to start.",
        icon: "/favicon.ico",
        requireInteraction: true,
        tag: "study-alarm",
      });
      // Persistent loop every 30s for the entire duration
      let elapsed = 0;
      const loop = setInterval(() => {
        elapsed += 30000;
        if (elapsed >= duration) { clearInterval(loop); return; }
        self.registration.showNotification("🔒 Study Guard", {
          body: "Focus! Get back to studying now!",
          icon: "/favicon.ico",
          requireInteraction: true,
          tag: "study-alarm-loop",
        });
      }, 30000);
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
