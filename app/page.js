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
        <div className="sidebar-logo">Job Assistant</div>
        <nav className="sidebar-nav">
          <button className="nav-item active" onClick={() => window.navigate?.('tailor')} id="nav-tailor" type="button">
            CV Tailor
          </button>
          <button className="nav-item" onClick={() => window.navigate?.('board')} id="nav-board" type="button">
            Board
          </button>
          <button className="nav-item" onClick={() => window.navigate?.('analytics')} id="nav-analytics" type="button">
            Analytics
          </button>
          <button className="nav-item" onClick={() => window.navigate?.('cvtracker')} id="nav-cvtracker" type="button">
            CV Tracker
          </button>
          <button className="nav-item" onClick={() => window.navigate?.('digest')} id="nav-digest" type="button">
            Weekly Digest
          </button>
        </nav>
        <div className="sidebar-footer">Next.js migration · v2.0</div>
      </aside>

      <main className="main">
        <div id="page-tailor"></div>
        <div id="page-board" className="hidden"></div>
        <div id="page-analytics" className="hidden"></div>
        <div id="page-cvtracker" className="hidden"></div>
        <div id="page-digest" className="hidden"></div>
      </main>
    </>
  );
}
