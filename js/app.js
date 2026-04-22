// ─────────────────────────────────────────────
// app.js — fetch patch and router
// API key: set window.ANTHROPIC_API_KEY in js/secrets.local.js (see secrets.local.example.js)
// ─────────────────────────────────────────────

const ANTHROPIC_API_KEY =
  typeof window.ANTHROPIC_API_KEY === 'string' ? window.ANTHROPIC_API_KEY.trim() : '';

if (!ANTHROPIC_API_KEY) {
  console.warn(
    'Job Assistant: No API key. Copy js/secrets.local.example.js to js/secrets.local.js and add your key.'
  );
}

// Patch fetch so every call to Anthropic gets the key injected automatically
(function () {
  const _fetch = window.fetch.bind(window);
  window.fetch = function (url, opts) {
    opts = opts || {};
    if (typeof url === 'string' && url.includes('api.anthropic.com')) {
      opts.headers = Object.assign({}, opts.headers, {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      });
    }
    return _fetch(url, opts);
  };
})();

// ── Router ────────────────────────────────────
function navigate(page) {
  ['tailor', 'board', 'analytics', 'cvtracker', 'digest'].forEach(function (p) {
    document.getElementById('page-' + p).classList.toggle('hidden', p !== page);
    document.getElementById('nav-' + p).classList.toggle('active', p === page);
  });
}

// ── Boot ──────────────────────────────────────
window.addEventListener('DOMContentLoaded', function () {
  Data.load();
  Tailor.init();
  Board.init();
  Analytics.init();
  CVTracker.init();
  Digest.init();
  navigate('tailor');
});
