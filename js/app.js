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

function clearPersonalData() {
  const ok = window.confirm(
    'Refresh session by clearing saved CV text only? Your application tracker history will stay.'
  );
  if (!ok) return;
  Data.clearSession();
  window.location.reload();
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
