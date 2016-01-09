chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch (request.command) {
      case 'setOptions':
        chrome.storage.sync.set(request.payload, sendResponse);
        break;
      case 'getOptions':
        chrome.storage.sync.get(null, sendResponse);
        break;
    }
    return true;
  }
);
