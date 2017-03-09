chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch (request.command) {
      case 'setOptions':
        chrome.storage.sync.set(request.payload, sendResponse);
        break;
      case 'getOptions':
        chrome.storage.sync.get({
          displayBitrate: true,
          displaySize: true,
          displayDownloadAll: true,
          friendlyNames: true,
          opaqueIcon: true,
          vkToken: '',
          maxConcurrentDownloads: 8,
        }, sendResponse);
        break;
    }
    return true;
  }
);
