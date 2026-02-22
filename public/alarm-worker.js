// Web Worker for accurate alarm timing (not throttled by mobile browsers)
let alarmInterval = null;

self.onmessage = function (e) {
  if (e.data.type === "START") {
    if (alarmInterval) clearInterval(alarmInterval);
    alarmInterval = setInterval(() => {
      self.postMessage({ type: "TICK" });
    }, e.data.interval || 10000);
  }
  if (e.data.type === "STOP") {
    if (alarmInterval) {
      clearInterval(alarmInterval);
      alarmInterval = null;
    }
  }
};
