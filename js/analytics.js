var lang = String(navigator.language || '');
var isRU = (/ru/i).test(lang);
console.log(lang, isRU);
// only do tracking for RU locale
if (isRU) {
  runFunctionInPageContext(function () {
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o);
    a.async=1;a.src=g;document.documentElement.appendChild(a)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
  });

  // all Google Analytics calls should use our tracker name
  // and be run inside the page's context
  runFunctionInPageContext(function () {
    ga('create', 'UA-10665966-4', 'auto', {'name': 'vkmd'});
    ga('vkmd.send', 'pageview');
  });

  // simple helper function
  function runFunctionInPageContext(fn) {
    var script = document.createElement('script');
    script.textContent = '(' + fn.toString() + '());';
    document.documentElement.appendChild(script);
    document.documentElement.removeChild(script);
  }
}
