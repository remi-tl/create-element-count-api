(function () {
  if (window.__createElementTrackerInstalled) {
    return;
  }
  window.__createElementTrackerInstalled = true;

  let count = 0;
  const originalCreateElement = Document.prototype.createElement;

  Document.prototype.createElement = function (...args) {
    count += 1;
    return originalCreateElement.apply(this, args);
  };

  window.addEventListener("message", (event) => {
    if (event.source !== window) {
      return;
    }

    const data = event.data;
    if (!data || data.source !== "create-element-tracker" || data.kind !== "request-snapshot") {
      return;
    }

    window.postMessage(
      {
        source: "create-element-tracker",
        kind: "snapshot",
        requestId: data.requestId,
        snapshot: {
          url: location.href,
          title: document.title,
          timestamp: new Date().toISOString(),
          count
        }
      },
      "*"
    );
  });
})();
