async function getActiveTab() {
  let tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tabs[0]) {
    return tabs[0];
  }

  tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function setText(id, value) {
  document.getElementById(id).textContent = String(value);
}

function renderSnapshot(snapshot) {
  setText("create-element-count", snapshot.count);

  document.getElementById("status").textContent =
    `${snapshot.title || "(untitled page)"}\n${snapshot.url}\nUpdated ${snapshot.timestamp}`;
}

async function load() {
  const tab = await getActiveTab();
  if (!tab || !tab.id) {
    document.getElementById("status").textContent = "No active tab found.";
    return;
  }

  document.getElementById("status").textContent = `Reading count from ${tab.url || "active tab"}...`;

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_CREATE_ELEMENT_COUNT" });
    if (!response || !response.ok || !response.snapshot) {
      document.getElementById("status").textContent =
        "Tracker data is unavailable on this page. Reload the page after enabling the extension.";
      return;
    }

    renderSnapshot(response.snapshot);
  } catch (_error) {
    document.getElementById("status").textContent =
      "Could not reach the page script. Reload the tab and try again.";
  }
}

document.getElementById("refresh").addEventListener("click", load);

chrome.tabs.onActivated.addListener(() => {
  load();
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    load();
  }
});

load();
