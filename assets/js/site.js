/* =========================================================
   Jared Scott: site script
   - Draws the header and footer on every page (edit the menu once, here).
   - Builds the article lists, latest writing, and book list from the two
     data files: articles.json and books.json.
   Load it as the first thing inside <body>:
     <script src="assets/js/site.js"></script>
   ========================================================= */
(function () {
  'use strict';

  var script = document.currentScript;
  var src = script.getAttribute('src') || 'assets/js/site.js';
  var root = src.replace(/assets\/js\/site\.js.*$/, '');          // "", "../", "../../" or "/"
  var chrome = script.getAttribute('data-chrome') || 'full';      // full | bar | none
  var html = document.documentElement;
  html.classList.add('js');
  html.classList.remove('no-js');

  /* ---------- the menu: the ONE place to change it ---------- */
  var NAV = [
    ['Consulting', 'consulting/'],
    ['Leadership Development', 'leadership-development/'],
    ['Articles', 'articles/'],
    ['Books', 'books/'],
    ['About', 'about/']
  ];
  var CONTACT = ['Contact', 'contact.html'];
  var HOME = 'home.html';

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function getJSON(path) {
    return fetch(root + path).then(function (r) {
      if (!r.ok) throw new Error(path + ' ' + r.status);
      return r.json();
    });
  }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function fmtDate(d) {
    if (!d) return '';
    var dt = new Date(d + 'T00:00:00');
    if (isNaN(dt)) return '';
    return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  // Newest first. Articles without a date come after, A to Z.
  function sortArticles(list) {
    return list.slice().sort(function (a, b) {
      if (a.date && b.date) return a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title);
      if (a.date) return -1;
      if (b.date) return 1;
      return a.title.localeCompare(b.title);
    });
  }

  /* ---------- which menu item is "current" ---------- */
  var sitePath = new URL(root || './', location.href).pathname;
  var rel = location.pathname.slice(sitePath.length).replace(/^\/+/, '');
  var section = rel.split('/')[0];
  function isCurrent(href) {
    var first = href.split('/')[0];
    return first === section;
  }

  /* ---------- header ---------- */
  function headerHTML() {
    var links = NAV.map(function (n) {
      return '<a href="' + root + n[1] + '"' + (isCurrent(n[1]) ? ' aria-current="page"' : '') + '>' + esc(n[0]) + '</a>';
    }).join('');
    links += '<a class="btn btn--small" href="' + root + CONTACT[1] + '"' + (isCurrent(CONTACT[1]) ? ' aria-current="page"' : '') + '>' + CONTACT[0] + '</a>';
    return '<a class="skip" href="#main">Skip to content</a>' +
      '<header class="site-header"><div class="wrap">' +
      '<a class="brand" href="' + root + HOME + '">Jared Scott</a>' +
      '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>' +
      '<nav class="nav" id="site-nav" aria-label="Main">' + links + '</nav>' +
      '</div></header>';
  }
  // Older article pages keep their own look, so they get a small bar with its own class names.
  function barHTML() {
    var links = NAV.concat([CONTACT]).map(function (n) {
      return '<a href="' + root + n[1] + '">' + esc(n[0]) + '</a>';
    }).join('');
    return '<div class="jsb"><div class="jsb-in"><a class="jsb-brand" href="' + root + HOME + '">Jared Scott</a>' +
      '<nav class="jsb-nav" aria-label="Site">' + links + '</nav></div></div>';
  }
  function footerHTML() {
    var year = new Date().getFullYear();
    var links = [['Home', HOME]].concat(NAV, [CONTACT]).map(function (n) {
      return '<a href="' + root + n[1] + '">' + esc(n[0]) + '</a>';
    }).join('');
    if (chrome === 'bar') {
      return '<footer class="jsb-foot"><div class="jsb-foot-in"><p><strong>Jared Scott</strong> Leadership, workforce development, and practical AI.</p>' +
        '<nav aria-label="Footer">' + links + '</nav></div></footer>';
    }
    return '<footer class="site-footer"><div class="wrap">' +
      '<div class="footer-grid">' +
      '<div class="footer-brand"><strong>Jared Scott</strong><p>Leadership, workforce development, practical AI, writing, and speaking grounded in real operating experience.</p></div>' +
      '<nav class="footer-nav" aria-label="Footer">' + links + '</nav></div>' +
      '<div class="footer-legal"><img src="' + root + 'assets/img/als-emblem.webp" alt="" width="44" height="44">' +
      '<p>Authentic Leadership Solutions. Independent consulting, training, speaking, and writing.<br>&copy; ' + year + ' Jared Scott. All rights reserved.</p></div>' +
      '</div></footer>';
  }

  if (chrome === 'full') script.insertAdjacentHTML('afterend', headerHTML());
  if (chrome === 'bar') script.insertAdjacentHTML('afterend', barHTML());

  /* ---------- article rows ---------- */
  function entryNode(a, opts) {
    opts = opts || {};
    var row = el('article', 'entry');
    var meta = el('div', 'entry-meta');
    if (opts.part) {
      meta.appendChild(el('b', '', opts.part));
    } else {
      meta.appendChild(el('b', '', a.category));
      if (a.series && a.part) meta.appendChild(el('span', '', a.series + ', part ' + a.part));
    }
    var d = fmtDate(a.date);
    if (d) meta.appendChild(el('span', '', d));
    var main = el('div', 'entry-main');
    var h = el('h3');
    var link = el('a', '', a.title);
    link.href = root + a.url;
    h.appendChild(link);
    main.appendChild(h);
    if (a.summary) main.appendChild(el('p', '', a.summary));
    row.appendChild(meta);
    row.appendChild(main);
    return row;
  }

  /* ---------- the Articles page ---------- */
  function initArticles(box) {
    var tabsBox = box.querySelector('[data-tabs]');
    var input = box.querySelector('[data-search]');
    var status = box.querySelector('[data-status]');
    var out = box.querySelector('[data-list]');
    getJSON('articles.json').then(function (all) {
      var ORDER = ['Leadership', 'Faith', 'Recovery', 'Relationships'];
      var cats = [];
      all.forEach(function (a) { if (cats.indexOf(a.category) < 0) cats.push(a.category); });
      cats.sort(function (a, b) {
        var ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
        if (ia < 0) ia = 99; if (ib < 0) ib = 99;
        return ia - ib || a.localeCompare(b);
      });
      var current = '';
      var fromHash = decodeURIComponent((location.hash || '').replace('#', '')).toLowerCase();
      cats.forEach(function (c) { if (slug(c) === fromHash) current = c; });

      function drawTabs() {
        tabsBox.innerHTML = '';
        [''].concat(cats).forEach(function (c) {
          var n = c ? all.filter(function (a) { return a.category === c; }).length : all.length;
          var b = el('button', '', c || 'All');
          b.type = 'button';
          b.setAttribute('aria-pressed', String(c === current));
          b.appendChild(el('span', 'count', String(n)));
          b.addEventListener('click', function () {
            current = c;
            history.replaceState(null, '', c ? '#' + slug(c) : location.pathname + location.search);
            draw();
          });
          tabsBox.appendChild(b);
        });
      }

      function draw() {
        drawTabs();
        var q = (input.value || '').trim().toLowerCase();
        var terms = q ? q.split(/\s+/) : [];
        var scope = all.filter(function (a) { return !current || a.category === current; });
        var list = scope.filter(function (a) {
          if (!terms.length) return true;
          var hay = (a.title + ' ' + a.category + ' ' + (a.summary || '') + ' ' + (a.series || '')).toLowerCase();
          return terms.every(function (t) { return hay.indexOf(t) >= 0; });
        });
        out.innerHTML = '';
        var label = list.length + (list.length === 1 ? ' article' : ' articles') + (current ? ' in ' + current : '');
        status.textContent = label;
        if (!list.length) {
          out.appendChild(el('p', 'empty', 'No articles match that search. Clear the box to see everything.'));
          return;
        }
        var grouped = current && !terms.length && list.some(function (a) { return a.series; });
        if (!grouped) {
          sortArticles(list).forEach(function (a) { out.appendChild(entryNode(a)); });
          return;
        }
        // Inside a category, show a numbered series together, in order.
        var single = sortArticles(list.filter(function (a) { return !a.series; }));
        var series = {};
        list.filter(function (a) { return a.series; }).forEach(function (a) { (series[a.series] = series[a.series] || []).push(a); });
        if (single.length) {
          var first = el('div', 'entries');
          single.forEach(function (a) { first.appendChild(entryNode(a)); });
          out.appendChild(first);
        }
        Object.keys(series).sort().forEach(function (name) {
          var parts = series[name].sort(function (a, b) { return (a.part || 0) - (b.part || 0); });
          var head = el('div', 'series-head');
          var h = el('h2', '', name);
          h.id = slug(name);
          head.appendChild(h);
          head.appendChild(el('p', '', 'A series of ' + parts.length + ', best read in order.'));
          out.appendChild(head);
          var wrap = el('div', 'entries');
          parts.forEach(function (a) { wrap.appendChild(entryNode(a, { part: 'Part ' + a.part + ' of ' + parts.length })); });
          out.appendChild(wrap);
        });
      }

      input.addEventListener('input', draw);
      window.addEventListener('hashchange', function () {
        var h = decodeURIComponent((location.hash || '').replace('#', '')).toLowerCase();
        current = '';
        cats.forEach(function (c) { if (slug(c) === h) current = c; });
        draw();
      });
      draw();
    }).catch(function () {
      out.innerHTML = '<p class="empty">The article list could not load. Please refresh the page.</p>';
    });
  }

  /* ---------- Home: latest writing ---------- */
  function initLatest(box) {
    var n = parseInt(box.getAttribute('data-latest'), 10) || 3;
    getJSON('articles.json').then(function (all) {
      var dated = sortArticles(all.filter(function (a) { return a.date; })).slice(0, n);
      box.innerHTML = '';
      dated.forEach(function (a) { box.appendChild(entryNode(a)); });
    }).catch(function () { box.innerHTML = ''; });
  }

  /* ---------- Books page ---------- */
  function initBooks(box) {
    getJSON('books.json').then(function (books) {
      box.innerHTML = '';
      books.forEach(function (b) {
        var card = el('article', 'book');
        var frame = el('a', 'cover-img');
        frame.href = b.amazonUrl; frame.target = '_blank'; frame.rel = 'noopener';
        frame.setAttribute('aria-label', b.title + ' on Amazon');
        var img = document.createElement('img');
        img.src = root + b.cover; img.alt = 'Cover of ' + b.title; img.loading = 'lazy';
        frame.appendChild(img);
        card.appendChild(frame);
        card.appendChild(el('h3', '', b.title));
        if (b.subtitle) card.appendChild(el('p', 'sub', b.subtitle));
        if (b.description) card.appendChild(el('p', 'desc', b.description));
        var btn = el('a', 'btn btn--small', 'View on Amazon');
        btn.href = b.amazonUrl; btn.target = '_blank'; btn.rel = 'noopener';
        card.appendChild(btn);
        box.appendChild(card);
      });
    }).catch(function () {
      box.innerHTML = '<p class="empty">The book list could not load. Please refresh the page.</p>';
    });
  }

  /* ---------- Contact form (Web3Forms) ---------- */
  function initContact(form) {
    var statusEl = document.getElementById('formStatus');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var key = form.querySelector('[name="access_key"]').value;
      if (!key || key === 'YOUR_WEB3FORMS_ACCESS_KEY') {
        statusEl.textContent = 'This form is not connected yet. Please check back shortly.';
        statusEl.className = 'form-status err';
        return;
      }
      statusEl.textContent = 'Sending\u2026';
      statusEl.className = 'form-status';
      fetch('https://api.web3forms.com/submit', { method: 'POST', body: new FormData(form) })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.success) {
            statusEl.textContent = 'Thank you. Your message has been sent.';
            statusEl.className = 'form-status ok';
            form.reset();
          } else {
            statusEl.textContent = (res.message || 'Something went wrong.') + ' Please try again in a moment.';
            statusEl.className = 'form-status err';
          }
        })
        .catch(function () {
          statusEl.textContent = 'Network error. Please try again in a moment.';
          statusEl.className = 'form-status err';
        });
    });
  }

  /* ---------- Landing page: Enter ---------- */
  function initLanding(link) {
    var go = function () {
      if (document.body.classList.contains('is-leaving')) return;
      document.body.classList.add('is-leaving');
      setTimeout(function () { location.href = link.href; }, 340);
    };
    link.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
      e.preventDefault();
      go();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (document.activeElement === document.body || document.activeElement === document.documentElement)) go();
    });
    // If the person comes back with the Back button, undo the fade.
    window.addEventListener('pageshow', function () { document.body.classList.remove('is-leaving'); });
  }

  /* ---------- start everything once the page is ready ---------- */
  function ready() {
    if (chrome !== 'none') document.body.insertAdjacentHTML('beforeend', footerHTML());

    var btn = document.querySelector('.menu-btn');
    var nav = document.getElementById('site-nav');
    if (btn && nav) {
      btn.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
        btn.textContent = open ? 'Close' : 'Menu';
      });
    }
    var a;
    if ((a = document.getElementById('articles-app'))) initArticles(a);
    if ((a = document.querySelector('[data-latest]'))) initLatest(a);
    if ((a = document.querySelector('[data-books]'))) initBooks(a);
    if ((a = document.getElementById('contactForm'))) initContact(a);
    if ((a = document.querySelector('[data-enter]'))) initLanding(a);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
