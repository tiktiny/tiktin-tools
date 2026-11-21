/* מדידת שימוש באפליקציות טיקטין — בלי שמות משתמשים ובלי כתובות רשת.
   נשלחים: איזה אתר, מה נפתח או הורד, סוג המכשיר ומיקום משוער (עיר ומדינה). */
(function () {
  var URL = 'https://script.google.com/macros/s/AKfycbx0AvcfW7qws-CUUZbpIsVILxuobq18sVkjw6NqULMxfhZnM6Xp8ClZQnW5dtooz90J/exec';
  if (!URL || URL.indexOf('http') !== 0) return;
  var APP = document.documentElement.getAttribute('data-app') || location.pathname.split('/')[1] || 'portal';
  function vid() {
    try {
      var v = localStorage.getItem('tiktin_vid');
      if (!v) { v = Math.random().toString(36).slice(2, 10); localStorage.setItem('tiktin_vid', v); }
      return v;
    } catch (e) { return ''; }
  }
  function dev() {
    var u = navigator.userAgent, os = /Windows/.test(u) ? 'Windows' : /Android/.test(u) ? 'Android' :
      /iPhone|iPad/.test(u) ? 'iOS' : /Mac OS/.test(u) ? 'Mac' : /Linux/.test(u) ? 'Linux' : 'אחר';
    var br = /Edg\//.test(u) ? 'Edge' : /Chrome\//.test(u) ? 'Chrome' : /Firefox\//.test(u) ? 'Firefox' :
      /Safari\//.test(u) ? 'Safari' : 'אחר';
    var mob = /Mobi|Android|iPhone/.test(u);
    return {device: mob ? 'טלפון' : (/iPad|Tablet/.test(u) ? 'טאבלט' : 'מחשב'), os: os, browser: br};
  }
  var geo = null, queue = [];
  function place(cb) {
    if (geo) return cb(geo);
    try { var s = sessionStorage.getItem('tiktin_geo'); if (s) { geo = JSON.parse(s); return cb(geo); } } catch (e) {}
    queue.push(cb);
    if (queue.length > 1) return;
    fetch('https://ipwho.is/?fields=country,city', {cache: 'no-store'}).then(function (r) { return r.json(); })
      .catch(function () { return {}; }).then(function (j) {
        geo = {country: j.country || '', city: j.city || ''};
        try { sessionStorage.setItem('tiktin_geo', JSON.stringify(geo)); } catch (e) {}
        var q = queue; queue = []; q.forEach(function (f) { f(geo); });
      });
  }
  function send(action, target) {
    place(function (g) {
      var d = dev(), body = JSON.stringify({app: APP, action: action, target: target || '', device: d.device,
        os: d.os, browser: d.browser, country: g.country, city: g.city, vid: vid()});
      try {
        if (!(navigator.sendBeacon && navigator.sendBeacon(URL, new Blob([body], {type: 'text/plain'}))))
          fetch(URL, {method: 'POST', mode: 'no-cors', body: body, keepalive: true});
      } catch (e) {}
    });
  }
  window.tiktinTrack = send;
  send('open', document.title);
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a');
    if (!a) return;
    if (a.classList.contains('dl')) {
      var f = a.getAttribute('href').split('/').pop();
      var h = a.closest('.prog'); send('download', (h && h.querySelector('h2') ? h.querySelector('h2').textContent + ' – ' : '') + f);
    } else if (a.classList.contains('tool')) {
      var t = a.querySelector('h3'); send('app', t ? t.textContent : a.href);
    } else if (a.classList.contains('hlink')) {
      send('nav', a.textContent.trim());
    }
  }, true);
})();
