// ─────────────────────────────────────────────
// app.js — router + boot
// Anthropic calls are proxied via server API route (/api/anthropic)
// ─────────────────────────────────────────────

// ── Router ────────────────────────────────────
function navigate(page) {
  ['tailor', 'board', 'analytics', 'cvtracker', 'digest'].forEach(function (p) {
    document.getElementById('page-' + p).classList.toggle('hidden', p !== page);
    document.getElementById('nav-' + p).classList.toggle('active', p === page);
  });
}

// ── Boot ──────────────────────────────────────
function boot() {
  console.log('[DEBUG] Booting Job Assistant...');
  Data.load();
  Tailor.init();
  Board.init();
  Analytics.init();
  CVTracker.init();
  Digest.init();
  navigate('tailor');
  console.log('[DEBUG] Boot complete');
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
