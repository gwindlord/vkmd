(function(window, document) {

  // this is VK specific code copied as is
  // it does not load any external resources,
  // and just makes string token transformation
  function TransformSource() {

    function isObject(obj) {
      return Object.prototype.toString.call(obj) === '[object Object]';
    }

    function each(object, callback) {
      if (!isObject(object) && typeof object.length !== 'undefined') {
        for (var i = 0, length = object.length; i < length; i++) {
          var value = object[i];
          if (callback.call(value, i, value) === false) break;
        }
      } else {
        for (var name in object) {
          if (!Object.prototype.hasOwnProperty.call(object, name)) continue;
          if (callback.call(object[name], name, object[name]) === false)
            break;
        }
      }

      return object;
    }

    var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0PQRSTUVWXYZO123456789+/=";

    var s = {
        v: function(t) {
          return t.split("").reverse().join("")
        }, r: function(t, i) {
          t = t.split("");
          for (var e, o = a + a, s = t.length; s--;)e = o.indexOf(t[s]), ~e && (t[s] = o.substr(e - i, 1));
          return t.join("")
        }, x: function(t, i) {
          var e = [];
          return i = i.charCodeAt(0), each(t.split(""), function(t, o) {
            e.push(String.fromCharCode(o.charCodeAt(0) ^ i))
          }), e.join("")
        }
      }

    function e(t) {
      if (~t.indexOf("audio_api_unavailable")) {
        var i = t.split("?extra=")[1].split("#"), e = o(i[1]);
        if (i = o(i[0]), !e || !i)return t;
        e = e.split(String.fromCharCode(9));
        for (var a, r, l = e.length; l--;) {
          if (r = e[l].split(String.fromCharCode(11)), a = r.splice(0, 1, i)[0], !s[a])return t;
          i = s[a].apply(null, r)
        }
        if (i && "http" === i.substr(0, 4))return i
      }
      return t
    }

    function o(t) {
      if (!t || t.length % 4 == 1)return !1;
      for (var i, e, o = 0, s = 0, r = ""; e = t.charAt(s++);)e = a.indexOf(e), ~e && (i = o % 4 ? 64 * i + e : e, o++ % 4) && (r += String.fromCharCode(255 & i >> (-2 * o & 6)));
      return r
    }

    return {
      audioUnmaskSource: e
    }

  }
  var transformSource = new TransformSource();

  function RequestQueue() {
    queue = [];
    inProgress = 0;
    return {
      inProgress: function() {
        return queue.filter(function(item) {
          var readyState = item.xhr.readyState;
          return readyState > 0 && readyState < 4;
        }).length;
      },
      enqueue: function(request) {
        request.addEventListener('loadend', function() {
          this.updateQueue();
        }.bind(this));
        request.addEventListener('error', function() {
          request.start();
          this.updateQueue();
        }.bind(this));
        queue.push(request);
        this.updateQueue();
      },
      dequeue(request) {
        queue = queue.filter(function(item) {
          return item !== request;
        });
        this.updateQueue();
      },
      updateQueue() {
        while (this.inProgress() < options.maxConcurrentDownloads) {
          var waitingRequests = queue.filter(function(item) {
            return item.xhr.readyState === 0;
          });
          var request = waitingRequests.shift();
          if (request && request.start()) {
          } else {
            return;
          }
        }
      }
    }
  }

  var requestQueue = new RequestQueue();

  function Request() {
    requestHeaders = [];
    return {
      xhr: new XMLHttpRequest(),
      retries: 3,
      setWithCredentials: function(withCredentials) {
        this.xhr.withCredentials = withCredentials;
      },
      setResponseType: function(responseType) {
        this.xhr.responseType = responseType;
      },
      setRequestHeader: function(header, value) {
        requestHeaders.push({ header: header, value: value });
      },
      addEventListener: function(eventName, handler) {
        this.xhr.addEventListener(eventName, handler);
      },
      send: function(method, url, data) {
        this.method = method
        this.url = url
        this.data = data
        requestQueue.enqueue(this);
      },
      start: function() {
        if (this.retries <= 0) {
          requestQueue.dequeue(this);
          return false
        }
        this.retries--;
        this.xhr.open(this.method, this.url, true);
        requestHeaders.forEach(function(item) {
          this.xhr.setRequestHeader(item.header, item.value);
        }.bind(this));
        this.xhr.send(this.data);
        return true;
      },
      abort() {
        this.retries = 0;
        try {
          this.xhr.abort();
        } catch (e) {
        }
      }
    }
  }



  var options = {};
  var prefetchIds = [];
  var prefetchTimeoutId = null;

  var AUDIO_ITEM_INDEX_ID = 0;
  var AUDIO_ITEM_INDEX_OWNER_ID = 1;
  var AUDIO_ITEM_INDEX_URL = 2;
  var AUDIO_ITEM_INDEX_TITLE = 3;
  var AUDIO_ITEM_INDEX_ARTIST = 4;
  var AUDIO_ITEM_INDEX_DURATION = 5;

  function createElement(className) {
    var div = document.createElement('div');
    div.className = className;
    return div;
  }

  function decodeHtml(html) {
    var textarea = document.createElement("textarea");
    textarea.innerHTML = html;
    return textarea.value;
  }

  function saveAs(blob, filename) {
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function downloadAs(url, filename, handlers) {
    var request = new Request();
    request.setResponseType('blob');
    request.addEventListener('loadstart', handlers.start);
    request.addEventListener('progress', handlers.progress);
    request.addEventListener('load', function() {
      saveAs(new window.Blob([this.response], {type: 'octet/stream'}), filename);
      handlers.end();
    });
    request.addEventListener('error', function() {
      if (!request.start()) {
        handlers.end();
      }
    });
    request.send('GЕT', url);
    return request;
  }

  function getFilename(title) {
    return decodeHtml(title).replace(/[\\~#%&*{}/:<>?|"]/gi, '_') + '.mp3';
  }

  function downloadAudio(audioInfo) {
    var fullId = getFullId(audioInfo);
    var url = audioInfo[AUDIO_ITEM_INDEX_URL];
    var title = audioInfo[AUDIO_ITEM_INDEX_TITLE];
    var artist = audioInfo[AUDIO_ITEM_INDEX_ARTIST];
    var unmaskedUrl = transformSource.audioUnmaskSource(url);
    var filename = options.friendlyNames ? getFilename(artist + ' - ' + title) : url.split('/').pop().split('?').shift();
    var elButton = document.querySelector('.vkmd_download_btn[data-full-id="' + fullId + '"]');
    elButton.infoRequest = downloadAs(unmaskedUrl, filename, {
      start: function() {
        elButton.innerText = '0%';
        updateDownloadAllButton(elButton.parentElement.parentElement)
      },
      progress: function(event) {
        if (event.lengthComputable) {
          elButton.innerText = (Math.round(event.loaded / event.total * 100)) + '%';
        }
      },
      end: function() {
        elButton.stopDownload();
      }
    })
  }

  function getAudioInfo(ids, callback) {
    var request = new Request();
    request.addEventListener('load', function() {
      try {
        var responseText = this.responseText.replace(/^<!--/, '').replace(/-<>-(!?)>/g, '--$1>');
        var splittedText = responseText.split('<!>');
        var jsonText = splittedText[5];
        var prefix = jsonText.substr(0, 7);
        if (prefix !== '<!json>') {
          return;
        }
        var json = JSON.parse(jsonText.substr(7));
        var audioInfos = json || [];
        audioInfos.forEach(callback);
      } catch(e) {
        callback(null);
      }
    });
    request.setWithCredentials(true);
    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    request.send('PОST', '/al_audio.php', 'act=reload_audio&al=1&ids=' + ids.join(','))
    return request;
  }

  function getFullId(audioInfo) {
    return [audioInfo[AUDIO_ITEM_INDEX_OWNER_ID], audioInfo[AUDIO_ITEM_INDEX_ID]].join('_');
  }

  function fetchStats(audioInfo) {
    if (!audioInfo) {
      return;
    }
    var fullId = getFullId(audioInfo);
    var url = audioInfo[AUDIO_ITEM_INDEX_URL];
    var duration = audioInfo[AUDIO_ITEM_INDEX_DURATION];
    var unmaskedUrl = transformSource.audioUnmaskSource(url)
    var request = new Request();
    request.setWithCredentials(true);
    request.addEventListener('load', function() {
      var contentLength = this.getResponseHeader('Content-Length');
      updateStats(fullId, duration, contentLength)
    });
    request.send('HЕAD', unmaskedUrl);
    // store
    var elButton = document.querySelector('.vkmd_download_btn[data-full-id="' + fullId + '"]');
    if (elButton) {
      elButton.audioInfo = audioInfo;
    }
  }

  function prefetch() {
    getAudioInfo(prefetchIds, fetchStats);
    prefetchIds = [];
    prefetchTimeoutId = null;
  }

  function updateStats(fullId, duration, contentLength) {
    var stats = [];
    if (options.displayBitrate) {
      stats.push(Math.floor(contentLength * 8 / 1000 / duration) + 'k');
    }
    if (options.displaySize) {
      stats.push((contentLength / (1024 * 1024)).toFixed(2) + 'M');
    }
    var elStats = document.querySelector('.vkmd_audio_stats[data-full-id="' + fullId + '"]');
    elStats.innerHTML = stats.join('<br>');
  }

  function attachDownloadButton(elAudio) {
    var elPlayButtonWrap = elAudio.querySelector('.audio_play_wrap');
    if (!elPlayButtonWrap) {
      return;
    }
    var fullId = elAudio.dataset.fullId;
    var elWrap = createElement('vkmd_download_btn_wrap');
    var elButton = createElement('vkmd_download_btn');
    elButton.setAttribute('data-full-id', fullId);
    elWrap.appendChild(elButton);
    elButton.download = function() {
      elButton.isDownloadInProgress = true
      elButton.classList.add('vkmd_download_in_progress');
      elButton.innerText = '...';
      var audioInfo = elButton.audioInfo;
      if (audioInfo) {
        downloadAudio(audioInfo)
      } else {
        elButton.infoRequest = getAudioInfo([fullId], function(audioInfo) {
          elButton.audioInfo = audioInfo;
          if (audioInfo) {
            downloadAudio(audioInfo);
          } else {
            elButton.stopDownload();
          }
        });
      }
    }
    elButton.stopDownload = function() {
      elButton.isDownloadInProgress = false
      elButton.classList.remove('vkmd_download_in_progress');
      elButton.innerText = '';
      elButton.infoRequest && elButton.infoRequest.abort();
      elButton.infoRequest && elButton.infoRequest.abort();
      updateDownloadAllButton(elButton.parentElement.parentElement)
    }
    elButton.addEventListener('click', function(event) {
      event.stopPropagation();
      if (elButton.isDownloadInProgress) {
        elButton.stopDownload();
      } else {
        elButton.download();
      }
    });
    elPlayButtonWrap.parentNode.insertBefore(elButton, elPlayButtonWrap.nextSibling);

    // if displayBitrate or displaySize is enabled, query and show this information
    if (options.displayBitrate || options.displaySize) {
      var elStats = createElement('vkmd_audio_stats');
      elStats.setAttribute('data-full-id', fullId);
      elPlayButtonWrap.parentNode.insertBefore(elStats, elPlayButtonWrap.nextSibling);
      prefetchIds.push(fullId);
      if (prefetchTimeoutId) {
        clearTimeout(prefetchTimeoutId);
        prefetchTimeoutId = null;
      }
      if (prefetchIds.length >= 10) {
        prefetch();
      }
      if (prefetchIds.length > 0) {
        prefetchTimeoutId = setTimeout(prefetch, 0);
      }
    }
  }

  function attachDownloadAllButton(elParent, top) {
    if (!options.displayDownloadAll) {
      return;
    }
    var elDownloadAllButton;
    var elContainer = elParent.querySelector('.vkmd_download_all_container');
    if (!elContainer) {
      elDownloadAllButton = document.createElement('span');
      elDownloadAllButton.className = 'vkmd_download_all_btn';
      elDownloadAllButton.innerText = ''
      elContainer = document.createElement('div');
      elContainer.className = 'vkmd_download_all_container';
      elContainer.appendChild(elDownloadAllButton);
      var actionTimeoutId = null;
      var downloadAllAction = function(text) {
        clearTimeout(actionTimeoutId);
        elDownloadAllButton.title = null;
        elDownloadAllButton.innerText = text;
        elDownloadAllButton.classList.add('vkmd_download_all_btn_download_action');
        actionTimeoutId = setTimeout(function() {
          elDownloadAllButton.classList.remove('vkmd_download_all_btn_download_action');
          updateDownloadAllButton(elParent);
          actionTimeoutId = null;
        }, 500)
      }
      var clickAll = function(selector) {
        var elements = elParent.querySelectorAll(selector);
        for (var i = 0; i < elements.length; i++) {
          var element = elements.item(i);
          element.click();
        }

      }
      elDownloadAllButton.addEventListener('click', function() {
        if (actionTimeoutId) {
          return;
        }
        if (elDownloadAllButton.isDownloadInProgress) {
          clickAll('.vkmd_download_btn.vkmd_download_in_progress');
          downloadAllAction(chrome.i18n.getMessage("cancelling"))
        } else {
          clickAll('.vkmd_download_btn:not(.vkmd_download_in_progress)');
          downloadAllAction(chrome.i18n.getMessage("starting"))
        }
      });
    }
    updateDownloadAllButton(elParent);
    if (top) {
      elContainer.classList.add('vkmd_download_all_container_top');
      elParent.insertBefore(elContainer, elParent.firstChild);
    } else {
      elParent.appendChild(elContainer);
    }
  }

  function updateDownloadAllButton(elParent) {
    var elDownloadAllButton = elParent && elParent.querySelector('.vkmd_download_all_btn');
    if (!elDownloadAllButton) {
      return;
    }
    var elDownloadButtons = elParent.querySelectorAll('.vkmd_download_btn') || [];
    var elDownloadStartedButtons = elParent.querySelectorAll('.vkmd_download_btn.vkmd_download_in_progress') || [];
    var isDownloadInProgress = elDownloadStartedButtons.length > 0;
    if (isDownloadInProgress) {
      elDownloadAllButton.title = chrome.i18n.getMessage("cancel_download_all_title");
      elDownloadAllButton.classList.add('vkmd_download_all_btn_download_in_progress');
      elDownloadAllButton.innerText = chrome.i18n.getMessage("downloading") + ' ' + elDownloadStartedButtons.length + ' ' + chrome.i18n.getMessage("of") + ' ' + elDownloadButtons.length;
    } else {
      elDownloadAllButton.title = chrome.i18n.getMessage("start_download_all_title");
      elDownloadAllButton.classList.remove('vkmd_download_all_btn_download_in_progress');
      elDownloadAllButton.innerText = chrome.i18n.getMessage("download_all");
    }
    elDownloadAllButton.isDownloadInProgress = isDownloadInProgress
  }

  function processAudioNode(node) {
    if (node && !node.vkmd && node.nodeType === 1 && node.classList.contains('_audio_row')) {
      node.vkmd = true;
      attachDownloadButton(node);
      var parent = node.parentElement;
      if (parent) {
        var rows = parent.querySelectorAll('._audio_row') || [];
        if (rows.length > 1) {
          attachDownloadAllButton(parent, rows.length > 16);
        }
      }
    }
  }

  function processAudioNodes(node) {
    if (node.nodeType === 1) {
      processAudioNode(node);
      Array.prototype.forEach.call(node.querySelectorAll('._audio_row'), processAudioNode);
    }
  }

  function styleOpaqueIcon() {
    var style = document.createElement('style');
    style.innerHTML = '\
.vkmd_download_btn:not(.vkmd_download_in_progress),\
.vkmd_download_btn:not(.vkmd_download_in_progress):before{\
  background-color: rgba(0,0,0,.04);\
  opacity:.5;\
  transition:all .2s ease-in;\
}\
.audio_row:hover .vkmd_download_btn:not(.vkmd_download_in_progress),\
.audio_row:hover .vkmd_download_btn:not(.vkmd_download_in_progress):before{\
  opacity:1;\
}\
';
    document.head.appendChild(style);
  }


  chrome.runtime.sendMessage({command: 'getOptions'}, function(response) {
    // processing options
    options = response;
    // append custom style if enabled in options
    if (options.opaqueIcon) {
      styleOpaqueIcon();
    }
    // process existing nodes
    processAudioNodes(document.documentElement);
    // observing DOM modifications
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        Array.prototype.forEach.call(mutation.addedNodes, processAudioNodes);
      });
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  });
})(window, document);
