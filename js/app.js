// ─────────────────────────────────────────────
// app.js — router + boot
// Anthropic calls are proxied via server API route (/api/anthropic)
// ─────────────────────────────────────────────

// ── Router ────────────────────────────────────
function navigate(page) {
  ['tailor', 'discovery', 'interview', 'autoapply', 'board', 'analytics', 'cvtracker', 'digest'].forEach(function (p) {
    document.getElementById('page-' + p).classList.toggle('hidden', p !== page);
    document.getElementById('nav-' + p).classList.toggle('active', p === page);
  });
}

function applySidebarState() {
  try {
    var collapsed = localStorage.getItem('ap-sidebar-collapsed') === '1';
    document.body.classList.toggle('sidebar-collapsed', collapsed);
  } catch (e) {
    // no-op
  }
}

function toggleSidebar() {
  var isCollapsed = document.body.classList.toggle('sidebar-collapsed');
  try {
    localStorage.setItem('ap-sidebar-collapsed', isCollapsed ? '1' : '0');
  } catch (e) {
    // no-op
  }
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
  console.log('[DEBUG] Booting Apply Pilot...');
  applySidebarState();
  Data.load();
  Tailor.init();
  Discovery.init();
  InterviewPrep.init();
  AutoApply.init();
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
