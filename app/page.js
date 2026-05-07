'use client';

import { useEffect, useRef } from 'react';

export default function Home() {
  const scriptsLoaded = useRef(false);

  useEffect(() => {
    if (scriptsLoaded.current) return;
    scriptsLoaded.current = true;

    // Load CSS
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = '/css/style.css';
    document.head.appendChild(cssLink);

    // Load scripts in order after mount
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        // Check if script already exists
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const scripts = [
      '/js/storage.js',
      '/js/data.js',
      '/js/tailor.js',
      '/js/discovery.js',
      '/js/interview.js',
      '/js/autoapply.js',
      '/js/board.js',
      '/js/analytics.js',
      '/js/cvtracker.js',
      '/js/digest.js',
      '/js/app.js',
    ];

    scripts.reduce((promise, src) => {
      return promise.then(() => loadScript(src));
    }, Promise.resolve());
  }, []);

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo">
            <span className="logo-mark">AP</span>
            <span className="logo-text">Apply Pilot</span>
          </div>
          <button className="sidebar-toggle" onClick={() => window.toggleSidebar?.()} type="button" aria-label="Toggle sidebar">
            ⇔
          </button>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item active" onClick={() => window.navigate?.('tailor')} id="nav-tailor" type="button">
            <span className="nav-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </span>
            <span className="nav-label">CV Tailor</span>
          </button>
          <button className="nav-item" onClick={() => window.navigate?.('discovery')} id="nav-discovery" type="button">
            <span className="nav-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <span className="nav-label">Discovery</span>
          </button>
          <button className="nav-item" onClick={() => window.navigate?.('interview')} id="nav-interview" type="button">
            <span className="nav-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19V6"></path>
                <path d="M5 12l7-7 7 7"></path>
              </svg>
            </span>
            <span className="nav-label">Interview Prep</span>
          </button>
          <button className="nav-item" onClick={() => window.navigate?.('autoapply')} id="nav-autoapply" type="button">
            <span className="nav-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="14" rx="2"></rect>
                <path d="M8 20h8"></path>
              </svg>
            </span>
            <span className="nav-label">Auto-Apply</span>
          </button>
          <button className="nav-item" onClick={() => window.navigate?.('board')} id="nav-board" type="button">
            <span className="nav-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </span>
            <span className="nav-label">Board</span>
          </button>
          <button className="nav-item" onClick={() => window.navigate?.('analytics')} id="nav-analytics" type="button">
            <span className="nav-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </span>
            <span className="nav-label">Analytics</span>
          </button>
          <button className="nav-item" onClick={() => window.navigate?.('cvtracker')} id="nav-cvtracker" type="button">
            <span className="nav-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </span>
            <span className="nav-label">CV Tracker</span>
          </button>
          <button className="nav-item" onClick={() => window.navigate?.('digest')} id="nav-digest" type="button">
            <span className="nav-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </span>
            <span className="nav-label">Weekly Digest</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div style={{ marginTop: '8px' }}>Apply Pilot · v1.0</div>
        </div>
      </aside>

      <main className="main">
        <div id="page-tailor"></div>
        <div id="page-discovery" className="hidden"></div>
        <div id="page-interview" className="hidden"></div>
        <div id="page-autoapply" className="hidden"></div>
        <div id="page-board" className="hidden"></div>
        <div id="page-analytics" className="hidden"></div>
        <div id="page-cvtracker" className="hidden"></div>
        <div id="page-digest" className="hidden"></div>
      </main>
    </>
  );
}
