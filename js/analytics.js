var lang = String(navigator.language || '');
var isRU = (/ru/i).test(lang);
// only do analytics for RU locale
if (isRU) {
  run(function () {
    // this code is provided by google analytics as is
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o);
    m=function(){a.parentNode.removeChild(a)};a.onload=a.onerror=m;
    a.async=1;a.src=g;s.head.appendChild(a)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
  });

  run(function () {
    ga('create', 'UA-10665966-4', 'auto', {'name': 'vkmd'});
    ga('vkmd.send', 'pageview');
  });

  // simple helper function
  function run(fn) {
    var script = document.createElement('script');
    script.textContent = '(' + fn.toString() + '());';
    document.documentElement.appendChild(script);
    document.documentElement.removeChild(script);
  }
}
