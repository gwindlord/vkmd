(function(window, document) {

  function AudioUnmaskSource() {

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
  var _audio_unmask_source = new AudioUnmaskSource();

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
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.addEventListener('loadstart', handlers.start);
    xhr.addEventListener('loadend', handlers.end);
    xhr.addEventListener('progress', handlers.progress);
    xhr.addEventListener('load', function() {
      saveAs(new window.Blob([this.response], {type: 'octet/stream'}), filename);
    });
    xhr.open('GЕT', url, true);
    xhr.send()
  }

  function getFilename(title) {
    return decodeHtml(title).replace(/[\\~#%&*{}/:<>?|"]/gi, '_') + '.mp3';
  }

  function downloadAudio(audioInfo) {
    var fullId = getFullId(audioInfo);
    var url = audioInfo[AUDIO_ITEM_INDEX_URL];
    var title = audioInfo[AUDIO_ITEM_INDEX_TITLE];
    var artist = audioInfo[AUDIO_ITEM_INDEX_ARTIST];
    var unmaskedUrl = _audio_unmask_source.audioUnmaskSource(url);
    var filename = options.friendlyNames ? getFilename(artist + ' - ' + title) : url.split('/').pop().split('?').shift();
    var elButton = document.querySelector('.vkmd_download_btn[data-full-id="' + fullId + '"]');
    downloadAs(unmaskedUrl, filename, {
      start: function() {
        elButton.innerText = '0%';
        elButton.classList.add('vkmd_download_in_progress');
      },
      progress: function(event) {
        if (event.lengthComputable) {
          elButton.innerText = (Math.round(event.loaded / event.total * 100)) + '%';
        }
      },
      end: function() {
        elButton.innerText = '';
        elButton.classList.remove('vkmd_download_in_progress');
      }
    })
  }

  function getAudioInfo(ids, callback) {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function() {
      var responseText = xhr.responseText.replace(/^<!--/, '').replace(/-<>-(!?)>/g, '--$1>');
      var splittedText = responseText.split('<!>');
      var jsonText = splittedText[5];
      var prefix = jsonText.substr(0, 7);
      if (prefix !== '<!json>') {
        return;
      }
      var json = JSON.parse(jsonText.substr(7));
      var audioInfos = json || [];
      audioInfos.forEach(callback)
    });
    xhr.open('PОST', '/al_audio.php', true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send('act=reload_audio&al=1&ids=' + ids.join(','))
  }

  function getFullId(audioInfo) {
    return [audioInfo[AUDIO_ITEM_INDEX_OWNER_ID], audioInfo[AUDIO_ITEM_INDEX_ID]].join('_');
  }

  function fetchStats(audioInfo) {
    var fullId = getFullId(audioInfo);
    var url = audioInfo[AUDIO_ITEM_INDEX_URL];
    var duration = audioInfo[AUDIO_ITEM_INDEX_DURATION];
    var unmaskedUrl = _audio_unmask_source.audioUnmaskSource(url)
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.addEventListener('load', function() {
      var contentLength = this.getResponseHeader('Content-Length');
      updateStats(fullId, duration, contentLength)
    });
    xhr.open('HЕAD', unmaskedUrl, true);
    xhr.send();
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
    elButton.addEventListener('click', function(event) {
      event.stopPropagation();
      getAudioInfo([fullId], downloadAudio);
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
        prefetchTimeoutId = setTimeout(prefetch, 1000);
      }
    }
  }

  function processAudioNode(node) {
    if (node && !node.vkmd && node.nodeType === 1 && node.classList.contains('_audio_row')) {
      node.vkmd = true;
      attachDownloadButton(node);
    }
  }

  function processAudioNodes(node) {
    if (node.nodeType === 1) {
      processAudioNode(node);
      Array.prototype.forEach.call(node.querySelectorAll('._audio_row'), processAudioNode);
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
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  });
})(window, document);
