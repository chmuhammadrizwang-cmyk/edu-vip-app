// Study Guard Service Worker — persistent alarm & monitoring
let alarmLoop = null;

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

  // Persistent 10-second alarm loop triggered when user leaves the app
  if (e.data && e.data.type === "START_ALARM_LOOP") {
    const { duration, interval } = e.data;
    if (alarmLoop) clearInterval(alarmLoop);

    // Fire immediately
    self.registration.showNotification("🔒 Study Guard", {
      body: "Come back NOW! You left your study session!",
      icon: "/favicon.ico",
      requireInteraction: true,
      tag: "study-leave-alarm",
    });

    let elapsed = 0;
    alarmLoop = setInterval(() => {
      elapsed += (interval || 10000);
      if (elapsed >= duration) {
        clearInterval(alarmLoop);
        alarmLoop = null;
        return;
      }
      self.registration.showNotification("🔒 Study Guard", {
        body: "Stop wasting time! Go back to studying!",
        icon: "/favicon.ico",
        requireInteraction: true,
        tag: "study-leave-alarm",
      });
    }, interval || 10000);
  }

  if (e.data && e.data.type === "STOP_ALARM_LOOP") {
    if (alarmLoop) {
      clearInterval(alarmLoop);
      alarmLoop = null;
    }
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
