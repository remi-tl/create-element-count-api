export const CREATE_ELEMENT_TRACKER_INIT_SCRIPT = `
(() => {
  const root = globalThis;
  if (root.__createElementTrackerInstalled) {
    return;
  }

  root.__createElementTrackerInstalled = true;

  let count = 0;
  let loadFired = document.readyState === "complete";
  const originalCreateElement = Document.prototype.createElement;

  if (!loadFired) {
    root.addEventListener(
      "load",
      () => {
        queueMicrotask(() => {
          loadFired = true;
        });
      },
      { once: true }
    );
  }

  Document.prototype.createElement = function (...args) {
    if (!loadFired) {
      count += 1;
    }

    return originalCreateElement.apply(this, args);
  };

  root.__createElementTracker = {
    snapshot() {
      return {
        count,
        loadFired,
        readyState: document.readyState
      };
    }
  };
})();
`;

