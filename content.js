(function () {
  const source = chrome.runtime.getURL("page-hook.js");
  const script = document.createElement("script");
  script.src = source;
  script.async = false;
  (document.head || document.documentElement).appendChild(script);
  script.remove();

  function requestSnapshot() {
    return new Promise((resolve) => {
      const requestId = `create-element-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      function onMessage(event) {
        if (event.source !== window) {
          return;
        }

        const data = event.data;
        if (!data || data.source !== "create-element-tracker" || data.kind !== "snapshot" || data.requestId !== requestId) {
          return;
        }

        window.removeEventListener("message", onMessage);
        resolve(data.snapshot);
      }

      window.addEventListener("message", onMessage);
      window.postMessage(
        {
          source: "create-element-tracker",
          kind: "request-snapshot",
          requestId
        },
        "*"
      );

      setTimeout(() => {
        window.removeEventListener("message", onMessage);
        resolve(null);
      }, 1000);
    });
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.type !== "GET_CREATE_ELEMENT_COUNT") {
      return false;
    }

    requestSnapshot().then((snapshot) => {
      sendResponse({
        ok: Boolean(snapshot),
        snapshot
      });
    });

    return true;
  });
})();
