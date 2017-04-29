function setChildTextNode(elementId, text) {
  document.getElementById(elementId).innerText = text;
}

document.addEventListener('DOMContentLoaded', function() {
  setChildTextNode('labelDisplayBitrate', chrome.i18n.getMessage("display_bitrate"));
  setChildTextNode('labelDisplaySize', chrome.i18n.getMessage("display_size"));
  setChildTextNode('labelDownloadAll', chrome.i18n.getMessage("display_download_all"));
  setChildTextNode('labelFriendlyNames', chrome.i18n.getMessage("friendly_names"));
  setChildTextNode('labelAutoHideDownloadButton', chrome.i18n.getMessage("auto_hide_download_button"));
  setChildTextNode('labelMaxConcurrentDownloads', chrome.i18n.getMessage("max_concurrent_downloads"));
});

chrome.runtime.sendMessage({command: 'getOptions'}, function(response) {
  var options = {};
  var checkboxes = document.querySelectorAll('input[type="checkbox"]');
  Array.prototype.forEach.call(checkboxes, function(checkbox) {
    var id = checkbox.id;
    checkbox.checked = options[id] = !!response[id];
    checkbox.addEventListener('change', function() {
      options[id] = !!checkbox.checked;
      chrome.runtime.sendMessage({command: 'setOptions', payload: options});
    });
  });
});
