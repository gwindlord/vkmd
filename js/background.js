chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch (request.command) {
      case 'setOptions':
        chrome.storage.sync.set(request.payload, sendResponse);
        break;
      case 'getOptions':
        chrome.storage.sync.get({
          vkTokenId: null,
          vkToken: null,
          displayBitrate: true,
          displaySize: true,
          displayDownloadAll: true,
          friendlyNames: true,
          opaqueIcon: true,
          maxConcurrentDownloads: 8,
        }, sendResponse);
        break;
    }
    return true;
  }
);
