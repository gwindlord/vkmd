var options = {};

function saveAs(blob, filename) {
  var url = window.URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

function downloadAs(url, filename, handlers) {
  var xhr = new XMLHttpRequest();
  xhr.responseType = 'blob';
  xhr.addEventListener('loadstart', handlers.start);
  xhr.addEventListener('loadend', handlers.end);
  xhr.addEventListener('progress', handlers.progress);
  xhr.addEventListener('load', function() {
    saveAs(new window.Blob([this.response], {type: 'octet/stream'}), filename);
  });
  xhr.open('GET', url, true);
  xhr.send()
}

function getFilename(title) {
  return title.replace(/[\\~#%&*{}/:<>?|"]/gi, '_') + '.mp3';
}

function createElement(className, appendTo, tagName) {
  var div = document.createElement(tagName || 'div');
  className && (div.className = className);
  appendTo && appendTo.appendChild(div);
  return div;
}

function createDownloadButton(url, filename) {
  var elWrap = createElement('vkmd_download_btn_wrap');
  var elButton = createElement('vkmd_download_btn', elWrap, 'a');
  elButton.href = url;
  elButton.download = filename;
  return elWrap;
}

function createProgressBox() {
  var elProgressBox = createElement('vkmd_progress_box');
  var elProgressText = createElement('vkmd_progress_text', elProgressBox);
  elProgressText.innerHTML = 'Loading:';
  var elProgressBar = createElement('vkmd_progress_bar', elProgressBox);
  createElement('vkmd_progress_line', elProgressBar);
  return elProgressBox;
}

function adjustTop(startNode, mod) {
  var id = '#' + startNode.id;
  var nodeList = startNode.parentNode.querySelectorAll(id + ' ~ *');
  Array.prototype.forEach.call(nodeList, function(node) {
    var top = parseFloat(node.style.top);
    if (top !== void 0) {
      node.style.top = (top + mod) + 'px';
    }
  });
}

function attachDownloadButton(elAudio) {
  // retrieving containers
  var elPlayButtonWrap = elAudio.querySelector('.play_btn_wrap');
  var elPlaybox = elPlayButtonWrap && elPlayButtonWrap.parentNode;
  if (!elPlaybox) {
    return;
  }
  // retrieving audio title
  var elTitleWrap = elAudio.querySelector('.title_wrap');
  var elArtist = elTitleWrap.querySelector('a');
  var elTitle = elTitleWrap.querySelector('.title');
  var artist = elArtist.innerText.trim();
  var track = elTitle.innerText.trim();
  var title = artist + ' - ' + track;
  // retrieving audio info (url and duration)
  var elAudioInfo = elAudio.querySelector('input[type="hidden"]');
  var audioInfo = elAudioInfo.value.trim().split(',');
  var url = audioInfo[0];
  var duration = audioInfo[1];
  var filename = options.friendlyNames ? getFilename(title) : url.split('/').pop().split('?').shift();
  // creating download button
  var elDownloadButton = createDownloadButton(url, filename);
  elPlaybox.appendChild(elDownloadButton);
  // creating progress box
  var elProgressBox = createProgressBox();
  var elProgressLine = elProgressBox.querySelector('.vkmd_progress_line');
  var progressBoxHeight = 0;
  // for tables create additional TR for progress box
  if (elPlaybox.parentNode.nodeName == 'TR') {
    var elTable = elPlaybox.parentNode.parentNode;
    var elTr = createElement('', elTable, 'tr');
    var elTd = createElement('', elTr, 'td');
    elTd.colSpan = 2;
    elTd.appendChild(elProgressBox);
  }
  if (elPlaybox.parentNode.nodeName == 'DIV') {
    elAudio.appendChild(elProgressBox);
    progressBoxHeight = elProgressBox.offsetHeight;
  }
  elProgressBox.style.display = 'none';
  // if fancyLoading is enabled, attach a special loader to download button
  if (options.fancyLoading) {
    elDownloadButton.addEventListener('click', function(event) {
      event.stopPropagation();
      event.preventDefault();
      // prevent multiple download of the same file
      if (elDownloadButton.vkmdLoading) {
        return;
      }
      downloadAs(url, filename, {
        start: function() {
          elDownloadButton.vkmdLoading = true;
          elProgressBox.style.display = 'block';
          adjustTop(elAudio, progressBoxHeight);
        },
        end: function() {
          elDownloadButton.vkmdLoading = false;
          elProgressBox.style.display = 'none';
          adjustTop(elAudio, -progressBoxHeight);
        },
        progress: function(event) {
          if (event.lengthComputable) {
            elProgressLine.style.width = (event.loaded / event.total * 100) + '%';
          }
        }
      });
    });
  }
  // if displayBitrate or displaySize is enabled, query and show this information
  if (options.displayBitrate || options.displaySize) {
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.addEventListener('load', function() {
      var contentLength = this.getResponseHeader('Content-Length');
      var stats = [];
      if (options.displayBitrate) {
        stats.push(Math.floor(contentLength * 8 / 1000 / duration) + ' kbps');
      }
      if (options.displaySize) {
        stats.push((contentLength / (1024 * 1024)).toFixed(2) + ' Mb');
      }
      var elBitrate = createElement('vkmd_audio_stats', elTitleWrap, 'span');
      elBitrate.innerText = ' [' + stats.join(' / ') + '] ';
    });
    xhr.open('HEAD', url, true);
    xhr.send();
  }
}

function processAudioNode(node) {
  if (node && !node.vkmd && node.nodeType === 1 && node.classList.contains('audio')) {
    node.vkmd = true;
    attachDownloadButton(node);
  }
}

function processAudioNodes(node) {
  if (node.nodeType === 1) {
    processAudioNode(node);
    Array.prototype.forEach.call(node.querySelectorAll('.audio'), processAudioNode);
  }
}

chrome.runtime.sendMessage({command: 'getOptions'}, function(response) {
  // process existing nodes
  processAudioNodes(document.documentElement);
  // processing options
  options = response;
  // observing DOM modifications
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      Array.prototype.forEach.call(mutation.addedNodes, processAudioNodes);
    });
  });
  var config = {
    childList: true,
    attributes: false,
    characterData: false,
    subtree: true
  };
  observer.observe(document.documentElement, config);
});
